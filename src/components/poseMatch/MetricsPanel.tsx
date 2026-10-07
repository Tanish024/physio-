import { useMemo } from "react";
import { Pose } from "../../types/pose";
import { calculatePerJointAngleDiffs, calculateAngleWeightedAccuracy, calculatePoseDistances, KEYPOINT_NAMES } from "../../utils/poseUtils";

interface MetricsPanelProps {
  userPose: Pose | null;
  referencePose: Pose | null;
}

export function MetricsPanel({ userPose, referencePose }: MetricsPanelProps) {
  const angleDiffs = useMemo(() => {
    if (!userPose || !referencePose) return null;
    return calculatePerJointAngleDiffs(userPose, referencePose);
  }, [userPose, referencePose]);

  const weightedAccuracy = useMemo(() => {
    return calculateAngleWeightedAccuracy(userPose, referencePose);
  }, [userPose, referencePose]);

  const distances = useMemo(() => {
    if (!userPose || !referencePose) return null;
    // Poses we pass around are normalized already, so width/height can be 1 for distance calc
    return calculatePoseDistances(userPose, referencePose, 1, 1);
  }, [userPose, referencePose]);

  if (!referencePose) {
    return (
      <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
        <div className="text-slate-300 text-sm">No trainer reference selected yet. Capture from webcam or upload an image.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4">
        <div className="text-white font-semibold mb-2">Angle Accuracy (Weighted)</div>
        <div className="text-3xl font-bold text-blue-300">{weightedAccuracy}%</div>
        <div className="text-slate-400 text-xs">Elbows/Knees weighted higher</div>
      </div>

      {angleDiffs && (
        <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
          <div className="text-white font-semibold mb-3">Per-Joint Angle Differences</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(angleDiffs).map(([joint, diff]) => (
              <div key={joint} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 capitalize">{joint.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-slate-100 font-semibold">{diff.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {distances && (
        <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
          <div className="text-white font-semibold mb-3">Per-Keypoint Distances (normalized)</div>
          <div className="grid grid-cols-2 gap-2">
            {distances.perKeypoint.slice(0, KEYPOINT_NAMES.length).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{KEYPOINT_NAMES[i] || `kp${i}`}</span>
                <span className="text-slate-100 font-semibold">{d.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
