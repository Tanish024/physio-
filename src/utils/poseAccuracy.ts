import { Pose, AccuracyMetrics } from '../types/pose';
import { calculateEuclideanDistance, calculateJointAngles, UPPER_BODY_KEYPOINTS, LOWER_BODY_KEYPOINTS, CORE_KEYPOINTS } from './poseUtils';

// Center and scale a pose by hip midpoint and average torso width
function centerScale(p: Pose): Pose {
  const kp = p.keypoints;
  const lHip = kp[11];
  const rHip = kp[12];
  const lSh = kp[5];
  const rSh = kp[6];
  if (!lHip || !rHip || !lSh || !rSh) {
    console.log('[centerScale] Missing required keypoints, returning original pose');
    return p;
  }
  const cx = (lHip.x + rHip.x) / 2;
  const cy = (lHip.y + rHip.y) / 2;
  const shoulderW = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
  const hipW = Math.hypot(lHip.x - rHip.x, lHip.y - rHip.y);
  let scale = (shoulderW + hipW) / 2;
  if (!isFinite(scale) || scale <= 1e-6) scale = 1;
  
  console.log('[centerScale] Center: (', cx.toFixed(3), ',', cy.toFixed(3), '), Scale:', scale.toFixed(3));
  console.log('[centerScale] Sample keypoint before:', kp[5] ? `(${kp[5].x.toFixed(3)}, ${kp[5].y.toFixed(3)})` : 'missing');
  
  const normalized = {
    ...p,
    keypoints: kp.map(pt => ({ ...pt, x: (pt.x - cx) / scale, y: (pt.y - cy) / scale }))
  };
  
  console.log('[centerScale] Sample keypoint after:', normalized.keypoints[5] ? `(${normalized.keypoints[5].x.toFixed(3)}, ${normalized.keypoints[5].y.toFixed(3)})` : 'missing');
  
  return normalized;
}

function regionDistanceAccuracy(a: Pose, b: Pose, indices: number[]): number {
  let total = 0;
  let n = 0;
  const distances: number[] = [];
  
  for (const i of indices) {
    const p = a.keypoints[i];
    const q = b.keypoints[i];
    if (p && q && (p.score ?? 0) > 0.3 && (q.score ?? 0) > 0.3) {
      const dist = calculateEuclideanDistance(p, q);
      distances.push(dist);
      total += dist;
      n++;
    }
  }
  
  if (!n) {
    console.log('[regionDistanceAccuracy] No valid keypoints in region');
    return 0;
  }
  
  const mean = total / n;
  // After centerScale normalization, typical distances between matching poses are 0.01-0.3
  // Using maxD=0.4 provides better sensitivity: 
  // - Perfect match (0.0 distance) = 100%
  // - Good match (0.1 distance) = 75%
  // - Fair match (0.2 distance) = 50%
  // - Poor match (0.4+ distance) = 0%
  const maxD = 0.4;
  const accuracy = Math.max(0, Math.min(100, (1 - mean / maxD) * 100));
  
  console.log('[regionDistanceAccuracy] Distances:', distances.map(d => d.toFixed(3)).join(', '));
  console.log('[regionDistanceAccuracy] Mean distance:', mean.toFixed(3), 'maxD:', maxD, 'Accuracy:', accuracy.toFixed(1) + '%');
  
  return accuracy;
}

function angleAccuracy(a: Pose, b: Pose): number {
  try {
    const A = calculateJointAngles(a);
    const B = calculateJointAngles(b);
    const joints = Object.keys(A) as (keyof typeof A)[];
    let sum = 0, m = 0;
    for (const j of joints) {
      const ua = (A as any)[j];
      const ra = (B as any)[j];
      if (ua > 0 && ra > 0) { sum += Math.abs(ua - ra); m++; }
    }
    if (!m) return 0;
    const avg = sum / m;
    const maxDiff = 45; // deg
    return Math.max(0, Math.min(100, (1 - avg / maxDiff) * 100));
  } catch {
    return 0;
  }
}

export function computeAlignedPoseAccuracy(userPose: Pose | null, referencePose: Pose | null): AccuracyMetrics {
  if (!userPose || !referencePose) {
    console.log('[computeAlignedPoseAccuracy] Null pose detected, returning 0% accuracy');
    return { overall: 0, upperBody: 0, lowerBody: 0, core: 0 };
  }
  
  console.log('=== Computing Aligned Pose Accuracy ===');
  console.log('[computeAlignedPoseAccuracy] User pose keypoints:', userPose.keypoints.length);
  console.log('[computeAlignedPoseAccuracy] Reference pose keypoints:', referencePose.keypoints.length);
  
  console.log('\n--- Normalizing User Pose ---');
  const U = centerScale(userPose);
  
  console.log('\n--- Normalizing Reference Pose ---');
  const R = centerScale(referencePose);

  console.log('\n--- Upper Body Region ---');
  const up = regionDistanceAccuracy(U, R, UPPER_BODY_KEYPOINTS);
  
  console.log('\n--- Lower Body Region ---');
  const low = regionDistanceAccuracy(U, R, LOWER_BODY_KEYPOINTS);
  
  console.log('\n--- Core Region ---');
  const core = regionDistanceAccuracy(U, R, CORE_KEYPOINTS);
  
  console.log('\n--- Angle Accuracy ---');
  const ang = angleAccuracy(U, R);
  console.log('[angleAccuracy] Result:', ang.toFixed(1) + '%');

  const upperBody = (up * 0.5) + (ang * 0.5);
  const lowerBody = (low * 0.5) + (ang * 0.5);
  const coreAcc = (core * 0.5) + (ang * 0.5);
  const overall = (upperBody + lowerBody + coreAcc) / 3;

  console.log('\n=== Final Metrics ===');
  console.log('Overall:', overall.toFixed(1) + '%');
  console.log('Upper Body:', upperBody.toFixed(1) + '%');
  console.log('Lower Body:', lowerBody.toFixed(1) + '%');
  console.log('Core:', coreAcc.toFixed(1) + '%');
  console.log('=====================================\n');

  return { overall, upperBody, lowerBody, core: coreAcc };
}
