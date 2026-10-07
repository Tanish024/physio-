import { useState, useRef, useCallback, useEffect } from 'react';
import { Pose, AccuracyMetrics } from '../types/pose';

export interface DualVideoProcessorState {
  trainerPose: Pose | null;
  userPose: Pose | null;
  accuracy: AccuracyMetrics;
  isProcessing: boolean;
  frameRate: number;
  syncStatus: 'synced' | 'out_of_sync' | 'no_trainer';
  jointFeedback: Record<string, {
    accuracy: number;
    suggestion: string;
    severity: 'good' | 'minor' | 'moderate' | 'major';
  }>;
}

export interface DualVideoProcessorConfig {
  targetFPS: number;
  temporalSmoothingFactor: number;
  accuracyThreshold: number;
  frameSkipThreshold: number; // Skip frames if processing is too slow
  maxBufferSize: number;
}

export interface TemporalBuffer {
  poses: Pose[];
  timestamps: number[];
  accuracyScores: number[];
}

const DEFAULT_CONFIG: DualVideoProcessorConfig = {
  targetFPS: 30,
  temporalSmoothingFactor: 0.15,
  accuracyThreshold: 0.7,
  frameSkipThreshold: 50, // ms
  maxBufferSize: 10
};

export function useDualVideoProcessor(
  detectPose: (media: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => Promise<Pose | null>,
  config: Partial<DualVideoProcessorConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<DualVideoProcessorState>({
    trainerPose: null,
    userPose: null,
    accuracy: { overall: 0, upperBody: 0, lowerBody: 0, core: 0 },
    isProcessing: false,
    frameRate: 0,
    syncStatus: 'no_trainer',
    jointFeedback: {}
  });

  // Performance tracking
  const frameCountRef = useRef(0);
  const lastFPSCalcRef = useRef(Date.now());
  const lastProcessTimeRef = useRef(Date.now());
  const shouldSkipFrameRef = useRef(false);

  // Temporal smoothing buffers
  const trainerBufferRef = useRef<TemporalBuffer>({ poses: [], timestamps: [], accuracyScores: [] });
  const userBufferRef = useRef<TemporalBuffer>({ poses: [], timestamps: [], accuracyScores: [] });

  // Processing workers simulation (since we can't use real workers with MediaPipe)
  const trainerProcessingRef = useRef<boolean>(false);
  const userProcessingRef = useRef<boolean>(false);

  const addToBuffer = useCallback((buffer: TemporalBuffer, pose: Pose, accuracy: number) => {
    const now = Date.now();
    buffer.poses.push(pose);
    buffer.timestamps.push(now);
    buffer.accuracyScores.push(accuracy);

    // Limit buffer size
    if (buffer.poses.length > fullConfig.maxBufferSize) {
      buffer.poses.shift();
      buffer.timestamps.shift();
      buffer.accuracyScores.shift();
    }
  }, [fullConfig.maxBufferSize]);

  const temporalSmoothing = useCallback((buffer: TemporalBuffer): Pose | null => {
    if (buffer.poses.length === 0) return null;
    if (buffer.poses.length === 1) return buffer.poses[0];

    const alpha = fullConfig.temporalSmoothingFactor;
    const latest = buffer.poses[buffer.poses.length - 1];
    const previous = buffer.poses[buffer.poses.length - 2];

    // Exponential moving average for each keypoint
    const smoothedKeypoints = latest.keypoints.map((kp, index) => {
      const prevKp = previous.keypoints[index];
      if (!prevKp) return kp;

      return {
        ...kp,
        x: prevKp.x * (1 - alpha) + kp.x * alpha,
        y: prevKp.y * (1 - alpha) + kp.y * alpha,
        score: prevKp.score ? (prevKp.score * (1 - alpha) + (kp.score || 0) * alpha) : kp.score
      };
    });

    return {
      ...latest,
      keypoints: smoothedKeypoints
    };
  }, [fullConfig.temporalSmoothingFactor]);

  const calculateCosineSimilarity = useCallback((pose1: Pose, pose2: Pose): number => {
    if (!pose1 || !pose2) return 0;

    // Convert poses to vectors (x, y coordinates)
    const vec1: number[] = [];
    const vec2: number[] = [];

    for (let i = 0; i < Math.min(pose1.keypoints.length, pose2.keypoints.length); i++) {
      const kp1 = pose1.keypoints[i];
      const kp2 = pose2.keypoints[i];

      if (kp1 && kp2 && (kp1.score || 0) > 0.3 && (kp2.score || 0) > 0.3) {
        vec1.push(kp1.x, kp1.y);
        vec2.push(kp2.x, kp2.y);
      }
    }

    if (vec1.length === 0 || vec2.length === 0) return 0;

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }, []);

  const calculateJointSpecificFeedback = useCallback((userPose: Pose, trainerPose: Pose) => {
    if (!userPose || !trainerPose) return {};

    // Key exercise joints with their keypoint indices
    const joints = {
      leftShoulder: [5, 7, 11], // shoulder-elbow-hip
      rightShoulder: [6, 8, 12],
      leftElbow: [5, 7, 9], // shoulder-elbow-wrist
      rightElbow: [6, 8, 10],
      leftHip: [5, 11, 13], // shoulder-hip-knee
      rightHip: [6, 12, 14],
      leftKnee: [11, 13, 15], // hip-knee-ankle
      rightKnee: [12, 14, 16]
    };

    const feedback: Record<string, any> = {};

    Object.entries(joints).forEach(([jointName, indices]) => {
      const [p1Idx, pivotIdx, p3Idx] = indices;
      const userP1 = userPose.keypoints[p1Idx];
      const userPivot = userPose.keypoints[pivotIdx];
      const userP3 = userPose.keypoints[p3Idx];

      const trainerP1 = trainerPose.keypoints[p1Idx];
      const trainerPivot = trainerPose.keypoints[pivotIdx];
      const trainerP3 = trainerPose.keypoints[p3Idx];

      if (userP1 && userPivot && userP3 && trainerP1 && trainerPivot && trainerP3) {
        // Calculate angles
        const userAngle = calculateAngle(userP1, userPivot, userP3);
        const trainerAngle = calculateAngle(trainerP1, trainerPivot, trainerP3);
        const angleDiff = Math.abs(userAngle - trainerAngle);

        let severity: 'good' | 'minor' | 'moderate' | 'major' = 'good';
        let suggestion = 'Good form!';
        let accuracy = Math.max(0, 100 - (angleDiff / 45) * 100); // 45 degrees max diff

        if (angleDiff > 30) {
          severity = 'major';
          suggestion = `Large angle difference (${angleDiff.toFixed(1)}°). Check your ${jointName} position.`;
        } else if (angleDiff > 20) {
          severity = 'moderate';
          suggestion = `Moderate adjustment needed. ${jointName} angle is ${angleDiff.toFixed(1)}° off.`;
        } else if (angleDiff > 10) {
          severity = 'minor';
          suggestion = `Minor adjustment: ${jointName} could be ${angleDiff.toFixed(1)}° closer to target.`;
        }

        feedback[jointName] = { accuracy, suggestion, severity };
      }
    });

    return feedback;
  }, []);

  const calculateAngle = (p1: any, pivot: any, p3: any): number => {
    const vector1 = { x: p1.x - pivot.x, y: p1.y - pivot.y };
    const vector2 = { x: p3.x - pivot.x, y: p3.y - pivot.y };

    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    return (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
  };

  const processTrainerFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (trainerProcessingRef.current) return;
    trainerProcessingRef.current = true;

    try {
      const pose = await detectPose(videoElement);
      if (pose) {
        addToBuffer(trainerBufferRef.current, pose, 1.0); // Trainer pose always has full confidence
        const smoothedPose = temporalSmoothing(trainerBufferRef.current);
        
        setState(prev => ({
          ...prev,
          trainerPose: smoothedPose,
          syncStatus: 'synced'
        }));
      }
    } catch (error) {
      console.error('Trainer pose processing error:', error);
    } finally {
      trainerProcessingRef.current = false;
    }
  }, [detectPose, addToBuffer, temporalSmoothing]);

  const processUserFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (userProcessingRef.current) return;
    userProcessingRef.current = true;

    const startTime = Date.now();

    try {
      const pose = await detectPose(videoElement);
      if (pose) {
        const trainerPose = state.trainerPose;
        let accuracy = 0;
        let jointFeedback = {};

        if (trainerPose) {
          // Calculate similarity using cosine similarity
          const cosineSim = calculateCosineSimilarity(pose, trainerPose);
          accuracy = cosineSim * 100;

          // Get joint-specific feedback
          jointFeedback = calculateJointSpecificFeedback(pose, trainerPose);
        }

        addToBuffer(userBufferRef.current, pose, accuracy / 100);
        const smoothedPose = temporalSmoothing(userBufferRef.current);

        setState(prev => ({
          ...prev,
          userPose: smoothedPose,
          accuracy: {
            overall: accuracy,
            upperBody: accuracy * 0.9, // Slight variation for different body parts
            lowerBody: accuracy * 1.1,
            core: accuracy
          },
          jointFeedback,
          isProcessing: true
        }));
      } else {
        setState(prev => ({
          ...prev,
          userPose: null,
          isProcessing: false
        }));
      }

      // Performance monitoring
      const processingTime = Date.now() - startTime;
      if (processingTime > fullConfig.frameSkipThreshold) {
        shouldSkipFrameRef.current = true;
      }

      // Calculate FPS
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFPSCalcRef.current >= 1000) {
        const fps = frameCountRef.current / ((now - lastFPSCalcRef.current) / 1000);
        setState(prev => ({ ...prev, frameRate: fps }));
        frameCountRef.current = 0;
        lastFPSCalcRef.current = now;
      }

    } catch (error) {
      console.error('User pose processing error:', error);
    } finally {
      userProcessingRef.current = false;
      lastProcessTimeRef.current = Date.now();
    }
  }, [detectPose, state.trainerPose, addToBuffer, temporalSmoothing, calculateCosineSimilarity, calculateJointSpecificFeedback, fullConfig.frameSkipThreshold]);

  const shouldSkipFrame = useCallback(() => {
    if (shouldSkipFrameRef.current) {
      shouldSkipFrameRef.current = false;
      return true;
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    trainerBufferRef.current = { poses: [], timestamps: [], accuracyScores: [] };
    userBufferRef.current = { poses: [], timestamps: [], accuracyScores: [] };
    frameCountRef.current = 0;
    lastFPSCalcRef.current = Date.now();
    
    setState({
      trainerPose: null,
      userPose: null,
      accuracy: { overall: 0, upperBody: 0, lowerBody: 0, core: 0 },
      isProcessing: false,
      frameRate: 0,
      syncStatus: 'no_trainer',
      jointFeedback: {}
    });
  }, []);

  return {
    state,
    processTrainerFrame,
    processUserFrame,
    shouldSkipFrame,
    reset,
    config: fullConfig
  };
}
