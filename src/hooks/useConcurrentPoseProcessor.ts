import { useState, useRef, useCallback, useEffect } from 'react';
import { Pose, AccuracyMetrics } from '../types/pose';
import { calculateJointAngles } from '../utils/poseUtils';

export interface ConcurrentProcessorState {
  trainerPose: Pose | null;
  userPose: Pose | null;
  accuracy: AccuracyMetrics;
  isProcessingTrainer: boolean;
  isProcessingUser: boolean;
  frameRateTrainer: number;
  frameRateUser: number;
  syncStatus: 'synced' | 'out_of_sync' | 'no_trainer' | 'waiting';
  landmarkComparison: LandmarkComparison | null;
  realTimeFeedback: RealTimeFeedback;
}

export interface LandmarkComparison {
  similarities: number[]; // Similarity for each landmark pair
  overallSimilarity: number;
  confidenceWeightedSimilarity: number;
  keyLandmarksSimilarity: {
    nose: number;
    shoulders: number;
    elbows: number;
    wrists: number;
    hips: number;
    knees: number;
    ankles: number;
  };
  timestamp: number;
}

export interface RealTimeFeedback {
  poseSimilarityScore: number; // 0-100
  jointAccuracies: Record<string, {
    similarity: number;
    deviation: number;
    feedback: string;
    severity: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  }>;
  overallFeedback: string;
  improvements: string[];
}

export interface ProcessorConfig {
  targetFPS: number;
  similarityThreshold: number;
  landmarkConfidenceThreshold: number;
  enableTemporalSmoothing: boolean;
  smoothingFactor: number;
  keyLandmarkWeights: Record<string, number>;
}

const DEFAULT_CONFIG: ProcessorConfig = {
  targetFPS: 30,
  similarityThreshold: 0.8,
  landmarkConfidenceThreshold: 0.5,
  enableTemporalSmoothing: true,
  smoothingFactor: 0.2,
  keyLandmarkWeights: {
    nose: 0.05,
    shoulders: 0.15,
    elbows: 0.15,
    wrists: 0.1,
    hips: 0.2,
    knees: 0.2,
    ankles: 0.15
  }
};

// MediaPipe landmark indices for key body parts
const LANDMARK_GROUPS = {
  nose: [0],
  shoulders: [5, 6], // left_shoulder, right_shoulder
  elbows: [7, 8], // left_elbow, right_elbow
  wrists: [9, 10], // left_wrist, right_wrist
  hips: [11, 12], // left_hip, right_hip
  knees: [13, 14], // left_knee, right_knee
  ankles: [15, 16] // left_ankle, right_ankle
};

export function useConcurrentPoseProcessor(
  detectPose: (media: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement, options?: any) => Promise<Pose | null>,
  config: Partial<ProcessorConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<ConcurrentProcessorState>({
    trainerPose: null,
    userPose: null,
    accuracy: { overall: 0, upperBody: 0, lowerBody: 0, core: 0 },
    isProcessingTrainer: false,
    isProcessingUser: false,
    frameRateTrainer: 0,
    frameRateUser: 0,
    syncStatus: 'no_trainer',
    landmarkComparison: null,
    realTimeFeedback: {
      poseSimilarityScore: 0,
      jointAccuracies: {},
      overallFeedback: 'No pose detected',
      improvements: []
    }
  });

  // Performance tracking for both streams
  const trainerFrameCount = useRef(0);
  const userFrameCount = useRef(0);
  const trainerLastFPS = useRef(Date.now());
  const userLastFPS = useRef(Date.now());
  
  // Processing flags to prevent overlap
  const trainerProcessing = useRef(false);
  const userProcessing = useRef(false);
  
  // Temporal smoothing buffers
  const trainerPoseHistory = useRef<Pose[]>([]);
  const userPoseHistory = useRef<Pose[]>([]);
  const maxHistorySize = 5;

  // Animation frame references for concurrent processing
  const trainerAnimationFrame = useRef<number>();
  const userAnimationFrame = useRef<number>();
  const lastTrainerTick = useRef<number>(0);
  const lastUserTick = useRef<number>(0);
  const compareAnimationFrame = useRef<number>();
  const lastCompareTick = useRef<number>(0);

  // Detection heartbeat to avoid long gaps or heavy forcing every frame
  const lastTrainerDetectTs = useRef<number>(0);
  const lastUserDetectTs = useRef<number>(0);
  const trainerWarmFrames = useRef<number>(0);
  const userWarmFrames = useRef<number>(0);

  // Keep latest state in a ref for use inside rAF loops
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  /**
   * Calculate Euclidean distance between two landmarks
   */
  const calculateLandmarkDistance = useCallback((landmark1: any, landmark2: any): number => {
    if (!landmark1 || !landmark2) return Infinity;
    
    const dx = landmark1.x - landmark2.x;
    const dy = landmark1.y - landmark2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Normalize pose landmarks for comparison
   */
  const normalizePose = useCallback((pose: Pose): Pose => {
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) return pose;

    // Get reference points (shoulders and hips for scale and center)
    const leftShoulder = pose.keypoints[5]; // left_shoulder
    const rightShoulder = pose.keypoints[6]; // right_shoulder
    const leftHip = pose.keypoints[11]; // left_hip
    const rightHip = pose.keypoints[12]; // right_hip

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return pose; // Cannot normalize without reference points
    }

    // Calculate center point (between shoulders and hips)
    const centerX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
    const centerY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;

    // Calculate scale (average of shoulder width and hip width)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const scale = Math.max((shoulderWidth + hipWidth) / 2, 0.001); // Prevent division by zero

    // Normalize all keypoints
    const normalizedKeypoints = pose.keypoints.map(kp => ({
      ...kp,
      x: (kp.x - centerX) / scale,
      y: (kp.y - centerY) / scale
    }));

    return {
      ...pose,
      keypoints: normalizedKeypoints
    };
  }, []);

  /**
   * Calculate similarity between corresponding landmarks
   */
  const calculateLandmarkSimilarities = useCallback((trainerPose: Pose, userPose: Pose): LandmarkComparison => {
    const normalizedTrainer = normalizePose(trainerPose);
    const normalizedUser = normalizePose(userPose);
    
    const similarities: number[] = [];
    let totalSimilarity = 0;
    let totalWeightedSimilarity = 0;
    let totalWeight = 0;
    let validLandmarks = 0;

    // Calculate similarity for each landmark pair
    for (let i = 0; i < Math.min(normalizedTrainer.keypoints.length, normalizedUser.keypoints.length); i++) {
      const trainerKp = normalizedTrainer.keypoints[i];
      const userKp = normalizedUser.keypoints[i];

      if (trainerKp && userKp && 
          (trainerKp.score || 0) > fullConfig.landmarkConfidenceThreshold &&
          (userKp.score || 0) > fullConfig.landmarkConfidenceThreshold) {
        
        const distance = calculateLandmarkDistance(trainerKp, userKp);
        const similarity = Math.max(0, 1 - distance); // Convert distance to similarity (0-1)
        similarities[i] = similarity;
        
        totalSimilarity += similarity;
        
        // Apply confidence weighting
        const avgConfidence = ((trainerKp.score || 0) + (userKp.score || 0)) / 2;
        totalWeightedSimilarity += similarity * avgConfidence;
        totalWeight += avgConfidence;
        
        validLandmarks++;
      } else {
        similarities[i] = 0;
      }
    }

    const overallSimilarity = validLandmarks > 0 ? totalSimilarity / validLandmarks : 0;
    const confidenceWeightedSimilarity = totalWeight > 0 ? totalWeightedSimilarity / totalWeight : 0;

    // Calculate key landmark group similarities
    const keyLandmarksSimilarity: LandmarkComparison['keyLandmarksSimilarity'] = {
      nose: 0, shoulders: 0, elbows: 0, wrists: 0, hips: 0, knees: 0, ankles: 0
    };

    Object.entries(LANDMARK_GROUPS).forEach(([groupName, indices]) => {
      let groupSimilarity = 0;
      let groupCount = 0;
      
      indices.forEach(index => {
        if (similarities[index] !== undefined) {
          groupSimilarity += similarities[index];
          groupCount++;
        }
      });
      
      keyLandmarksSimilarity[groupName as keyof typeof keyLandmarksSimilarity] = 
        groupCount > 0 ? groupSimilarity / groupCount : 0;
    });

    return {
      similarities,
      overallSimilarity,
      confidenceWeightedSimilarity,
      keyLandmarksSimilarity,
      timestamp: Date.now()
    };
  }, [normalizePose, calculateLandmarkDistance, fullConfig.landmarkConfidenceThreshold]);

  /**
   * Generate real-time feedback based on pose comparison
   */
  const generateRealTimeFeedback = useCallback((
    comparison: LandmarkComparison,
    trainerPose?: Pose | null,
    userPose?: Pose | null
  ): RealTimeFeedback => {
    // Landmark position-based similarity (0..1)
    const posSim = comparison.confidenceWeightedSimilarity;

    // Angle-based similarity per group (0..1)
    let angleSims: Partial<Record<string, number>> = {};
    if (trainerPose && userPose) {
      const tAngles = calculateJointAngles(trainerPose);
      const uAngles = calculateJointAngles(userPose);
      const sim = (ua: number, ta: number) => {
        if (!isFinite(ua) || !isFinite(ta) || ua <= 0 || ta <= 0) return 0;
        const diff = Math.abs(ua - ta);
        const maxDiff = 45; // degrees
        return Math.max(0, 1 - diff / maxDiff);
      };
      angleSims = {
        shoulders: (sim(uAngles.leftShoulder, tAngles.leftShoulder) + sim(uAngles.rightShoulder, tAngles.rightShoulder)) / 2,
        elbows: (sim(uAngles.leftElbow, tAngles.leftElbow) + sim(uAngles.rightElbow, tAngles.rightElbow)) / 2,
        hips: (sim(uAngles.leftHip, tAngles.leftHip) + sim(uAngles.rightHip, tAngles.rightHip)) / 2,
        knees: (sim(uAngles.leftKnee, tAngles.leftKnee) + sim(uAngles.rightKnee, tAngles.rightKnee)) / 2,
        ankles: (sim((uAngles as any).leftAnkle, (tAngles as any).leftAnkle) + sim((uAngles as any).rightAnkle, (tAngles as any).rightAnkle)) / 2,
      };
    }

    // Combine angle + position per joint group (angle weighted higher)
    const jointAccuracies: RealTimeFeedback['jointAccuracies'] = {};
    const improvements: string[] = [];
    const angleWeight = 0.6, posWeight = 0.4;
    let accumAngleSim = 0; let countAngleSim = 0;

    Object.entries(comparison.keyLandmarksSimilarity).forEach(([jointName, posGroupSim]) => {
      const aSim = (angleSims as any)[jointName] ?? null;
      const combined = aSim !== null ? (angleWeight * aSim + posWeight * posGroupSim) : posGroupSim;
      const percentage = Math.round(combined * 100);

      if (aSim !== null) { accumAngleSim += aSim; countAngleSim++; }

      let severity: 'excellent' | 'good' | 'needs_improvement' | 'poor';
      let feedback: string;
      const deviation = 1 - combined;

      if (percentage >= 90) { severity = 'excellent'; feedback = 'Perfect alignment!'; }
      else if (percentage >= 75) { severity = 'good'; feedback = 'Good position, minor adjustments possible'; }
      else if (percentage >= 50) { severity = 'needs_improvement'; feedback = `Adjust your ${jointName} angle/position`; improvements.push(`Improve ${jointName} alignment`); }
      else { severity = 'poor'; feedback = `Significant adjustment needed for ${jointName}`; improvements.push(`Focus on correcting ${jointName}`); }

      jointAccuracies[jointName] = { similarity: percentage, deviation, feedback, severity };
    });

    const angleOverall = countAngleSim > 0 ? (accumAngleSim / countAngleSim) : 0;
    const combinedOverall = angleOverall > 0 ? (angleWeight * angleOverall + posWeight * posSim) : posSim;
    const poseSimilarityScore = Math.round(combinedOverall * 100);

    const overallFeedback = poseSimilarityScore >= 90 ? '🎯 Excellent form! Keep it up!' :
      poseSimilarityScore >= 75 ? '👍 Good form! Minor adjustments will perfect it.' :
      poseSimilarityScore >= 50 ? '⚡ Keep working! Focus on the highlighted areas.' :
      '🎯 Focus on matching the trainer\'s pose more closely.';

    return { poseSimilarityScore, jointAccuracies, overallFeedback, improvements: improvements.slice(0, 3) };
  }, []);

  /**
   * Apply temporal smoothing to pose data
   */
  const smoothPose = useCallback((newPose: Pose, history: Pose[]): Pose => {
    if (!fullConfig.enableTemporalSmoothing || history.length === 0) {
      return newPose;
    }

    const previousPose = history[history.length - 1];
    const alpha = fullConfig.smoothingFactor;
    const maxDelta = 0.15; // allow faster catch-up to reduce perceived lag

    const smoothedKeypoints = newPose.keypoints.map((kp, index) => {
      const prevKp = previousPose.keypoints[index];
      if (!prevKp) return kp;

      // Clamp deltas to reduce jitter spikes
      const dx = kp.x - prevKp.x;
      const dy = kp.y - prevKp.y;
      const clampedDx = Math.max(-maxDelta, Math.min(maxDelta, dx));
      const clampedDy = Math.max(-maxDelta, Math.min(maxDelta, dy));

      return {
        ...kp,
        x: prevKp.x * (1 - alpha) + (prevKp.x + clampedDx) * alpha,
        y: prevKp.y * (1 - alpha) + (prevKp.y + clampedDy) * alpha,
        score: prevKp.score && kp.score ? prevKp.score * (1 - alpha) + kp.score * alpha : kp.score
      };
    });

    return {
      ...newPose,
      keypoints: smoothedKeypoints
    };
  }, [fullConfig.enableTemporalSmoothing, fullConfig.smoothingFactor]);

  /**
   * Update pose history for temporal smoothing
   */
  const updatePoseHistory = useCallback((pose: Pose, history: React.MutableRefObject<Pose[]>) => {
    history.current.push(pose);
    if (history.current.length > maxHistorySize) {
      history.current.shift();
    }
  }, []);

  /**
   * Process trainer video frame
   */
  const processTrainerFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (trainerProcessing.current || !videoElement || videoElement.readyState < 2) {
      return;
    }

    trainerProcessing.current = true;
    setState(prev => ({ ...prev, isProcessingTrainer: true }));

    try {
      const nowTs = Date.now();
      const force = trainerWarmFrames.current < 10 || (nowTs - lastTrainerDetectTs.current > 300);
      const pose = await detectPose(videoElement, { forceDetection: force });
      
      // Count a processed frame regardless of detection result
      trainerFrameCount.current++;
      const now = Date.now();
      if (now - trainerLastFPS.current >= 1000) {
        const fps = trainerFrameCount.current / ((now - trainerLastFPS.current) / 1000);
        setState(prev => ({ ...prev, frameRateTrainer: fps }));
        trainerFrameCount.current = 0;
        trainerLastFPS.current = now;
      }

      if (pose) {
        const vw = videoElement.videoWidth || 1;
        const vh = videoElement.videoHeight || 1;
        const normalizedPose: Pose = {
          ...pose,
          keypoints: pose.keypoints.map(kp => ({
            ...kp,
            x: kp.x > 1 ? kp.x / vw : kp.x,
            y: kp.y > 1 ? kp.y / vh : kp.y
          }))
        };
        // Gate low-confidence frames to avoid flicker
        const validCount = normalizedPose.keypoints.filter(k => (k.score || 0) > fullConfig.landmarkConfidenceThreshold).length;
        if (validCount < 6) {
          // Not enough landmarks; keep previous pose but still maintain sync status
          setState(prev => ({ 
            ...prev,
            syncStatus: prev.userPose ? 'synced' : 'waiting'
          }));
        } else {
        // Apply temporal smoothing
        const smoothedPose = smoothPose(normalizedPose, trainerPoseHistory.current);
        updatePoseHistory(smoothedPose, trainerPoseHistory);
        setState(prev => ({ 
          ...prev, 
          trainerPose: smoothedPose,
          syncStatus: prev.userPose ? 'synced' : 'waiting'
        }));
        lastTrainerDetectTs.current = nowTs;
        trainerWarmFrames.current++;
        }
      }
    } catch (error) {
      console.error('Trainer pose processing error:', error);
    } finally {
      trainerProcessing.current = false;
      setState(prev => ({ ...prev, isProcessingTrainer: false }));
    }
  }, [detectPose, smoothPose, updatePoseHistory]);

  /**
   * Process user video frame
   */
  const processUserFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (userProcessing.current || !videoElement || videoElement.readyState < 2) {
      return;
    }

    userProcessing.current = true;
    setState(prev => ({ ...prev, isProcessingUser: true }));

    try {
      const nowTs = Date.now();
      const force = userWarmFrames.current < 10 || (nowTs - lastUserDetectTs.current > 300);
      const pose = await detectPose(videoElement, { forceDetection: force });
      
      // Count a processed frame regardless of detection result
      userFrameCount.current++;
      const now = Date.now();
      if (now - userLastFPS.current >= 1000) {
        const fps = userFrameCount.current / ((now - userLastFPS.current) / 1000);
        setState(prev => ({ ...prev, frameRateUser: fps }));
        userFrameCount.current = 0;
        userLastFPS.current = now;
      }

      if (pose) {
        const vw = videoElement.videoWidth || 1;
        const vh = videoElement.videoHeight || 1;
        const normalizedPose: Pose = {
          ...pose,
          keypoints: pose.keypoints.map(kp => ({
            ...kp,
            x: kp.x > 1 ? kp.x / vw : kp.x,
            y: kp.y > 1 ? kp.y / vh : kp.y
          }))
        };
        // Gate low-confidence frames to avoid flicker
        const validCount = normalizedPose.keypoints.filter(k => (k.score || 0) > fullConfig.landmarkConfidenceThreshold).length;
        if (validCount < 6) {
          setState(prev => ({ 
            ...prev,
            syncStatus: prev.trainerPose ? 'synced' : 'no_trainer'
          }));
        } else {
        // Apply temporal smoothing
        const smoothedPose = smoothPose(normalizedPose, userPoseHistory.current);
        updatePoseHistory(smoothedPose, userPoseHistory);
        setState(prev => ({ 
          ...prev, 
          userPose: smoothedPose,
          syncStatus: prev.trainerPose ? 'synced' : 'no_trainer'
        }));
        lastUserDetectTs.current = nowTs;
        userWarmFrames.current++;
        }
      }
    } catch (error) {
      console.error('User pose processing error:', error);
    } finally {
      userProcessing.current = false;
      setState(prev => ({ ...prev, isProcessingUser: false }));
    }
  }, [detectPose, smoothPose, updatePoseHistory]);

  /**
   * Compare poses and update accuracy metrics
   */
  const comparePoses = useCallback(() => {
    if (!state.trainerPose || !state.userPose) {
      setState(prev => ({
        ...prev,
        accuracy: { overall: 0, upperBody: 0, lowerBody: 0, core: 0 },
        landmarkComparison: null,
        realTimeFeedback: {
          poseSimilarityScore: 0,
          jointAccuracies: {},
          overallFeedback: state.trainerPose ? 'Position yourself in camera view' : 'Load trainer pose first',
          improvements: []
        }
      }));
      return;
    }

    // Calculate landmark similarities
    const comparison = calculateLandmarkSimilarities(state.trainerPose, state.userPose);
    
    // Generate real-time feedback
    const feedback = generateRealTimeFeedback(comparison, state.trainerPose, state.userPose);
    
    // Calculate accuracy metrics based on similarity scores
    const overallAccuracy = feedback.poseSimilarityScore;
    const upperBodyAccuracy = (
      (feedback.jointAccuracies.shoulders?.similarity || 0) +
      (feedback.jointAccuracies.elbows?.similarity || 0) +
      (feedback.jointAccuracies.wrists?.similarity || 0)
    ) / 3;
    const lowerBodyAccuracy = (
      (feedback.jointAccuracies.hips?.similarity || 0) +
      (feedback.jointAccuracies.knees?.similarity || 0) +
      (feedback.jointAccuracies.ankles?.similarity || 0)
    ) / 3;
    const coreAccuracy = (feedback.jointAccuracies.hips?.similarity || 0);

    setState(prev => ({
      ...prev,
      accuracy: {
        overall: overallAccuracy,
        upperBody: upperBodyAccuracy,
        lowerBody: lowerBodyAccuracy,
        core: coreAccuracy
      },
      landmarkComparison: comparison,
      realTimeFeedback: feedback
    }));
  }, [state.trainerPose, state.userPose, calculateLandmarkSimilarities, generateRealTimeFeedback]);

  // Removed per-update compare effect to avoid duplicate heavy work; compareLoop handles live updates

  /**
   * Start concurrent processing for both video streams
   */
  const startConcurrentProcessing = useCallback((
    trainerVideo: HTMLVideoElement | null,
    userVideo: HTMLVideoElement | null
  ) => {
    const targetInterval = 1000 / fullConfig.targetFPS;

    // Trainer video processing loop via rAF
    if (trainerVideo) {
      const trainerLoop = (ts: number) => {
        if (!lastTrainerTick.current || ts - lastTrainerTick.current >= targetInterval) {
          lastTrainerTick.current = ts;
          processTrainerFrame(trainerVideo);
        }
        trainerAnimationFrame.current = requestAnimationFrame(trainerLoop);
      };
      trainerAnimationFrame.current = requestAnimationFrame(trainerLoop);
    }

    // User video processing loop via rAF
    if (userVideo) {
      const userLoop = (ts: number) => {
        if (!lastUserTick.current || ts - lastUserTick.current >= targetInterval) {
          lastUserTick.current = ts;
          processUserFrame(userVideo);
        }
        userAnimationFrame.current = requestAnimationFrame(userLoop);
      };
      userAnimationFrame.current = requestAnimationFrame(userLoop);
    }

    // Comparison loop: compute accuracy + feedback every frame (or target interval)
    const compareLoop = (ts: number) => {
      if (!lastCompareTick.current || ts - lastCompareTick.current >= targetInterval) {
        lastCompareTick.current = ts;
        const cur = stateRef.current;
        if (cur.trainerPose && cur.userPose) {
          // Reuse existing comparison + feedback pipeline
          const comparison = calculateLandmarkSimilarities(cur.trainerPose, cur.userPose);
          const feedback = generateRealTimeFeedback(comparison, cur.trainerPose, cur.userPose);
          const upperBodyAccuracy = (
            (feedback.jointAccuracies.shoulders?.similarity || 0) +
            (feedback.jointAccuracies.elbows?.similarity || 0) +
            (feedback.jointAccuracies.wrists?.similarity || 0)
          ) / 3;
          const lowerBodyAccuracy = (
            (feedback.jointAccuracies.hips?.similarity || 0) +
            (feedback.jointAccuracies.knees?.similarity || 0) +
            (feedback.jointAccuracies.ankles?.similarity || 0)
          ) / 3;
          const coreAccuracy = (feedback.jointAccuracies.hips?.similarity || 0);
          const overallAccuracy = feedback.poseSimilarityScore;
          setState(prev => ({
            ...prev,
            accuracy: {
              overall: overallAccuracy,
              upperBody: upperBodyAccuracy,
              lowerBody: lowerBodyAccuracy,
              core: coreAccuracy
            },
            landmarkComparison: comparison,
            realTimeFeedback: feedback
          }));
        }
      }
      compareAnimationFrame.current = requestAnimationFrame(compareLoop);
    };
    compareAnimationFrame.current = requestAnimationFrame(compareLoop);
  }, [fullConfig.targetFPS, processTrainerFrame, processUserFrame, calculateLandmarkSimilarities, generateRealTimeFeedback]);

  /**
   * Stop concurrent processing
   */
  const stopConcurrentProcessing = useCallback(() => {
    if (trainerAnimationFrame.current) {
      cancelAnimationFrame(trainerAnimationFrame.current);
      trainerAnimationFrame.current = undefined;
    }
    if (userAnimationFrame.current) {
      cancelAnimationFrame(userAnimationFrame.current);
      userAnimationFrame.current = undefined;
    }
    if (compareAnimationFrame.current) {
      cancelAnimationFrame(compareAnimationFrame.current);
      compareAnimationFrame.current = undefined;
    }
  }, []);

  /**
   * Reset processor state
   */
  const reset = useCallback(() => {
    stopConcurrentProcessing();
    
    trainerPoseHistory.current = [];
    userPoseHistory.current = [];
    trainerFrameCount.current = 0;
    userFrameCount.current = 0;
    trainerLastFPS.current = Date.now();
    userLastFPS.current = Date.now();
    
    setState({
      trainerPose: null,
      userPose: null,
      accuracy: { overall: 0, upperBody: 0, lowerBody: 0, core: 0 },
      isProcessingTrainer: false,
      isProcessingUser: false,
      frameRateTrainer: 0,
      frameRateUser: 0,
      syncStatus: 'no_trainer',
      landmarkComparison: null,
      realTimeFeedback: {
        poseSimilarityScore: 0,
        jointAccuracies: {},
        overallFeedback: 'Ready to start',
        improvements: []
      }
    });
  }, [stopConcurrentProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConcurrentProcessing();
    };
  }, [stopConcurrentProcessing]);

  return {
    state,
    processTrainerFrame,
    processUserFrame,
    startConcurrentProcessing,
    stopConcurrentProcessing,
    reset,
    config: fullConfig
  };
}
