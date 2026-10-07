import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { Pose } from '../../types/pose';
import { drawSkeleton, drawJointAnglesOverlay, normalizePose, calculatePoseDistances, drawKeypointDebug } from '../../utils/poseUtils';

interface WebcamFeedProps {
  onPoseDetected: (pose: Pose | null) => void;
  detectPose: (video: HTMLVideoElement) => Promise<Pose | null>;
  isDetectorReady: boolean;
  // Optional reference (trainer) pose to draw/compare
  referencePose?: Pose | null;
  // Capture current user pose as reference
  onCaptureReference?: (pose: Pose) => void;
  // Show angle overlays
  showAnglesDefault?: boolean;
}

export function WebcamFeed({ onPoseDetected, detectPose, isDetectorReady, referencePose, onCaptureReference, showAnglesDefault = true }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAngles, setShowAngles] = useState(showAnglesDefault);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
          setError(null);
        }
      } catch (err) {
        setError('Unable to access webcam. Please grant permission.');
        setIsActive(false);
      }
    }

    if (isActive) {
      setupWebcam();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        (videoRef.current as any).srcObject = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !isDetectorReady || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    async function detectFrame() {
      if (!video || !canvas || !ctx || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pose = await detectPose(video);

      if (pose) {
        // Normalize for stable drawing and comparisons
        const normalized = normalizePose(pose, canvas.width, canvas.height);

        // Draw user skeleton and optional angles
        drawSkeleton(ctx, normalized, '#39FF14', canvas.width, canvas.height);
        if (showAngles) {
          drawJointAnglesOverlay(ctx, normalized, canvas.width, canvas.height, '#39FF14');
          drawKeypointDebug(ctx, normalized, canvas.width, canvas.height, { showNames: false, minScore: 0.0, color: '#ff69b4' });
        }

        // Draw reference (trainer) pose if provided
        if (referencePose) {
          drawSkeleton(ctx, referencePose, '#00B3FF', canvas.width, canvas.height);
          if (showAngles) {
            drawJointAnglesOverlay(ctx, referencePose, canvas.width, canvas.height, '#00B3FF');
            drawKeypointDebug(ctx, referencePose, canvas.width, canvas.height, { showNames: false, minScore: 0.0, color: '#00e5ff' });
          }

          // Show mean normalized distance in top-left
          const { mean } = calculatePoseDistances(normalized, referencePose, canvas.width, canvas.height);
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px ui-sans-serif, system-ui';
          ctx.fillText(`Mean distance: ${mean.toFixed(3)}`, 12, 20);
          ctx.restore();
        }

        onPoseDetected(normalized);
      } else {
        onPoseDetected(null);
      }

      animationRef.current = requestAnimationFrame(detectFrame);
    }

    detectFrame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isDetectorReady, detectPose, onPoseDetected]);

  const disableWebcam = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      (videoRef.current as any).srcObject = null;
    }
    onPoseDetected(null);
    setIsActive(false);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-green-500/30 shadow-2xl">
      {!isActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-green-900/30 via-cyan-900/30 to-blue-900/30">
          <div className="relative">
            <div className="absolute inset-0 bg-green-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative p-6 bg-slate-900 rounded-full border-4 border-slate-700">
              <CameraOff className="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <button
            onClick={() => setIsActive(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-cyan-700 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
            <Camera className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Enable Webcam</span>
          </button>
          {error && (
            <div className="px-4 py-2 bg-red-900/50 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-green-500/50 shadow-lg">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-500 rounded-full blur-sm"></div>
              </div>
              <span className="text-white text-sm font-bold">LIVE</span>
              <span className="text-green-300 text-sm">Your Form</span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-600/60">
              <label className="text-xs text-white/80 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showAngles} onChange={(e) => setShowAngles(e.target.checked)} />
                Show angles
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {onCaptureReference && (
              <button
                onClick={async () => {
                  if (!videoRef.current) return;
                  // Best-effort capture: run one detection immediately
                  const pose = await detectPose(videoRef.current);
                  if (pose) {
                    const normalized = normalizePose(pose, canvasRef.current!.width, canvasRef.current!.height);
                    onCaptureReference(normalized);
                  }
                }}
                className="px-3 py-2 bg-black/70 text-white text-xs font-semibold rounded-lg border border-blue-500/60 hover:bg-black/90"
              >
                Capture as Trainer
              </button>
            )}
            {isActive && (
              <button
                onClick={disableWebcam}
                className="px-3 py-2 bg-black/70 text-white text-xs font-semibold rounded-lg border border-red-500/60 hover:bg-black/90"
              >
                Disable Webcam
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}