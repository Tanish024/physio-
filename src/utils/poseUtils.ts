import { Keypoint, Pose, AccuracyMetrics } from '../types/pose';

export const KEYPOINT_CONNECTIONS = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16]
];

export const KEYPOINT_NAMES: string[] = [
  'nose','leftEye','rightEye','leftEar','rightEar','leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'
];

export const UPPER_BODY_KEYPOINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const LOWER_BODY_KEYPOINTS = [11, 12, 13, 14, 15, 16];
export const CORE_KEYPOINTS = [5, 6, 11, 12];

export function calculateEuclideanDistance(
  point1: Keypoint,
  point2: Keypoint
): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate Euclidean distance after normalizing pixel coordinates by width/height.
// This is robust whether keypoints are already normalized (0..1) or in pixels.
export function calculateNormalizedDistance(
  p1: Keypoint,
  p2: Keypoint,
  width: number,
  height: number
): number {
  const a = { x: p1.x > 1 ? p1.x / width : p1.x, y: p1.y > 1 ? p1.y / height : p1.y };
  const b = { x: p2.x > 1 ? p2.x / width : p2.x, y: p2.y > 1 ? p2.y / height : p2.y };
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateAngle(
  point1: Keypoint,
  point2: Keypoint,
  point3: Keypoint
): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };

  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y
  };

  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const angleDeg = (angleRad * 180) / Math.PI;

  return angleDeg;
}

export function calculateJointAngles(pose: Pose): Record<string, number> {
  const kp = pose.keypoints;

  return {
    leftElbow: calculateAngle(kp[5], kp[7], kp[9]),
    rightElbow: calculateAngle(kp[6], kp[8], kp[10]),
    leftShoulder: calculateAngle(kp[7], kp[5], kp[11]),
    rightShoulder: calculateAngle(kp[8], kp[6], kp[12]),
    leftHip: calculateAngle(kp[5], kp[11], kp[13]),
    rightHip: calculateAngle(kp[6], kp[12], kp[14]),
    leftKnee: calculateAngle(kp[11], kp[13], kp[15]),
    rightKnee: calculateAngle(kp[12], kp[14], kp[16]),
    // Additional key exercise joints
    leftAnkle: calculateAngle(kp[13], kp[15], kp[16]), // knee-ankle-rightAnkle (approximate)
    rightAnkle: calculateAngle(kp[14], kp[16], kp[15]), // knee-ankle-leftAnkle (approximate)
    leftArmpit: calculateAngle(kp[11], kp[5], kp[7]), // hip-shoulder-elbow
    rightArmpit: calculateAngle(kp[12], kp[6], kp[8]), // hip-shoulder-elbow
    torsoLean: calculateAngle(kp[5], kp[11], kp[13]), // shoulder-hip-knee (for posture)
    neckTilt: kp[0] && kp[5] && kp[6] ? calculateAngle(kp[5], kp[0], kp[6]) : 0 // leftShoulder-nose-rightShoulder
  };
}

// Enhanced angle calculation for real-time feedback
export function calculateKeyExerciseAngles(pose: Pose): Record<string, { angle: number; confidence: number; isValid: boolean }> {
  const kp = pose.keypoints;
  const results: Record<string, any> = {};
  
  const angleData = [
    { name: 'leftElbow', points: [5, 7, 9], minConfidence: 0.7 },
    { name: 'rightElbow', points: [6, 8, 10], minConfidence: 0.7 },
    { name: 'leftShoulder', points: [7, 5, 11], minConfidence: 0.6 },
    { name: 'rightShoulder', points: [8, 6, 12], minConfidence: 0.6 },
    { name: 'leftHip', points: [5, 11, 13], minConfidence: 0.8 },
    { name: 'rightHip', points: [6, 12, 14], minConfidence: 0.8 },
    { name: 'leftKnee', points: [11, 13, 15], minConfidence: 0.7 },
    { name: 'rightKnee', points: [12, 14, 16], minConfidence: 0.7 }
  ];
  
  angleData.forEach(({ name, points, minConfidence }) => {
    const [p1Idx, p2Idx, p3Idx] = points;
    const p1 = kp[p1Idx];
    const p2 = kp[p2Idx];
    const p3 = kp[p3Idx];
    
    if (p1 && p2 && p3) {
      const avgConfidence = ((p1.score || 0) + (p2.score || 0) + (p3.score || 0)) / 3;
      const isValid = avgConfidence >= minConfidence;
      const angle = isValid ? calculateAngle(p1, p2, p3) : 0;
      
      results[name] = {
        angle,
        confidence: avgConfidence,
        isValid
      };
    } else {
      results[name] = {
        angle: 0,
        confidence: 0,
        isValid: false
      };
    }
  });
  
  return results;
}

// Angle triples to render (index-based: [p1, pivot, p3])
export const ANGLE_TRIPLES: Record<string, [number, number, number]> = {
  leftElbow: [5, 7, 9],
  rightElbow: [6, 8, 10],
  leftShoulder: [7, 5, 11],
  rightShoulder: [8, 6, 12],
  leftHip: [5, 11, 13],
  rightHip: [6, 12, 14],
  leftKnee: [11, 13, 15],
  rightKnee: [12, 14, 16]
};

// Draws the two lines used for angle measurement and labels the angle value near the pivot.
export function drawAngleLines(
  ctx: CanvasRenderingContext2D,
  p1: Keypoint,
  pivot: Keypoint,
  p3: Keypoint,
  label: string,
  color: string,
  width: number,
  height: number
) {
  const toCanvas = (pt: Keypoint) => ({
    x: (pt.x > 1 ? pt.x : pt.x * width),
    y: (pt.y > 1 ? pt.y : pt.y * height)
  });
  const a = toCanvas(p1);
  const b = toCanvas(pivot);
  const c = toCanvas(p3);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Lines to pivot
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(a.x, a.y);
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.stroke();

  // Angle label
  const angle = Math.round(calculateAngle(p1, pivot, p3));
  const labelX = b.x + 8;
  const labelY = b.y - 8;
  ctx.fillStyle = color;
  ctx.font = 'bold 12px ui-sans-serif, system-ui';
  ctx.fillText(`${label}: ${angle}°`, labelX, Math.max(12, labelY));
  ctx.restore();
}

// Draw standard set of joint angle lines and labels for a given pose.
export function drawJointAnglesOverlay(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  width: number,
  height: number,
  color: string
) {
  const kp = pose.keypoints;
  (Object.entries(ANGLE_TRIPLES) as [string, [number, number, number]][]).forEach(([name, [i1, ip, i3]]) => {
    const p1 = kp[i1];
    const pivot = kp[ip];
    const p3 = kp[i3];
    if (!p1 || !pivot || !p3) return;
    if ((p1.score || 0) < 0.2 || (pivot.score || 0) < 0.2 || (p3.score || 0) < 0.2) return;
    drawAngleLines(ctx, p1, pivot, p3, name, color, width, height);
  });
}

// Compute per-keypoint normalized distances and aggregate mean distance.
export function calculatePoseDistances(
  a: Pose,
  b: Pose,
  width: number,
  height: number
): { perKeypoint: number[]; mean: number } {
  const len = Math.min(a.keypoints.length, b.keypoints.length);
  const distances: number[] = [];
  for (let i = 0; i < len; i++) {
    const d = calculateNormalizedDistance(a.keypoints[i], b.keypoints[i], width, height);
    distances.push(d);
  }
  const mean = distances.length ? distances.reduce((x, y) => x + y, 0) / distances.length : 0;
  return { perKeypoint: distances, mean };
}

export function normalizePose(pose: Pose, width: number, height: number): Pose {
  return {
    ...pose,
    keypoints: pose.keypoints.map(kp => ({
      ...kp,
      x: kp.x / width,
      y: kp.y / height
    }))
  };
}

export function calculatePoseAccuracy(
  userPose: Pose | null,
  referencePose: Pose | null
): AccuracyMetrics {
  if (!userPose || !referencePose) {
    return { overall: 0, upperBody: 0, lowerBody: 0, core: 0 };
  }

  const calculateRegionAccuracy = (keypointIndices: number[]): number => {
    let totalDistance = 0;
    let validPoints = 0;

    keypointIndices.forEach(idx => {
      const userKp = userPose.keypoints[idx];
      const refKp = referencePose.keypoints[idx];

      if (userKp && refKp && (userKp.score || 0) > 0.3 && (refKp.score || 0) > 0.3) {
        const distance = calculateEuclideanDistance(userKp, refKp);
        totalDistance += distance;
        validPoints++;
      }
    });

    if (validPoints === 0) return 0;

    const avgDistance = totalDistance / validPoints;
    const maxDistance = 0.3;
    const accuracy = Math.max(0, Math.min(100, (1 - avgDistance / maxDistance) * 100));
    return accuracy;
  };

  const calculateAngleAccuracy = (): number => {
    try {
      const userAngles = calculateJointAngles(userPose);
      const refAngles = calculateJointAngles(referencePose);

      const jointNames = Object.keys(userAngles);
      let totalAngleDiff = 0;
      let validJoints = 0;

      jointNames.forEach(joint => {
        const userAngle = userAngles[joint];
        const refAngle = refAngles[joint];

        if (userAngle > 0 && refAngle > 0) {
          const angleDiff = Math.abs(userAngle - refAngle);
          totalAngleDiff += angleDiff;
          validJoints++;
        }
      });

      if (validJoints === 0) return 0;

      const avgAngleDiff = totalAngleDiff / validJoints;
      const maxAngleDiff = 45;
      const angleAccuracy = Math.max(0, Math.min(100, (1 - avgAngleDiff / maxAngleDiff) * 100));

      return angleAccuracy;
    } catch {
      return 0;
    }
  };

  const distanceUpperBody = calculateRegionAccuracy(UPPER_BODY_KEYPOINTS);
  const distanceLowerBody = calculateRegionAccuracy(LOWER_BODY_KEYPOINTS);
  const distanceCore = calculateRegionAccuracy(CORE_KEYPOINTS);
  const angleAccuracy = calculateAngleAccuracy();

  const upperBody = (distanceUpperBody * 0.7) + (angleAccuracy * 0.3);
  const lowerBody = (distanceLowerBody * 0.7) + (angleAccuracy * 0.3);
  const core = (distanceCore * 0.7) + (angleAccuracy * 0.3);
  const overall = (upperBody + lowerBody + core) / 3;

  return { overall, upperBody, lowerBody, core };
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  color: string = '#39FF14',
  width: number,
  height: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.fillStyle = color;

  KEYPOINT_CONNECTIONS.forEach(([i, j]) => {
    const kp1 = pose.keypoints[i];
    const kp2 = pose.keypoints[j];

    if (kp1 && kp2 && (kp1.score || 0) > 0.2 && (kp2.score || 0) > 0.2) {
      ctx.beginPath();
      // Accept both normalized (0..1) and pixel coordinates
      const x1 = kp1.x > 1 ? kp1.x : kp1.x * width;
      const y1 = kp1.y > 1 ? kp1.y : kp1.y * height;
      const x2 = kp2.x > 1 ? kp2.x : kp2.x * width;
      const y2 = kp2.y > 1 ? kp2.y : kp2.y * height;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  });

  pose.keypoints.forEach(kp => {
    if ((kp.score || 0) > 0.2) {
      ctx.beginPath();
      const cx = kp.x > 1 ? kp.x : kp.x * width;
      const cy = kp.y > 1 ? kp.y : kp.y * height;
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

// Render all keypoints with their index and optional name for debugging alignment/scaling issues.
export function drawKeypointDebug(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  width: number,
  height: number,
  options: { showNames?: boolean; minScore?: number; color?: string } = {}
) {
  const { showNames = false, minScore = 0.0, color = '#ff69b4' } = options;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.font = 'bold 11px ui-sans-serif, system-ui';
  pose.keypoints.forEach((kp, idx) => {
    const sc = kp.score ?? 0;
    if (sc < minScore) return;
    const x = kp.x > 1 ? kp.x : kp.x * width;
    const y = kp.y > 1 ? kp.y : kp.y * height;
    // dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
    // label
    const name = kp.name || KEYPOINT_NAMES[idx] || String(idx);
    const text = showNames ? `${idx}:${name}` : `${idx}`;
    ctx.fillText(text, x + 6, Math.max(10, y - 6));
  });
  ctx.restore();
}

export function getMotivationalMessage(accuracy: number): string {
  if (accuracy >= 90) return "Perfect form! 🔥";
  if (accuracy >= 80) return "Excellent work!";
  if (accuracy >= 70) return "Great job! Keep it up!";
  if (accuracy >= 60) return "Good effort! Minor adjustments needed";
  if (accuracy >= 50) return "You're getting there!";
  return "Focus on matching the trainer's position";
}

// Per-joint angle diffs between two poses
export function calculatePerJointAngleDiffs(
  a: Pose,
  b: Pose
): Record<string, number> {
  const aAngles = calculateJointAngles(a);
  const bAngles = calculateJointAngles(b);
  const result: Record<string, number> = {};
  for (const name of Object.keys(ANGLE_TRIPLES)) {
    const diff = Math.abs((aAngles as any)[name] - (bAngles as any)[name]);
    result[name] = isFinite(diff) ? diff : 0;
  }
  return result;
}

export type AngleWeights = Partial<Record<keyof ReturnType<typeof calculateJointAngles>, number>>;

// Weighted angle-only accuracy score (0..100). Higher weight increases influence.
export function calculateAngleWeightedAccuracy(
  user: Pose | null,
  ref: Pose | null,
  weights?: AngleWeights,
  maxAngleDiff: number = 45
): number {
  if (!user || !ref) return 0;
  const diffs = calculatePerJointAngleDiffs(user, ref);
  const defaultWeights: Record<string, number> = {
    leftElbow: 1.5,
    rightElbow: 1.5,
    leftKnee: 1.5,
    rightKnee: 1.5,
    leftShoulder: 1,
    rightShoulder: 1,
    leftHip: 1,
    rightHip: 1
  };
  const w = { ...defaultWeights, ...(weights as any) } as Record<string, number>;
  let sumW = 0;
  let accum = 0;
  for (const [joint, diff] of Object.entries(diffs)) {
    const weight = w[joint] ?? 1;
    sumW += weight;
    const acc = Math.max(0, Math.min(1, 1 - diff / maxAngleDiff)); // 0..1
    accum += acc * weight;
  }
  if (sumW === 0) return 0;
  return Math.round((accum / sumW) * 100);
}