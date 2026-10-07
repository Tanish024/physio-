// export type AngleTargets = {
//   // degrees target values for key joints
//   // keys correspond to calculateJointAngles() result keys
//   targets: Partial<Record<
//     | 'leftElbow'
//     | 'rightElbow'
//     | 'leftShoulder'
//     | 'rightShoulder'
//     | 'leftHip'
//     | 'rightHip'
//     | 'leftKnee'
//     | 'rightKnee',
//     number
//   >>;
//   // allowed absolute error per joint (degrees)
//   tolerance: number;
// };

// export const EXERCISE_ANGLES: Record<string, AngleTargets> = {
//   plank: {
//     // keep a straight line shoulders-hips-ankles ~ 180
//     targets: { leftHip: 180, rightHip: 180, leftShoulder: 180, rightShoulder: 180, leftKnee: 180, rightKnee: 180 },
//     tolerance: 12,
//   },
//   squat: {
//     // bottom position indicative targets: knees ~ 90, back more open
//     targets: { leftKnee: 90, rightKnee: 90, leftHip: 150, rightHip: 150 },
//     tolerance: 18,
//   },
//   pushup: {
//     // elbows ~90 at bottom; back line straight (~180 hips)
//     targets: { leftElbow: 90, rightElbow: 90, leftHip: 180, rightHip: 180 },
//     tolerance: 12,
//   },
//   lunge: {
//     // front knee ~90, back knee more open ~120
//     targets: { leftKnee: 90, rightKnee: 120, leftHip: 150, rightHip: 150 },
//     tolerance: 18,
//   },
//   'jumping-jack': {
//     // arms up ~180 (shoulder abduction approximated by shoulder angle), legs out ~60 at knees as proxy
//     targets: { leftShoulder: 180, rightShoulder: 180, leftKnee: 60, rightKnee: 60 },
//     tolerance: 20,
//   },
// };

// export type SegmentScores = {
//   overall: number;
//   upperBody: number;
//   core: number;
//   lowerBody: number;
//   issues: string[];
// };

// // Compute per-segment accuracy from current joint angles vs targets with tolerance window
// export function computeSegmentAccuracy(
//   currentAngles: Record<string, number>,
//   exerciseKey: string
// ): SegmentScores {
//   const cfg = EXERCISE_ANGLES[exerciseKey] || EXERCISE_ANGLES['plank'];
//   const tol = cfg.tolerance;

//   const scores: Record<string, number[]> = {
//     upper: [],
//     core: [],
//     lower: [],
//   };

//   const issues: string[] = [];

//   const weightForJoint = (name: string) => {
//     const n = name.toLowerCase();
//     if (n.includes('elbow') || n.includes('knee')) return 1.5;
//     if (n.includes('hip')) return 1.2;
//     return 1.0; // shoulders and others
//   };

//   const pushScore = (name: string, pct: number) => {
//     const n = name.toLowerCase();
//     const wPct = Math.min(1, pct * weightForJoint(name));
//     if (n.includes('shoulder') || n.includes('elbow')) scores.upper.push(wPct);
//     else if (n.includes('hip')) scores.core.push(wPct);
//     else if (n.includes('knee')) scores.lower.push(wPct);
//   };

//   for (const [joint, target] of Object.entries(cfg.targets)) {
//     const cur = currentAngles[joint] ?? 0;
//     if (!cur || !isFinite(cur)) continue;
//     const err = Math.abs(cur - (target as number));
//     let pct: number;
//     if (err <= tol) {
//       const inside = 1 - (err / tol);
//       pct = 0.85 + 0.15 * inside;
//     } else {
//       const scale = (err - tol) / tol;
//       pct = 0.85 * Math.exp(-1.5 * scale * scale);
//     }
//     pushScore(joint, pct);

//     if (err > tol) {
//       // simple issue hints
//       if (joint.toLowerCase().includes('hip')) {
//         issues.push(cur < (target as number) ? 'Raise hips' : 'Lower hips');
//       } else if (joint.toLowerCase().includes('knee')) {
//         issues.push(cur < (target as number) ? 'Bend knees more' : 'Do not over-bend knees');
//       } else if (joint.toLowerCase().includes('elbow')) {
//         issues.push(cur < (target as number) ? 'Bend elbows more' : 'Do not overextend elbows');
//       } else if (joint.toLowerCase().includes('shoulder')) {
//         issues.push(cur < (target as number) ? 'Lift arms higher' : 'Lower arms slightly');
//       }
//     }
//   }

//   const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

//   const upper = avg(scores.upper) * 100;
//   const core = avg(scores.core) * 100;
//   const lower = avg(scores.lower) * 100;
//   const present = [upper, core, lower].filter(x => x > 0);
//   const overall = (present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0);

//   return {
//     overall: Math.round(overall),
//     upperBody: Math.round(upper),
//     core: Math.round(core),
//     lowerBody: Math.round(lower),
//     issues,
//   };
// }



export type AngleTargets = {
  // degrees target values for key joints
  // keys correspond to calculateJointAngles() result keys
  targets: Partial<Record<
    | 'leftElbow'
    | 'rightElbow'
    | 'leftShoulder'
    | 'rightShoulder'
    | 'leftHip'
    | 'rightHip'
    | 'leftKnee'
    | 'rightKnee',
    number
  >>;
  // allowed absolute error per joint (degrees)
  tolerance: number;
};

export const EXERCISE_ANGLES: Record<string, AngleTargets> = {
  plank: {
    targets: { 
      leftShoulder: 165, 
      rightShoulder: 165,
      leftHip: 170, 
      rightHip: 170,
      leftKnee: 175, 
      rightKnee: 175,
    },
    tolerance: 12,
  },

  squat: {
    // bottom position indicative targets: knees ~ 90, back more open
    targets: { 
      leftKnee: 90, 
      rightKnee: 90, 
      leftHip: 150, 
      rightHip: 150,
    },
    tolerance: 15,
  },

  pushup: {
    // elbows ~90 at bottom; back line straight (~180 hips)
    targets: { 
      leftElbow: 90, 
      rightElbow: 90, 
      leftHip: 180, 
      rightHip: 180,
    },
    tolerance: 10,
  },

  lunge: {
    // front knee ~90, back knee more open ~120
    targets: { 
      leftKnee: 90, 
      rightKnee: 120, 
      leftHip: 150, 
      rightHip: 150,
    },
    tolerance: 15,
  },

  'jumping-jack': {
    // arms up ~180 (shoulder abduction approximated by shoulder angle), legs out ~60 at knees as proxy
    targets: { 
      leftShoulder: 180, 
      rightShoulder: 180, 
      leftKnee: 60, 
      rightKnee: 60,
    },
    tolerance: 20,
  },
};


export type SegmentScores = {
  overall: number;
  upperBody: number;
  core: number;
  lowerBody: number;
  issues: string[];
};

// Compute per-segment accuracy from current joint angles vs targets with tolerance window
export function computeSegmentAccuracy(
  currentAngles: Record<string, number>,
  exerciseKey: string
): SegmentScores {
  const cfg = EXERCISE_ANGLES[exerciseKey] || EXERCISE_ANGLES['plank'];
  const tol = cfg.tolerance;

  const scores: Record<string, number[]> = {
    upper: [],
    core: [],
    lower: [],
  };

  const issues: string[] = [];

  const pushScore = (name: string, pct: number) => {
    const n = name.toLowerCase();
    if (n.includes('shoulder') || n.includes('elbow')) scores.upper.push(pct);
    else if (n.includes('hip')) scores.core.push(pct);
    else if (n.includes('knee')) scores.lower.push(pct);
  };

  for (const [joint, target] of Object.entries(cfg.targets)) {
    const cur = currentAngles[joint] ?? 0;
    if (!cur || !isFinite(cur)) continue;
    const err = Math.abs(cur - (target as number));
    let pct: number;
    if (err <= tol) {
      const inside = 1 - (err / tol);
      pct = 0.85 + 0.15 * inside;
    } else {
      const scale = (err - tol) / tol;
      pct = 0.85 * Math.exp(-1.5 * scale * scale);
    }
    pushScore(joint, pct);

    if (err > tol) {
      // simple issue hints
      if (joint.toLowerCase().includes('hip')) {
        issues.push(cur < (target as number) ? 'Raise hips' : 'Lower hips');
      } else if (joint.toLowerCase().includes('knee')) {
        issues.push(cur < (target as number) ? 'Bend knees more' : 'Do not over-bend knees');
      } else if (joint.toLowerCase().includes('elbow')) {
        issues.push(cur < (target as number) ? 'Bend elbows more' : 'Do not overextend elbows');
      } else if (joint.toLowerCase().includes('shoulder')) {
        issues.push(cur < (target as number) ? 'Lift arms higher' : 'Lower arms slightly');
      }
    }
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const upper = avg(scores.upper) * 100;
  const core = avg(scores.core) * 100;
  const lower = avg(scores.lower) * 100;
  const present = [upper, core, lower].filter(x => x > 0);
  const overall = (present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0);

  return {
    overall: Math.round(overall),
    upperBody: Math.round(upper),
    core: Math.round(core),
    lowerBody: Math.round(lower),
    issues,
  };
}
