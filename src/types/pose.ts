export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export interface AccuracyMetrics {
  overall: number;
  upperBody: number;
  lowerBody: number;
  core: number;
}