import { Pose } from '../../types/pose';

interface VideoSkeletonOverlayProps {
  pose: Pose | null;
  videoWidth: number;
  videoHeight: number;
}

const POSE_CONNECTIONS = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
  [5, 11], [6, 12], [11, 12], // Torso
  [11, 13], [13, 15], [12, 14], [14, 16], // Legs
];

export const VideoSkeletonOverlay = ({ pose, videoWidth, videoHeight }: VideoSkeletonOverlayProps) => {
  if (!pose) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={videoWidth}
      height={videoHeight}
      style={{ zIndex: 10 }}
    >
      {/* Draw connections */}
      {POSE_CONNECTIONS.map(([startIdx, endIdx], idx) => {
        const start = pose.keypoints[startIdx];
        const end = pose.keypoints[endIdx];
        
        if (start && end && start.score > 0.3 && end.score > 0.3) {
          return (
            <line
              key={`connection-${idx}`}
              x1={start.x * videoWidth}
              y1={start.y * videoHeight}
              x2={end.x * videoWidth}
              y2={end.y * videoHeight}
              stroke="#3B82F6"
              strokeWidth="3"
              opacity="0.8"
            />
          );
        }
        return null;
      })}

      {/* Draw keypoints */}
      {pose.keypoints.map((kp, idx) => {
        if (kp.score > 0.3) {
          return (
            <circle
              key={`keypoint-${idx}`}
              cx={kp.x * videoWidth}
              cy={kp.y * videoHeight}
              r="5"
              fill="#3B82F6"
              opacity="0.9"
            />
          );
        }
        return null;
      })}
    </svg>
  );
};
