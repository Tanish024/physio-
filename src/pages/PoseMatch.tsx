import { useState, useCallback, useRef, useEffect } from 'react';
import { WebcamFeed } from '../components/poseMatch/WebcamFeed';
import { AccuracyMeter } from '../components/poseMatch/AccuracyMeter';
import { YouTubePlayer } from '../components/poseMatch/YouTubePlayer';
import { VideoSkeletonOverlay } from '../components/poseMatch/VideoSkeletonOverlay';
import { drawSkeleton, drawJointAnglesOverlay, calculateJointAngles } from '../utils/poseUtils';
import { MetricsPanel } from '../components/poseMatch/MetricsPanel';
import { TrainerImageUpload } from '../components/poseMatch/TrainerImageUpload';
import { EnhancedOutputSystem } from '../components/poseMatch/EnhancedOutputSystem';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { usePoseEngine } from '../hooks/usePoseEngine';
import { useYouTubePoseTracking } from '../hooks/useYouTubePoseTracking';
import { useDualVideoProcessor } from '../hooks/useDualVideoProcessor';
import { useConcurrentPoseProcessor } from '../hooks/useConcurrentPoseProcessor';
import { ConcurrentWebcamFeed } from '../components/poseMatch/ConcurrentWebcamFeed';
import type { ExerciseType } from '../analysis/poseEngine';
import { Pose, AccuracyMetrics } from '../types/pose';
import { LiveAccuracyMatcher } from '../utils/liveAccuracyMatcher';
import { computeAlignedPoseAccuracy } from '../utils/poseAccuracy';

import { Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function PoseMatch() {
  const navigate = useNavigate();
  const { detectPose, isLoading, error, getPerformanceMetrics, setTargetFPS } = usePoseDetection();
  const [userPose, setUserPose] = useState<Pose | null>(null);
  const [referencePose, setReferencePose] = useState<Pose | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("plank");
  const { output: engineOut, update: updateEngine } = usePoseEngine(selectedExercise);
  const { captureTrainerPose, isCapturing, captureError } = useYouTubePoseTracking(detectPose);
  const [accuracy, setAccuracy] = useState<AccuracyMetrics>({
    overall: 0,
    upperBody: 0,
    lowerBody: 0,
    core: 0,
  });
  
  // Enhanced concurrent processing system
  const concurrentProcessor = useConcurrentPoseProcessor(detectPose, {
    targetFPS: 30,
    enableTemporalSmoothing: true,
    smoothingFactor: 0.2,
    similarityThreshold: 0.85,
    landmarkConfidenceThreshold: 0.55
  });
  
  const liveAccuracyMatcherRef = useRef(new LiveAccuracyMatcher({
    temporalWindowSize: 15,
    smoothingFactor: 0.2,
    useCosineSimilarity: true
  }));

  // Video element refs for concurrent processing
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const trainerVideoRef = useRef<HTMLVideoElement>(null);
  const trainerStreamRef = useRef<MediaStream | null>(null);
  const [isTrainerCaptureActive, setIsTrainerCaptureActive] = useState(false);
  const trainerPreviewRef = useRef<HTMLDivElement>(null);
  const [trainerPreviewDims, setTrainerPreviewDims] = useState<{w:number;h:number}>({w:0,h:0});
  const trainerCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Concurrent processing state tracking
  const [isProcessingStarted, setIsProcessingStarted] = useState(false);

  // Initialize performance settings
  useEffect(() => {
    setTargetFPS(30); // Lower FPS for stability
    console.log('[PoseMatch] Initialized with target FPS: 30');
  }, [setTargetFPS]);
  
  // Start concurrent processing when both videos are ready
  const startConcurrentProcessing = useCallback(() => {
    if (userVideoRef.current && !isProcessingStarted) {
      console.log('Starting concurrent pose processing...');
      concurrentProcessor.startConcurrentProcessing(
        trainerVideoRef.current, // Can be null initially
        userVideoRef.current
      );
      setIsProcessingStarted(true);
    }
  }, [concurrentProcessor, isProcessingStarted]);

  // Ensure the captured trainer stream is attached to the visible <video> element
  useEffect(() => {
    if (!isTrainerCaptureActive) return;
    const el = trainerVideoRef.current as HTMLVideoElement | null;
    const stream = trainerStreamRef.current as MediaStream | null;
    if (el && stream) {
      try {
        (el as any).srcObject = stream;
        el.muted = true;
        el.play().catch(() => {});
      } catch {}
    }
  }, [isTrainerCaptureActive]);
  
  // Update local state from concurrent processor and compute Euclidean+angle accuracy
  useEffect(() => {
    const state = concurrentProcessor.state;
    setUserPose(state.userPose);
    setReferencePose(state.trainerPose);
    if (state.userPose && state.trainerPose) {
      const metrics = computeAlignedPoseAccuracy(state.userPose, state.trainerPose);
      setAccuracy(metrics);
    } else {
      setAccuracy(state.accuracy);
    }
  }, [concurrentProcessor.state]);

  useEffect(() => {
    if (!isTrainerCaptureActive) return;
    const pose = concurrentProcessor.state.trainerPose;
    const canvas = trainerCanvasRef.current;
    const video = trainerVideoRef.current;
    if (!pose || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = trainerPreviewDims;
    if (w <= 0 || h <= 0) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const vw = (video && video.videoWidth) ? video.videoWidth : w;
    const vh = (video && video.videoHeight) ? video.videoHeight : h;
    const scale = Math.min(w / vw, h / vh);
    const contentW = vw * scale;
    const contentH = vh * scale;
    const offsetX = (w - contentW) / 2;
    const offsetY = (h - contentH) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    drawSkeleton(ctx, pose, '#3B82F6', contentW, contentH);
    drawJointAnglesOverlay(ctx, pose, contentW, contentH, '#60A5FA');
    ctx.restore();
  }, [isTrainerCaptureActive, trainerPreviewDims, concurrentProcessor.state.trainerPose]);

  const handleCaptureTrainerPose = useCallback(async () => {
    const pose = await captureTrainerPose();
    if (pose) {
      setReferencePose(pose);
      // Reset the live accuracy matcher when new trainer pose is set
      liveAccuracyMatcherRef.current.reset();
      toast.success('Trainer pose captured!', {
        description: 'Now match the pose with your webcam'
      });
    } else if (captureError) {
      toast.error('Failed to capture pose', {
        description: captureError
      });
    }
  }, [captureTrainerPose, captureError]);

  // Handle user video ready for processing
  const handleUserVideoReady = useCallback((videoElement: HTMLVideoElement) => {
    console.log('[PoseMatch] User video ready, starting processing...');
    userVideoRef.current = videoElement;
    
    // Always restart processing to ensure fresh state
    concurrentProcessor.stopConcurrentProcessing();
    setIsProcessingStarted(false);
    
    // Small delay to ensure clean restart
    setTimeout(() => {
      console.log('[PoseMatch] Starting concurrent processing with user video');
      concurrentProcessor.startConcurrentProcessing(
        trainerVideoRef.current,
        videoElement
      );
      setIsProcessingStarted(true);
    }, 100);
  }, [concurrentProcessor]);
  
  // Handle trainer video ready for processing
  const handleTrainerVideoReady = useCallback((videoElement: HTMLVideoElement) => {
    trainerVideoRef.current = videoElement;
    // Restart processing with trainer video included
    if (isProcessingStarted) {
      concurrentProcessor.stopConcurrentProcessing();
      setIsProcessingStarted(false);
      setTimeout(() => {
        concurrentProcessor.startConcurrentProcessing(
          videoElement,
          userVideoRef.current
        );
        setIsProcessingStarted(true);
      }, 100);
    }
  }, [concurrentProcessor, isProcessingStarted]);

  // Start live screen capture of the trainer video/tab and feed to processor
  const startTrainerCapture = useCallback(async () => {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30 },
        audio: false
      });
      trainerStreamRef.current = stream;

      // Create/attach a hidden video element for processing
      let vid = trainerVideoRef.current;
      if (!vid) {
        vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true as any;
        trainerVideoRef.current = vid;
      }
      vid.srcObject = stream as MediaStream;
      await vid.play();

      // (Re)start concurrent processing including trainer video
      if (isProcessingStarted) {
        concurrentProcessor.stopConcurrentProcessing();
        setIsProcessingStarted(false);
      }
      concurrentProcessor.startConcurrentProcessing(
        trainerVideoRef.current,
        userVideoRef.current
      );
      setIsProcessingStarted(true);
      setIsTrainerCaptureActive(true);
      toast.success('Trainer capture started. Select the YouTube tab/window for best results.');
    } catch (e) {
      toast.error('Unable to start trainer capture');
    }
  }, [concurrentProcessor, isProcessingStarted]);

  const stopTrainerCapture = useCallback(() => {
    if (trainerStreamRef.current) {
      trainerStreamRef.current.getTracks().forEach(t => t.stop());
      trainerStreamRef.current = null;
    }
    setIsTrainerCaptureActive(false);
    // Keep user processing running; trainer stream will simply be null on next restart
    if (isProcessingStarted) {
      concurrentProcessor.stopConcurrentProcessing();
      setIsProcessingStarted(false);
      setTimeout(() => {
        concurrentProcessor.startConcurrentProcessing(null, userVideoRef.current);
        setIsProcessingStarted(true);
      }, 100);
    }
  }, [concurrentProcessor, isProcessingStarted]);

  const handleUserPoseDetected = useCallback((pose: Pose | null) => {
    if (pose) {
      // Update engine with concurrent processor data
      const accuracy = concurrentProcessor.state.accuracy.overall;
      updateEngine(pose, accuracy / 100);
    } else {
      updateEngine(null, 0);
    }
  }, [concurrentProcessor.state.accuracy.overall, updateEngine]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Loading AI Model</h2>
          <p className="text-gray-400">Setting up pose detection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Error Loading AI Model</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Pose Matching</h1>
            <p className="text-gray-400">Real-time pose analysis and form correction</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trainer Video Panel */}
              <div className="relative group h-[65vh] min-h-[60vh]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative z-10 h-full">
                  <YouTubePlayer 
                    onCaptureTrainerPose={handleCaptureTrainerPose}
                    isCapturing={isCapturing}
                    trainerPose={!isTrainerCaptureActive ? (concurrentProcessor.state.trainerPose || referencePose) : null}
                  />
                  {isTrainerCaptureActive && (
                    <div ref={trainerPreviewRef} className="absolute inset-0 z-10">
                      <video
                        ref={trainerVideoRef}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                        muted
                        playsInline
                        autoPlay
                      />
                      <canvas
                        ref={trainerCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                    </div>
                  )}
                  {/* Trainer Capture Controls */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {!isTrainerCaptureActive ? (
                      <button
                        onClick={startTrainerCapture}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg border border-blue-400/50"
                      >
                        Start Live Trainer Capture
                      </button>
                    ) : (
                      <button
                        onClick={stopTrainerCapture}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg border border-red-400/50"
                      >
                        Stop Trainer Capture
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Webcam Panel with Concurrent Processing */}
              <div className="relative group h-[65vh] min-h-[60vh]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-cyan-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative z-10 h-full">
                  <ConcurrentWebcamFeed
                    onUserVideoReady={handleUserVideoReady}
                    onPoseDetected={handleUserPoseDetected}
                    pose={concurrentProcessor.state.userPose}
                    realTimeFeedback={concurrentProcessor.state.realTimeFeedback}
                    frameRate={concurrentProcessor.state.frameRateUser}
                    isProcessing={concurrentProcessor.state.isProcessingUser}
                    autoStart={true}
                    showAngles={true}
                    showFeedback={true}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Output System */}
            <EnhancedOutputSystem 
              userPose={userPose}
              trainerPose={referencePose}
              accuracy={accuracy}
              jointDetails={(function(){
                const u = userPose ? calculateJointAngles(userPose) : null;
                const t = referencePose ? calculateJointAngles(referencePose) : null;
                return Object.entries(concurrentProcessor.state.realTimeFeedback.jointAccuracies).map(([joint, data]) => {
                  const userAngle = u ? (u as any)[joint] ?? 0 : 0;
                  const trainerAngle = t ? (t as any)[joint] ?? 0 : 0;
                  const angleDifference = (userAngle && trainerAngle) ? Math.abs(userAngle - trainerAngle) : 0;
                  return {
                    jointName: joint,
                    userAngle,
                    trainerAngle,
                    angleDifference,
                    accuracy: data.similarity,
                    confidence: 0.9,
                    feedback: data.feedback,
                    severity: data.severity === 'excellent' ? 'excellent' :
                             data.severity === 'good' ? 'good' :
                             data.severity === 'needs_improvement' ? 'minor' : 'major'
                  };
                });
              })()}
              frameRate={(concurrentProcessor.state.frameRateUser + concurrentProcessor.state.frameRateTrainer) / 2}
              confidence={concurrentProcessor.state.trainerPose && concurrentProcessor.state.userPose ? 0.9 : 0.0}
              isStable={concurrentProcessor.state.landmarkComparison !== null}
              syncStatus={concurrentProcessor.state.syncStatus === 'waiting' ? 'no_trainer' : concurrentProcessor.state.syncStatus}
              onExportData={() => {
                // Export enhanced data including landmark comparisons
                const exportData = {
                  timestamp: new Date().toISOString(),
                  concurrentProcessorState: concurrentProcessor.state,
                  landmarkComparison: concurrentProcessor.state.landmarkComparison,
                  realTimeFeedback: concurrentProcessor.state.realTimeFeedback
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                  type: 'application/json'
                });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `concurrent-pose-analysis-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toast.success('Enhanced pose data exported!', {
                  description: 'Concurrent analysis data saved to your downloads folder'
                });
              }}
            />
            
            {/* Quick Start Guide */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-blue-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">Real-Time AI Analysis</h3>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-green-500/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                      <p className="text-gray-300 text-sm">Load a YouTube training video or capture a trainer pose</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                      <p className="text-gray-300 text-sm">Enable your webcam for real-time pose comparison</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                      <p className="text-gray-300 text-sm">Get live feedback with joint-specific analysis and accuracy scoring</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                    <p className="text-xs text-emerald-200/80">
                      <span className="font-semibold">New Features:</span> 30+ FPS processing, temporal smoothing, cosine similarity matching, and detailed joint analysis for professional-grade pose correction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Exercise selector */}
              <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
                <label className="text-slate-300 text-sm font-semibold block mb-2">Exercise</label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value as ExerciseType)}
                  className="w-full bg-slate-900 text-white rounded-lg border border-slate-700 p-2"
                >
                  <option value="plank">Plank</option>
                  <option value="squat">Squat</option>
                  <option value="pushup">Push-up</option>
                  <option value="yoga">Yoga</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <AccuracyMeter metrics={accuracy} isActive={userPose !== null} />

              {/* Advanced coaching / rep counting */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4">
                <div className="text-white font-semibold mb-3">Smart Coaching</div>
                {engineOut ? (
                  <div className="space-y-2 text-sm">
                    {selectedExercise !== 'plank' && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Reps</span>
                        <span className="text-white font-bold">{engineOut.repCount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Phase</span>
                      <span className="text-white font-bold capitalize">{engineOut.phase}</span>
                    </div>
                    {selectedExercise === 'plank' && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Good-form hold</span>
                        <span className="text-white font-bold">{Math.floor((engineOut.holdTimeMs || 0) / 1000)}s</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Fatigue</span>
                      <span className="text-white font-bold">{Math.round(engineOut.fatigueLevel * 100)}%</span>
                    </div>
                    {engineOut.severity && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Form deviation</span>
                        <span className="text-white font-bold capitalize">{engineOut.severity}</span>
                      </div>
                    )}
                    {engineOut.suggestions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-slate-300 mb-1">Suggestions</div>
                        <ul className="list-disc list-inside text-slate-200 space-y-1">
                          {engineOut.suggestions.slice(0, 3).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400">Start moving to receive coaching.</div>
                )}
              </div>

              <TrainerImageUpload detectPose={detectPose as any} onReferenceReady={(p) => setReferencePose(p)} />
              
              {/* Enhanced Concurrent Processing Metrics */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4">
                <div className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  Concurrent Processing Monitor
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">User Stream</span>
                    <span className="text-white font-bold">{concurrentProcessor.state.frameRateUser.toFixed(1)} FPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Trainer Stream</span>
                    <span className="text-white font-bold">{concurrentProcessor.state.frameRateTrainer.toFixed(1)} FPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">User Processing</span>
                    <span className={`font-bold ${
                      concurrentProcessor.state.isProcessingUser ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {concurrentProcessor.state.isProcessingUser ? 'Active' : 'Idle'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Trainer Processing</span>
                    <span className={`font-bold ${
                      concurrentProcessor.state.isProcessingTrainer ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {concurrentProcessor.state.isProcessingTrainer ? 'Active' : 'Idle'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Sync Status</span>
                    <span className={`font-bold capitalize ${
                      concurrentProcessor.state.syncStatus === 'synced' ? 'text-green-400' :
                      concurrentProcessor.state.syncStatus === 'waiting' ? 'text-blue-400' :
                      concurrentProcessor.state.syncStatus === 'out_of_sync' ? 'text-yellow-400' : 'text-slate-400'
                    }`}>
                      {concurrentProcessor.state.syncStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Pose Similarity</span>
                    <span className="text-white font-bold">
                      {concurrentProcessor.state.realTimeFeedback.poseSimilarityScore}%
                    </span>
                  </div>
                  
                  {/* Landmark Comparison Summary */}
                  {concurrentProcessor.state.landmarkComparison && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="text-slate-300 mb-2">Landmark Analysis</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Overall Similarity:</span>
                          <span className="text-green-300">
                            {(concurrentProcessor.state.landmarkComparison.overallSimilarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Confidence Weighted:</span>
                          <span className="text-blue-300">
                            {(concurrentProcessor.state.landmarkComparison.confidenceWeightedSimilarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Joint Status Alerts */}
                  {Object.keys(concurrentProcessor.state.realTimeFeedback.jointAccuracies).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="text-slate-300 mb-2">Joint Alerts</div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {Object.entries(concurrentProcessor.state.realTimeFeedback.jointAccuracies)
                          .filter(([_, data]: [string, any]) => data.severity === 'poor' || data.severity === 'needs_improvement')
                          .slice(0, 3)
                          .map(([joint, data]: [string, any]) => (
                            <div key={joint} className="text-xs">
                              <span className={data.severity === 'poor' ? 'text-red-400' : 'text-yellow-400'}>
                                {data.severity === 'poor' ? '🚨' : '⚡'}
                              </span>
                              <span className="text-slate-200 ml-1 capitalize">
                                {joint} ({data.similarity.toFixed(0)}%)
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <MetricsPanel userPose={userPose} referencePose={referencePose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoseMatch;