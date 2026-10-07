import { Pose, AccuracyMetrics } from '../types/pose';
import { calculateKeyExerciseAngles, calculateEuclideanDistance, UPPER_BODY_KEYPOINTS, LOWER_BODY_KEYPOINTS, CORE_KEYPOINTS } from './poseUtils';

export interface LiveAccuracyConfig {
  temporalWindowSize: number;
  smoothingFactor: number;
  confidenceThreshold: number;
  angleDiffThreshold: number; // degrees
  distanceThreshold: number; // normalized distance
  useCosineSimilarity: boolean;
  weightings: {
    angleAccuracy: number;
    distanceAccuracy: number;
    temporalConsistency: number;
  };
}

export interface AccuracyHistory {
  timestamp: number;
  overall: number;
  upperBody: number;
  lowerBody: number;
  core: number;
  confidence: number;
}

export interface JointAccuracyDetails {
  jointName: string;
  userAngle: number;
  trainerAngle: number;
  angleDifference: number;
  accuracy: number;
  confidence: number;
  feedback: string;
  severity: 'excellent' | 'good' | 'minor' | 'moderate' | 'major';
}

const DEFAULT_CONFIG: LiveAccuracyConfig = {
  temporalWindowSize: 10,
  smoothingFactor: 0.2,
  confidenceThreshold: 0.5,
  angleDiffThreshold: 45,
  distanceThreshold: 0.3,
  useCosineSimilarity: true,
  weightings: {
    angleAccuracy: 0.6,
    distanceAccuracy: 0.3,
    temporalConsistency: 0.1
  }
};

export class LiveAccuracyMatcher {
  private config: LiveAccuracyConfig;
  private history: AccuracyHistory[] = [];
  private smoothedAccuracy: AccuracyMetrics | null = null;

  constructor(config: Partial<LiveAccuracyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate real-time pose accuracy with temporal smoothing
   */
  calculateLiveAccuracy(userPose: Pose | null, trainerPose: Pose | null): {
    accuracy: AccuracyMetrics;
    jointDetails: JointAccuracyDetails[];
    confidence: number;
    isStable: boolean;
  } {
    if (!userPose || !trainerPose) {
      return {
        accuracy: { overall: 0, upperBody: 0, lowerBody: 0, core: 0 },
        jointDetails: [],
        confidence: 0,
        isStable: false
      };
    }

    // Calculate raw accuracy metrics
    const rawAccuracy = this.calculateRawAccuracy(userPose, trainerPose);
    const jointDetails = this.calculateJointDetails(userPose, trainerPose);
    const confidence = this.calculateOverallConfidence(userPose, trainerPose);

    // Add to history
    this.addToHistory({
      timestamp: Date.now(),
      ...rawAccuracy,
      confidence
    });

    // Apply temporal smoothing
    const smoothedAccuracy = this.applyTemporalSmoothing();
    const isStable = this.isAccuracyStable();

    return {
      accuracy: smoothedAccuracy,
      jointDetails,
      confidence,
      isStable
    };
  }

  /**
   * Calculate raw accuracy without temporal smoothing
   */
  private calculateRawAccuracy(userPose: Pose, trainerPose: Pose): AccuracyMetrics {
    const angleAccuracy = this.calculateAngleBasedAccuracy(userPose, trainerPose);
    const distanceAccuracy = this.calculateDistanceBasedAccuracy(userPose, trainerPose);
    const cosineAccuracy = this.config.useCosineSimilarity 
      ? this.calculateCosineSimilarityAccuracy(userPose, trainerPose)
      : 0;

    // Weighted combination
    const weights = this.config.weightings;
    const overall = this.config.useCosineSimilarity 
      ? (angleAccuracy * weights.angleAccuracy + distanceAccuracy * weights.distanceAccuracy + cosineAccuracy * (1 - weights.angleAccuracy - weights.distanceAccuracy))
      : (angleAccuracy * weights.angleAccuracy + distanceAccuracy * weights.distanceAccuracy);

    // Calculate region-specific accuracies
    const upperBodyAccuracy = this.calculateRegionAccuracy(userPose, trainerPose, UPPER_BODY_KEYPOINTS);
    const lowerBodyAccuracy = this.calculateRegionAccuracy(userPose, trainerPose, LOWER_BODY_KEYPOINTS);
    const coreAccuracy = this.calculateRegionAccuracy(userPose, trainerPose, CORE_KEYPOINTS);

    return {
      overall: Math.max(0, Math.min(100, overall)),
      upperBody: Math.max(0, Math.min(100, upperBodyAccuracy)),
      lowerBody: Math.max(0, Math.min(100, lowerBodyAccuracy)),
      core: Math.max(0, Math.min(100, coreAccuracy))
    };
  }

  /**
   * Calculate accuracy based on joint angles
   */
  private calculateAngleBasedAccuracy(userPose: Pose, trainerPose: Pose): number {
    const userAngles = calculateKeyExerciseAngles(userPose);
    const trainerAngles = calculateKeyExerciseAngles(trainerPose);

    let totalAccuracy = 0;
    let validJoints = 0;

    Object.keys(userAngles).forEach(jointName => {
      const userJoint = userAngles[jointName];
      const trainerJoint = trainerAngles[jointName];

      if (userJoint.isValid && trainerJoint.isValid) {
        const angleDiff = Math.abs(userJoint.angle - trainerJoint.angle);
        const accuracy = Math.max(0, 100 - (angleDiff / this.config.angleDiffThreshold) * 100);
        
        // Weight by confidence
        const avgConfidence = (userJoint.confidence + trainerJoint.confidence) / 2;
        totalAccuracy += accuracy * avgConfidence;
        validJoints += avgConfidence;
      }
    });

    return validJoints > 0 ? totalAccuracy / validJoints : 0;
  }

  /**
   * Calculate accuracy based on keypoint distances
   */
  private calculateDistanceBasedAccuracy(userPose: Pose, trainerPose: Pose): number {
    const normalizedUser = this.normalizePose(userPose);
    const normalizedTrainer = this.normalizePose(trainerPose);

    let totalDistance = 0;
    let validPoints = 0;

    for (let i = 0; i < Math.min(normalizedUser.keypoints.length, normalizedTrainer.keypoints.length); i++) {
      const userKp = normalizedUser.keypoints[i];
      const trainerKp = normalizedTrainer.keypoints[i];

      if (userKp && trainerKp && (userKp.score || 0) > this.config.confidenceThreshold && (trainerKp.score || 0) > this.config.confidenceThreshold) {
        const distance = calculateEuclideanDistance(userKp, trainerKp);
        totalDistance += distance;
        validPoints++;
      }
    }

    if (validPoints === 0) return 0;

    const avgDistance = totalDistance / validPoints;
    return Math.max(0, 100 - (avgDistance / this.config.distanceThreshold) * 100);
  }

  /**
   * Calculate accuracy using cosine similarity
   */
  private calculateCosineSimilarityAccuracy(userPose: Pose, trainerPose: Pose): number {
    const userVec: number[] = [];
    const trainerVec: number[] = [];

    // Convert poses to normalized vectors
    for (let i = 0; i < Math.min(userPose.keypoints.length, trainerPose.keypoints.length); i++) {
      const userKp = userPose.keypoints[i];
      const trainerKp = trainerPose.keypoints[i];

      if (userKp && trainerKp && (userKp.score || 0) > this.config.confidenceThreshold && (trainerKp.score || 0) > this.config.confidenceThreshold) {
        userVec.push(userKp.x, userKp.y);
        trainerVec.push(trainerKp.x, trainerKp.y);
      }
    }

    if (userVec.length === 0 || trainerVec.length === 0) return 0;

    // Calculate cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < userVec.length; i++) {
      dotProduct += userVec[i] * trainerVec[i];
      normA += userVec[i] * userVec[i];
      normB += trainerVec[i] * trainerVec[i];
    }

    if (normA === 0 || normB === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, similarity * 100);
  }

  /**
   * Calculate region-specific accuracy
   */
  private calculateRegionAccuracy(userPose: Pose, trainerPose: Pose, keypointIndices: number[]): number {
    let totalDistance = 0;
    let validPoints = 0;

    keypointIndices.forEach(idx => {
      const userKp = userPose.keypoints[idx];
      const trainerKp = trainerPose.keypoints[idx];

      if (userKp && trainerKp && (userKp.score || 0) > this.config.confidenceThreshold && (trainerKp.score || 0) > this.config.confidenceThreshold) {
        const distance = calculateEuclideanDistance(userKp, trainerKp);
        totalDistance += distance;
        validPoints++;
      }
    });

    if (validPoints === 0) return 0;

    const avgDistance = totalDistance / validPoints;
    return Math.max(0, 100 - (avgDistance / this.config.distanceThreshold) * 100);
  }

  /**
   * Calculate joint-specific details for feedback
   */
  private calculateJointDetails(userPose: Pose, trainerPose: Pose): JointAccuracyDetails[] {
    const userAngles = calculateKeyExerciseAngles(userPose);
    const trainerAngles = calculateKeyExerciseAngles(trainerPose);
    const details: JointAccuracyDetails[] = [];

    Object.keys(userAngles).forEach(jointName => {
      const userJoint = userAngles[jointName];
      const trainerJoint = trainerAngles[jointName];

      if (userJoint.isValid && trainerJoint.isValid) {
        const angleDiff = Math.abs(userJoint.angle - trainerJoint.angle);
        const accuracy = Math.max(0, 100 - (angleDiff / this.config.angleDiffThreshold) * 100);
        const avgConfidence = (userJoint.confidence + trainerJoint.confidence) / 2;

        let severity: JointAccuracyDetails['severity'] = 'excellent';
        let feedback = 'Perfect form!';

        if (angleDiff > 30) {
          severity = 'major';
          feedback = `Large correction needed (${angleDiff.toFixed(1)}° off)`;
        } else if (angleDiff > 20) {
          severity = 'moderate';
          feedback = `Moderate adjustment needed (${angleDiff.toFixed(1)}° off)`;
        } else if (angleDiff > 10) {
          severity = 'minor';
          feedback = `Minor adjustment (${angleDiff.toFixed(1)}° off)`;
        } else if (angleDiff > 5) {
          severity = 'good';
          feedback = `Good form, small refinement possible`;
        }

        details.push({
          jointName,
          userAngle: userJoint.angle,
          trainerAngle: trainerJoint.angle,
          angleDifference: angleDiff,
          accuracy,
          confidence: avgConfidence,
          feedback,
          severity
        });
      }
    });

    return details.sort((a, b) => b.accuracy - a.accuracy); // Sort by accuracy descending
  }

  /**
   * Calculate overall confidence of the pose comparison
   */
  private calculateOverallConfidence(userPose: Pose, trainerPose: Pose): number {
    const userAvgConfidence = userPose.keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / userPose.keypoints.length;
    const trainerAvgConfidence = trainerPose.keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / trainerPose.keypoints.length;
    return (userAvgConfidence + trainerAvgConfidence) / 2;
  }

  /**
   * Normalize pose by center and scale
   */
  private normalizePose(pose: Pose): Pose {
    const kp = pose.keypoints;
    const lHip = kp[11];
    const rHip = kp[12];
    const lShoulder = kp[5];
    const rShoulder = kp[6];

    if (!lHip || !rHip || !lShoulder || !rShoulder) {
      return pose; // Return original if can't normalize
    }

    const centerX = (lHip.x + rHip.x) / 2;
    const centerY = (lHip.y + rHip.y) / 2;
    
    const shoulderWidth = Math.hypot(lShoulder.x - rShoulder.x, lShoulder.y - rShoulder.y);
    const hipWidth = Math.hypot(lHip.x - rHip.x, lHip.y - rHip.y);
    let scale = (shoulderWidth + hipWidth) / 2;
    
    if (!isFinite(scale) || scale <= 1e-6) scale = 1;

    return {
      ...pose,
      keypoints: kp.map(point => ({
        ...point,
        x: (point.x - centerX) / scale,
        y: (point.y - centerY) / scale
      }))
    };
  }

  /**
   * Add accuracy data to history
   */
  private addToHistory(entry: AccuracyHistory): void {
    this.history.push(entry);
    
    // Limit history size
    if (this.history.length > this.config.temporalWindowSize) {
      this.history.shift();
    }
  }

  /**
   * Apply temporal smoothing to accuracy metrics
   */
  private applyTemporalSmoothing(): AccuracyMetrics {
    if (this.history.length === 0) {
      return { overall: 0, upperBody: 0, lowerBody: 0, core: 0 };
    }

    if (this.history.length === 1) {
      const latest = this.history[0];
      this.smoothedAccuracy = {
        overall: latest.overall,
        upperBody: latest.upperBody,
        lowerBody: latest.lowerBody,
        core: latest.core
      };
      return this.smoothedAccuracy;
    }

    const alpha = this.config.smoothingFactor;
    const latest = this.history[this.history.length - 1];

    if (!this.smoothedAccuracy) {
      this.smoothedAccuracy = {
        overall: latest.overall,
        upperBody: latest.upperBody,
        lowerBody: latest.lowerBody,
        core: latest.core
      };
    } else {
      // Exponential moving average
      this.smoothedAccuracy = {
        overall: this.smoothedAccuracy.overall * (1 - alpha) + latest.overall * alpha,
        upperBody: this.smoothedAccuracy.upperBody * (1 - alpha) + latest.upperBody * alpha,
        lowerBody: this.smoothedAccuracy.lowerBody * (1 - alpha) + latest.lowerBody * alpha,
        core: this.smoothedAccuracy.core * (1 - alpha) + latest.core * alpha
      };
    }

    return this.smoothedAccuracy;
  }

  /**
   * Check if accuracy measurements are stable
   */
  private isAccuracyStable(): boolean {
    if (this.history.length < 3) return false;

    const recent = this.history.slice(-3);
    const accuracies = recent.map(h => h.overall);
    
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    // Consider stable if standard deviation is low
    return stdDev < 5.0; // 5% threshold
  }

  /**
   * Get accuracy history for visualization
   */
  getAccuracyHistory(): AccuracyHistory[] {
    return [...this.history];
  }

  /**
   * Reset the matcher state
   */
  reset(): void {
    this.history = [];
    this.smoothedAccuracy = null;
  }

  /**
   * Export pose landmarks and accuracy data
   */
  exportData(): {
    history: AccuracyHistory[];
    config: LiveAccuracyConfig;
    currentSmoothedAccuracy: AccuracyMetrics | null;
  } {
    return {
      history: [...this.history],
      config: { ...this.config },
      currentSmoothedAccuracy: this.smoothedAccuracy ? { ...this.smoothedAccuracy } : null
    };
  }
}
