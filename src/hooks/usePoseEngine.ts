import { useMemo, useRef, useState } from "react";
import { Pose } from "../types/pose";
import { createPoseEngine, ExerciseType, PoseEngineOutput } from "../analysis/poseEngine";

export function usePoseEngine(exercise: ExerciseType) {
  const engineRef = useRef<ReturnType<typeof createPoseEngine> | null>(null);
  const [output, setOutput] = useState<PoseEngineOutput | null>(null);

  // Recreate engine when exercise changes
  useMemo(() => {
    engineRef.current = createPoseEngine(exercise, { smoothingAlpha: 0.2, minAccuracyToCount: 0.8 });
  }, [exercise]);

  function update(pose: Pose | null, accuracy01: number) {
    if (!pose || !engineRef.current) {
      setOutput(null);
      return;
    }
    const out = engineRef.current.update(pose, accuracy01);
    setOutput(out);
  }

  return { output, update };
}
