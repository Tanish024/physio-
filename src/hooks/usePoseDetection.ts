import { useEffect, useRef, useState } from 'react';
import type { Pose, Keypoint } from '../types/pose';

// Use MediaPipe Pose Landmarker for better multi-angle robustness.
// We map its 33 landmarks to the app's 17-keypoint format to keep existing UI and logic.
export function usePoseDetection() {
  const landmarkerRef = useRef<any>(null);
  const moveNetRef = useRef<any>(null);
  const runningModeRef = useRef<'IMAGE' | 'VIDEO'>('VIDEO');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Performance tracking
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const processingTimeRef = useRef(0);
  const targetFPSRef = useRef(30);
  const frameSkipCounterRef = useRef(0);
  const adaptiveFrameSkipRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMoveNetFallback() {
      try {
        await import('@tensorflow/tfjs-backend-webgl');
        const tf = await import('@tensorflow/tfjs');
        await tf.setBackend('webgl');
        await tf.ready();
        if (tf.getBackend() !== 'webgl') {
          await import('@tensorflow/tfjs-backend-cpu');
          await tf.setBackend('cpu');
          await tf.ready();
        }
        const poseDetection = await import('@tensorflow-models/pose-detection');
        const det = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
        );
        if (!cancelled) {
          moveNetRef.current = det;
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('MoveNet fallback load error:', err);
        if (!cancelled) {
          setError('Failed to load pose detector');
          setIsLoading(false);
        }
      }
    }

    async function loadLandmarker() {
      try {
        const visionNs: any = await import('@mediapipe/tasks-vision');
        const { FilesetResolver, PoseLandmarker } = visionNs;
        // Use the official Google CDN for MediaPipe models
        const wasmBase = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
        const modelPath = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

        const vision = await FilesetResolver.forVisionTasks(wasmBase);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { 
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          runningModeRef.current = 'VIDEO';
          setIsLoading(false);
          setError(null);
        }
      } catch (e) {
        console.error('PoseLandmarker load error:', e);
        // Fallback to MoveNet if MediaPipe fails
        await loadMoveNetFallback();
      }
    }

    loadLandmarker();
    return () => { cancelled = true; };
  }, []);

  function selectPrimaryPerson(poseList: any[]): any[] | null {
    if (!poseList || poseList.length === 0) return null;
    if (poseList.length === 1) return poseList[0];

    // Multi-person detection: select the person with:
    // 1. Highest overall confidence
    // 2. Most central position (closest to center of frame)
    // 3. Largest pose (better visibility)
    let bestPose = poseList[0];
    let bestScore = 0;

    for (const pose of poseList) {
      // Calculate average visibility/confidence
      const avgConfidence = pose.reduce((sum: number, point: any) => 
        sum + (point.visibility ?? 0.5), 0) / pose.length;
      
      // Calculate pose size (shoulder to hip distance)
      const leftShoulder = pose[11] || { x: 0.5, y: 0.3 };
      const rightShoulder = pose[12] || { x: 0.5, y: 0.3 };
      const leftHip = pose[23] || { x: 0.5, y: 0.7 };
      const rightHip = pose[24] || { x: 0.5, y: 0.7 };
      
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      const torsoHeight = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2);
      const poseSize = shoulderWidth + torsoHeight;
      
      // Calculate centrality (distance from center)
      const centerX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
      const centerY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
      const distanceFromCenter = Math.abs(centerX - 0.5) + Math.abs(centerY - 0.5);
      
      // Composite score: confidence (40%) + size (30%) + centrality (30%)
      const compositeScore = (avgConfidence * 0.4) + (poseSize * 0.3) + ((1 - distanceFromCenter) * 0.3);
      
      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestPose = pose;
      }
    }

    return bestPose;
  }

  function mapToPose(landmarks: any[], width: number, height: number): Pose {
    // MediaPipe indices: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
    const MP = {
      nose: 0,
      leftEye: 2,
      rightEye: 5,
      leftEar: 7,
      rightEar: 8,
      leftShoulder: 11,
      rightShoulder: 12,
      leftElbow: 13,
      rightElbow: 14,
      leftWrist: 15,
      rightWrist: 16,
      leftHip: 23,
      rightHip: 24,
      leftKnee: 25,
      rightKnee: 26,
      leftAnkle: 27,
      rightAnkle: 28,
    } as const;

    const pick = (i: number, name: string): Keypoint => {
      const p = landmarks[i] || {};
      return {
        x: (p.x ?? 0) * width,
        y: (p.y ?? 0) * height,
        score: p.visibility ?? 0.9,
        name,
      } as Keypoint;
    };

    const keypoints: Keypoint[] = [
      pick(MP.nose, 'nose'),
      pick(MP.leftEye, 'leftEye'),
      pick(MP.rightEye, 'rightEye'),
      pick(MP.leftEar, 'leftEar'),
      pick(MP.rightEar, 'rightEar'),
      pick(MP.leftShoulder, 'leftShoulder'),
      pick(MP.rightShoulder, 'rightShoulder'),
      pick(MP.leftElbow, 'leftElbow'),
      pick(MP.rightElbow, 'rightElbow'),
      pick(MP.leftWrist, 'leftWrist'),
      pick(MP.rightWrist, 'rightWrist'),
      pick(MP.leftHip, 'leftHip'),
      pick(MP.rightHip, 'rightHip'),
      pick(MP.leftKnee, 'leftKnee'),
      pick(MP.rightKnee, 'rightKnee'),
      pick(MP.leftAnkle, 'leftAnkle'),
      pick(MP.rightAnkle, 'rightAnkle'),
    ];
    const score = keypoints.reduce((s, k) => s + (k.score || 0), 0) / keypoints.length;
    return { keypoints, score } as Pose;
  }

  // Performance monitoring functions
  const shouldSkipFrame = () => {
    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTimeRef.current;
    const targetInterval = 1000 / targetFPSRef.current;
    
    // Adaptive frame skipping based on processing time
    if (adaptiveFrameSkipRef.current) {
      frameSkipCounterRef.current++;
      if (frameSkipCounterRef.current < 2) { // Skip every other frame when struggling
        return true;
      }
      frameSkipCounterRef.current = 0;
    }
    
    // Regular frame rate limiting
    if (timeSinceLastFrame < targetInterval * 0.8) { // Allow 20% buffer
      return true;
    }
    
    lastFrameTimeRef.current = now;
    return false;
  };

  const updatePerformanceMetrics = (processingTime: number) => {
    processingTimeRef.current = processingTime;
    frameCountRef.current++;
    
    // Enable adaptive frame skipping if processing is too slow
    const targetProcessingTime = (1000 / targetFPSRef.current) * 0.7; // 70% of frame budget
    adaptiveFrameSkipRef.current = processingTime > targetProcessingTime;
    
    // Log performance every 100 frames
    if (frameCountRef.current % 100 === 0) {
      console.log(`Pose Detection Performance: ${processingTime.toFixed(2)}ms per frame, Adaptive skip: ${adaptiveFrameSkipRef.current}`);
    }
  };

  const detectPose = async (
    media: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    options: { skipFrameCheck?: boolean; forceDetection?: boolean } = {}
  ): Promise<Pose | null> => {
    const startTime = Date.now();
    
    // Performance-based frame skipping (unless forced)
    if (!options.forceDetection && !options.skipFrameCheck && shouldSkipFrame()) {
      return null;
    }
    
    const lm = landmarkerRef.current;
    const mn = moveNetRef.current;

    try {
      // Prefer MediaPipe if available
      if (lm) {
        let width = 0, height = 0;
        if (media instanceof HTMLVideoElement) {
          width = media.videoWidth; height = media.videoHeight;
          if (runningModeRef.current !== 'VIDEO') {
            await lm.setOptions({ runningMode: 'VIDEO' });
            runningModeRef.current = 'VIDEO';
          }
          const res = lm.detectForVideo(media, performance.now());
          const list = (res?.landmarks ?? res?.poseLandmarks ?? []) as any[];
          const primaryPose = selectPrimaryPerson(list);
          if (!primaryPose) return null;
          return mapToPose(primaryPose, width, height);
        }
        // IMAGE mode
        if (runningModeRef.current !== 'IMAGE') {
          await lm.setOptions({ runningMode: 'IMAGE' });
          runningModeRef.current = 'IMAGE';
        }
        if (media instanceof HTMLImageElement) {
          width = media.naturalWidth || media.width;
          height = media.naturalHeight || media.height;
          const res = lm.detect(media);
          const list = (res?.landmarks ?? res?.poseLandmarks ?? []) as any[];
          const primaryPose = selectPrimaryPerson(list);
          if (!primaryPose) return null;
          return mapToPose(primaryPose, width, height);
        } else {
          const canvas = media as HTMLCanvasElement;
          width = canvas.width; height = canvas.height;
          const res = lm.detect(canvas as any);
          const list = (res?.landmarks ?? res?.poseLandmarks ?? []) as any[];
          const primaryPose = selectPrimaryPerson(list);
          if (!primaryPose) return null;
          return mapToPose(primaryPose, width, height);
        }
      }

      // Fallback to MoveNet if available
      if (mn) {
        const poses = await mn.estimatePoses(media as any);
        if (poses && poses.length > 0) return poses[0] as Pose;
        return null;
      }
      return null;
    } catch (err) {
      console.error('Pose detection error:', err);
      return null;
    } finally {
      // Update performance metrics
      const processingTime = Date.now() - startTime;
      updatePerformanceMetrics(processingTime);
    }
  };

  return { 
    detector: landmarkerRef.current || moveNetRef.current, 
    detectPose, 
    isLoading, 
    error,
    shouldSkipFrame,
    getPerformanceMetrics: () => ({
      frameCount: frameCountRef.current,
      avgProcessingTime: processingTimeRef.current,
      adaptiveSkipEnabled: adaptiveFrameSkipRef.current,
      targetFPS: targetFPSRef.current
    }),
    setTargetFPS: (fps: number) => { targetFPSRef.current = fps; }
  };
}
