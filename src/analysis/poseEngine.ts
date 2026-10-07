import { Pose, Keypoint } from "../types/pose";
import { calculateJointAngles } from "../utils/poseUtils";

export type ExerciseType = "plank" | "squat" | "pushup" | "yoga" | "other";

export interface PoseEngineConfig {
  smoothingAlpha?: number; // 0..1, EMA smoothing for keypoints
  minAccuracyToCount?: number; // 0..1, e.g., 0.8 => 80%
}

export interface PoseEngineOutput {
  repCount: number;
  phase: string;
  accuracyGatePassed: boolean;
  severity: "minor" | "moderate" | "major" | null;
  suggestions: string[];
  fatigueLevel: number; // 0..1
  angles: Record<string, number>;
  holdTimeMs?: number; // For plank
}

interface InternalState {
  smoothed?: Pose;
  lastTimestamp?: number;
  phase: string;
  repCount: number;
  // For threshold crossings
  wasBelow: boolean;
  wasAbove: boolean;
  bottomHoldMs: number;
  // Fatigue proxy: rolling mean of absolute angle deltas
  fatigueAccum: number;
  fatigueSamples: number;
  lastPrimaryAngle?: number;
}

function ema(prev: number, next: number, alpha: number) {
  return prev === undefined ? next : prev * (1 - alpha) + next * alpha;
}

function emaPose(prev: Pose | undefined, next: Pose, alpha: number): Pose {
  if (!prev) return next;
  const kp = next.keypoints.map((p, i) => {
    const q = prev.keypoints[i] || p;
    return {
      x: ema(q.x, p.x, alpha),
      y: ema(q.y, p.y, alpha),
      score: p.score !== undefined ? ema(q.score ?? p.score ?? 0, p.score ?? 0, alpha) : q.score,
      name: p.name ?? q.name,
    } as Keypoint;
  });
  return { keypoints: kp, score: next.score };
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function avg(a: number, b: number) { return (a + b) / 2; }

export function createPoseEngine(exercise: ExerciseType, cfg: PoseEngineConfig = {}) {
  const config: Required<PoseEngineConfig> = {
    smoothingAlpha: cfg.smoothingAlpha ?? 0.2,
    minAccuracyToCount: cfg.minAccuracyToCount ?? 0.8,
  };

  const st: InternalState = {
    phase: "idle",
    repCount: 0,
    wasBelow: false,
    wasAbove: true,
    bottomHoldMs: 0,
    fatigueAccum: 0,
    fatigueSamples: 0,
  };

  function severityFromDiff(diff: number): PoseEngineOutput["severity"] {
    if (diff < 10) return null;
    if (diff < 20) return "minor";
    if (diff < 35) return "moderate";
    return "major";
  }

  function bodyLineAngle(kp: Keypoint[]): number {
    // Hip angle using shoulder-hip-ankle as the pivot (average of left/right hips)
    // Using calculateJointAngles gives leftHip/rightHip already.
    const { leftHip, rightHip } = calculateJointAngles({ keypoints: kp });
    return avg(leftHip, rightHip);
  }

  function elbowAngleMean(kp: Keypoint[]): number {
    const { leftElbow, rightElbow } = calculateJointAngles({ keypoints: kp });
    return avg(leftElbow, rightElbow);
  }

  function kneeAngleMean(kp: Keypoint[]): number {
    const { leftKnee, rightKnee } = calculateJointAngles({ keypoints: kp });
    return avg(leftKnee, rightKnee);
  }

  function computeSuggestions(ex: ExerciseType, kp: Keypoint[], angles: Record<string, number>, accuracy: number): string[] {
    const sug: string[] = [];
    if (ex === "plank") {
      const hip = bodyLineAngle(kp);
      if (hip < 165) sug.push("Raise hips slightly to avoid sagging");
      if (hip > 185) sug.push("Lower hips slightly to keep a straight line");
      if (accuracy < 0.8) sug.push("Focus on maintaining a straight line from shoulders to ankles");
    } else if (ex === "squat") {
      const knees = kneeAngleMean(kp);
      if (knees > 110) sug.push("Go deeper until ~90° at knees");
      if (knees < 70) sug.push("Do not go too deep, stop around 90°");
      const back = bodyLineAngle(kp);
      if (back < 150) sug.push("Keep chest up and back straighter");
    } else if (ex === "pushup") {
      const elbows = elbowAngleMean(kp);
      if (elbows > 170) sug.push("Control the descent, bend elbows to ~90°");
      if (elbows < 80) sug.push("Avoid going too low; aim for ~90° at bottom");
      const hip = bodyLineAngle(kp);
      if (hip < 170) sug.push("Keep body line straight—tighten core and glutes");
    }
    return sug;
  }

  function update(pose: Pose, accuracy01: number): PoseEngineOutput {
    const now = Date.now();
    st.smoothed = emaPose(st.smoothed, pose, config.smoothingAlpha);
    const kp = st.smoothed.keypoints;
    const angles = calculateJointAngles({ keypoints: kp });

    // Choose primary angle & thresholds per exercise
    let primaryAngle = 180;
    let downThresh = 110; // entering bottom
    let bottomThresh = 95; // deep bottom
    let upThresh = 160; // back to top

    if (exercise === "plank") {
      primaryAngle = bodyLineAngle(kp); // aim 165-185
      // No reps; use hold time if accuracy good
    } else if (exercise === "squat") {
      primaryAngle = kneeAngleMean(kp);
      downThresh = 110;
      bottomThresh = 95;
      upThresh = 160;
    } else if (exercise === "pushup") {
      primaryAngle = elbowAngleMean(kp);
      downThresh = 140; // start descent below this
      bottomThresh = 95; // bottom ~90
      upThresh = 165; // lockout
    }

    // Fatigue (rolling mean of absolute angle deltas)
    if (st.lastPrimaryAngle !== undefined) {
      const d = Math.abs(primaryAngle - st.lastPrimaryAngle);
      st.fatigueAccum += Math.min(d, 30);
      st.fatigueSamples += 1;
    }
    st.lastPrimaryAngle = primaryAngle;
    const fatigueLevel = clamp01((st.fatigueSamples ? st.fatigueAccum / st.fatigueSamples : 0) / 15);

    // Phase & reps
    if (exercise === "plank") {
      // Track hold time in good form
      if (st.lastTimestamp) {
        const dt = now - st.lastTimestamp;
        if (accuracy01 >= config.minAccuracyToCount && primaryAngle >= 165 && primaryAngle <= 185) {
          st.bottomHoldMs += dt; // reuse bottomHoldMs as hold time
        }
      }
      st.phase = accuracy01 >= config.minAccuracyToCount ? "holding" : "adjusting";
    } else {
      // dynamic exercises
      const accuracyGate = accuracy01 >= config.minAccuracyToCount;
      if (primaryAngle < downThresh) st.wasBelow = true; // descending
      if (primaryAngle > upThresh) st.wasAbove = true; // at/near top

      if (primaryAngle < bottomThresh) {
        st.bottomHoldMs += st.lastTimestamp ? (now - st.lastTimestamp) : 0;
        st.phase = "bottom";
      } else if (st.wasBelow && primaryAngle >= upThresh) {
        // Completed a rep if we went below threshold and returned above
        if (accuracyGate && st.bottomHoldMs >= 80) {
          st.repCount += 1;
        }
        st.wasBelow = false;
        st.bottomHoldMs = 0;
        st.phase = "top";
      } else if (st.wasBelow) {
        st.phase = "ascending";
      } else if (!st.wasBelow && primaryAngle < downThresh) {
        st.phase = "descending";
      } else {
        st.phase = "top";
      }
    }

    st.lastTimestamp = now;

    // Severity vs target angle window
    let ideal = 180;
    if (exercise === "plank") ideal = 175; // aim mid of range
    if (exercise === "squat") ideal = st.phase === "bottom" ? 90 : 170;
    if (exercise === "pushup") ideal = st.phase === "bottom" ? 90 : 175;
    const diff = Math.abs(primaryAngle - ideal);
    const severity = severityFromDiff(diff);

    const suggestions = computeSuggestions(exercise, kp, angles, accuracy01);

    return {
      repCount: st.repCount,
      phase: st.phase,
      accuracyGatePassed: accuracy01 >= config.minAccuracyToCount,
      severity,
      suggestions,
      fatigueLevel,
      angles,
      holdTimeMs: exercise === "plank" ? st.bottomHoldMs : undefined,
    };
  }

  return { update };
}
