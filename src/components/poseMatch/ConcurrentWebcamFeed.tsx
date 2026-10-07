import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Camera, CameraOff, Activity, Zap, Target, AlertTriangle } from 'lucide-react';
import { Pose } from '../../types/pose';
import { RealTimeFeedback } from '../../hooks/useConcurrentPoseProcessor';
import { drawSkeleton, drawJointAnglesOverlay, calculateJointAngles } from '../../utils/poseUtils';

interface ConcurrentWebcamFeedProps {
  onUserVideoReady: (video: HTMLVideoElement) => void;
  onPoseDetected?: (pose: Pose | null) => void;
  pose?: Pose | null;
  realTimeFeedback?: RealTimeFeedback;
  frameRate?: number;
  isProcessing?: boolean;
  showAngles?: boolean;
  showFeedback?: boolean;
  autoStart?: boolean;
}

export function ConcurrentWebcamFeed({
  onUserVideoReady,
  onPoseDetected,
  pose,
  realTimeFeedback,
  frameRate = 0,
  isProcessing = false,
  showAngles = true,
  showFeedback = true,
  autoStart = false
}: ConcurrentWebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>();
  const lastPoseRef = useRef<Pose | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const angles = useMemo(() => pose ? calculateJointAngles(pose) : null, [pose]);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart && !isActive) {
      setIsActive(true);
      console.log('[ConcurrentWebcamFeed] Auto-starting webcam...');
    }
  }, [autoStart]);

  useEffect(() => {
    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.onloadedmetadata = async () => {
            console.log('[ConcurrentWebcamFeed] Video metadata loaded');
            try { 
              await videoRef.current?.play();
              console.log('[ConcurrentWebcamFeed] Video playing');
            } catch (e) {
              console.error('[ConcurrentWebcamFeed] Play failed:', e);
            }
            if (videoRef.current) {
              // Notify parent component that video is ready for processing
              onUserVideoReady(videoRef.current);
              console.log('[ConcurrentWebcamFeed] Notified parent of video ready');
            }
          };
          // Fallback: try to play immediately
          try { 
            await (videoRef.current as HTMLVideoElement).play();
            console.log('[ConcurrentWebcamFeed] Fallback play successful');
          } catch (e) {
            console.error('[ConcurrentWebcamFeed] Fallback play failed:', e);
          }
          setIsActive(true);
          setError(null);
        }

        // Bind the same stream to the picture-in-picture preview
        if (previewRef.current) {
          (previewRef.current as any).srcObject = stream;
          previewRef.current.muted = true;
          try { await previewRef.current.play(); } catch {}
        }
      } catch (err) {
        setError('Unable to access webcam. Please grant permission and ensure no other applications are using the camera.');
        setIsActive(false);
      }
    }

    if (isActive && !streamRef.current) {
      setupWebcam();
    }

    return () => {
      // Cleanup on unmount or when isActive becomes false
      if (!isActive && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
          (videoRef.current as any).srcObject = null;
        }
      }
    };
  }, [isActive, onUserVideoReady, autoStart]);

  // Draw visualization overlay
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    const activePose = pose || lastPoseRef.current;
    if (!activePose) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match DISPLAYED size (CSS pixels) and DPR
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || video.clientWidth || 640;
    const h = canvas.clientHeight || video.clientHeight || 480;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear canvas (use CSS pixels with transparency)
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;

    // Compute object-contain content rectangle to avoid cropping
    const vw = video.videoWidth || w;
    const vh = video.videoHeight || h;
    const scale = Math.min(w / vw, h / vh);
    const contentW = vw * scale;
    const contentH = vh * scale;
    const offsetX = (w - contentW) / 2;
    const offsetY = (h - contentH) / 2;

    // Draw pose skeleton
    const poseColor = realTimeFeedback && realTimeFeedback.poseSimilarityScore > 75 
      ? '#39FF14' // Green for good form
      : realTimeFeedback && realTimeFeedback.poseSimilarityScore > 50
      ? '#FFD700' // Yellow for moderate form
      : '#FF4500'; // Orange/red for poor form

    ctx.save();
    ctx.translate(offsetX, offsetY);
    drawSkeleton(ctx, activePose, poseColor, contentW, contentH);

    // Draw joint angles if enabled
    if (showAngles) {
      drawJointAnglesOverlay(ctx, activePose, contentW, contentH, poseColor);
    }
    ctx.restore();

    // Draw real-time feedback overlays
    if (showFeedback && realTimeFeedback) {
      drawFeedbackOverlay(ctx, realTimeFeedback, canvas.width, canvas.height);
    }
  }, [pose, realTimeFeedback, showAngles, showFeedback]);

  const drawFeedbackOverlay = useCallback((
    ctx: CanvasRenderingContext2D, 
    feedback: RealTimeFeedback, 
    width: number, 
    height: number
  ) => {
    // Draw overall score
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px ui-sans-serif, system-ui';
    ctx.fillText('Pose Accuracy', 20, 30);
    
    ctx.font = 'bold 20px ui-sans-serif, system-ui';
    const scoreColor = feedback.poseSimilarityScore > 75 ? '#39FF14' : 
                      feedback.poseSimilarityScore > 50 ? '#FFD700' : '#FF4500';
    ctx.fillStyle = scoreColor;
    ctx.fillText(`${feedback.poseSimilarityScore}%`, 20, 50);
    ctx.restore();

    // Draw improvement suggestions
    if (feedback.improvements.length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
      ctx.fillRect(10, height - 100, width - 20, 80);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px ui-sans-serif, system-ui';
      ctx.fillText('💡 Improvements:', 20, height - 80);
      
      ctx.font = '12px ui-sans-serif, system-ui';
      feedback.improvements.slice(0, 2).forEach((improvement, index) => {
        ctx.fillText(`• ${improvement}`, 20, height - 60 + index * 20);
      });
      ctx.restore();
    }

    // Draw joint status indicators
    if (showAdvancedMetrics) {
      drawJointStatusIndicators(ctx, feedback, width, height);
    }
  }, [showAdvancedMetrics]);

  const drawJointStatusIndicators = useCallback((
    ctx: CanvasRenderingContext2D,
    feedback: RealTimeFeedback,
    width: number,
    height: number
  ) => {
    const startX = width - 200;
    const startY = 10;
    let yOffset = 0;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(startX, startY, 190, 200);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px ui-sans-serif, system-ui';
    ctx.fillText('Joint Analysis', startX + 10, startY + 20);
    
    ctx.font = '10px ui-sans-serif, system-ui';
    Object.entries(feedback.jointAccuracies).forEach(([joint, data]) => {
      yOffset += 20;
      
      // Joint name
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(joint.charAt(0).toUpperCase() + joint.slice(1), startX + 10, startY + 20 + yOffset);
      
      // Status indicator
      const statusColor = data.severity === 'excellent' ? '#39FF14' :
                         data.severity === 'good' ? '#FFD700' :
                         data.severity === 'needs_improvement' ? '#FF8C00' : '#FF4500';
      
      ctx.fillStyle = statusColor;
      ctx.fillRect(startX + 120, startY + 12 + yOffset, 60, 8);
      
      // Percentage
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${data.similarity.toFixed(0)}%`, startX + 150, startY + 20 + yOffset);
    });
    
    ctx.restore();
  }, []);

  // Update visualization when pose or feedback changes
  useEffect(() => {
    if (!isActive) return;
    const tick = () => {
      drawVisualization();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, drawVisualization]);

  // Track last non-null pose so overlay remains responsive during skipped frames
  useEffect(() => {
    if (pose) lastPoseRef.current = pose;
  }, [pose]);

  // Handle pose updates from parent
  useEffect(() => {
    if (onPoseDetected) {
      onPoseDetected(pose ?? null);
    }
  }, [pose, onPoseDetected]);

  const disableWebcam = () => {
    console.log('[ConcurrentWebcamFeed] Disabling webcam');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      (videoRef.current as any).srcObject = null;
    }
    if (previewRef.current) {
      (previewRef.current as any).srcObject = null;
    }
    setIsActive(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'excellent': return '🎯';
      case 'good': return '👍';
      case 'needs_improvement': return '⚡';
      case 'poor': return '🚨';
      default: return '📊';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'needs_improvement': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
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

          {angles && (
            <div className="absolute top-4 right-24 z-10 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-600/60 text-white">
              <div className="text-xs font-semibold mb-1">Your Angles</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-200">
                <div>L-Shoulder: {Math.round(angles.leftShoulder)}°</div>
                <div>R-Shoulder: {Math.round(angles.rightShoulder)}°</div>
                <div>L-Elbow: {Math.round(angles.leftElbow)}°</div>
                <div>R-Elbow: {Math.round(angles.rightElbow)}°</div>
                <div>L-Hip: {Math.round(angles.leftHip)}°</div>
                <div>R-Hip: {Math.round(angles.rightHip)}°</div>
                <div>L-Knee: {Math.round(angles.leftKnee)}°</div>
                <div>R-Knee: {Math.round(angles.rightKnee)}°</div>
              </div>
            </div>
          )}
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
            <div className="px-4 py-2 bg-red-900/50 border border-red-500/50 rounded-lg max-w-md">
              <p className="text-red-300 text-sm font-medium text-center">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Video and Canvas */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-contain bg-black z-0"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10 mix-blend-normal"
            style={{ background: 'transparent' }}
          />
          {/* Live thumbnail preview of your video */}
          <video
            ref={previewRef}
            autoPlay
            playsInline
            muted
            className="absolute top-3 right-3 w-40 h-28 object-cover rounded-md border border-white/20 shadow-lg pointer-events-none z-20"
          />

          {/* Control Buttons */}
          <div className="absolute bottom-4 left-4 z-20 flex gap-2">
            <button
              onClick={disableWebcam}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          </div>

          {/* Status Indicators */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-green-500/50 shadow-lg">
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <div className="absolute inset-0 bg-green-500 rounded-full blur-sm"></div>
              </div>
              <span className="text-white text-sm font-bold">
                {isProcessing ? 'PROCESSING' : 'READY'}
              </span>
              <span className="text-green-300 text-sm">Your Form</span>
            </div>

            {/* Performance Metrics */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-600/60">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-white/80">{frameRate.toFixed(1)} FPS</span>
            </div>

            {/* Real-time Feedback Summary */}
            {realTimeFeedback && (
              <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-blue-500/50 max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-white font-medium">Live Analysis</span>
                </div>
                <div className="text-xs text-blue-300">
                  Score: {realTimeFeedback.poseSimilarityScore}%
                </div>
                {realTimeFeedback.improvements.length > 0 && (
                  <div className="text-xs text-yellow-300 mt-1">
                    Focus: {realTimeFeedback.improvements[0]}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedMetrics 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-black/50 text-slate-400 hover:text-white'
              }`}
              title="Toggle advanced metrics"
            >
              <Activity className="w-4 h-4" />
            </button>
            
            <button
              onClick={disableWebcam}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg"
            >
              Stop Camera
            </button>
          </div>

          {/* Bottom Status Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            {realTimeFeedback && (
              <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 border border-slate-600/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">
                    {realTimeFeedback.overallFeedback}
                  </span>
                  <span className={`text-lg font-bold ${
                    realTimeFeedback.poseSimilarityScore > 75 ? 'text-green-400' :
                    realTimeFeedback.poseSimilarityScore > 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {realTimeFeedback.poseSimilarityScore}%
                  </span>
                </div>
                
                {/* Joint Status Quick View */}
                <div className="flex gap-1 overflow-x-auto">
                  {Object.entries(realTimeFeedback.jointAccuracies).map(([joint, data]) => (
                    <div 
                      key={joint}
                      className="flex-shrink-0 flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded text-xs"
                      title={`${joint}: ${data.feedback}`}
                    >
                      <span className="text-lg">{getSeverityIcon(data.severity)}</span>
                      <span className={`font-medium ${getSeverityColor(data.severity)}`}>
                        {joint.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
