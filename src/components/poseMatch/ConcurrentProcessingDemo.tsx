import React, { useEffect, useRef, useState } from 'react';
import { Activity, Zap, Target, PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';
import { useConcurrentPoseProcessor } from '../../hooks/useConcurrentPoseProcessor';
import { usePoseDetection } from '../../hooks/usePoseDetection';

interface ProcessingStats {
  totalFramesProcessed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  landmarkComparisons: number;
  accuracyHistory: number[];
}

export function ConcurrentProcessingDemo() {
  const { detectPose, isLoading, error } = usePoseDetection();
  const concurrentProcessor = useConcurrentPoseProcessor(detectPose, {
    targetFPS: 30,
    enableTemporalSmoothing: true,
    smoothingFactor: 0.2
  });

  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({
    totalFramesProcessed: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    landmarkComparisons: 0,
    accuracyHistory: []
  });

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statsIntervalRef = useRef<number>();

  // Setup webcam
  useEffect(() => {
    if (isRunning && !streamRef.current) {
      setupWebcam();
    }
  }, [isRunning]);

  // Update stats periodically
  useEffect(() => {
    if (isRunning) {
      statsIntervalRef.current = window.setInterval(updateStats, 1000);
    } else {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [isRunning]);

  const setupWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
          if (userVideoRef.current) {
            // Start concurrent processing with user video only (no trainer for demo)
            concurrentProcessor.startConcurrentProcessing(null, userVideoRef.current);
          }
        };
      }
    } catch (err) {
      console.error('Failed to setup webcam:', err);
    }
  };

  const updateStats = () => {
    const state = concurrentProcessor.state;
    const newAccuracy = state.realTimeFeedback.poseSimilarityScore;
    
    setStats(prev => {
      const newHistory = [...prev.accuracyHistory, newAccuracy].slice(-30); // Keep last 30 seconds
      
      return {
        totalFramesProcessed: prev.totalFramesProcessed + 1,
        totalProcessingTime: prev.totalProcessingTime + (1000 / 30), // Approximate
        averageProcessingTime: (prev.totalProcessingTime + (1000 / 30)) / (prev.totalFramesProcessed + 1),
        landmarkComparisons: state.landmarkComparison ? prev.landmarkComparisons + 1 : prev.landmarkComparisons,
        accuracyHistory: newHistory
      };
    });
  };

  const startDemo = () => {
    setIsRunning(true);
    setStats({
      totalFramesProcessed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      landmarkComparisons: 0,
      accuracyHistory: []
    });
  };

  const stopDemo = () => {
    setIsRunning(false);
    concurrentProcessor.stopConcurrentProcessing();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (userVideoRef.current) {
      (userVideoRef.current as any).srcObject = null;
    }
  };

  const resetDemo = () => {
    stopDemo();
    concurrentProcessor.reset();
  };

  const getLandmarkQualityColor = (similarity: number) => {
    if (similarity > 0.9) return 'text-green-400';
    if (similarity > 0.7) return 'text-yellow-400';
    if (similarity > 0.5) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading MediaPipe models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-300">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          🚀 Concurrent Pose Processing Demo
        </h2>
        <p className="text-gray-300">
          Real-time MediaPipe pose detection with landmark comparison and temporal smoothing
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button
            onClick={startDemo}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Start Demo
          </button>
        ) : (
          <button
            onClick={stopDemo}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <PauseCircle className="w-5 h-5" />
            Stop Demo
          </button>
        )}
        
        <button
          onClick={resetDemo}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {/* Video and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Feed */}
        <div className="relative bg-slate-900 rounded-lg overflow-hidden">
          <video
            ref={userVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          
          {isRunning && (
            <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-green-300 text-sm font-medium">
              🎥 LIVE
            </div>
          )}
        </div>

        {/* Real-time Stats */}
        <div className="space-y-4">
          {/* Performance Metrics */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Performance Metrics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">User Stream FPS:</span>
                <span className="text-white font-medium">
                  {concurrentProcessor.state.frameRateUser.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Processing Status:</span>
                <span className={`font-medium ${
                  concurrentProcessor.state.isProcessingUser ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {concurrentProcessor.state.isProcessingUser ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Frames:</span>
                <span className="text-white font-medium">{stats.totalFramesProcessed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Processing:</span>
                <span className="text-white font-medium">
                  {stats.averageProcessingTime.toFixed(1)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Pose Analysis */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Pose Analysis
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Pose Detected:</span>
                <span className={`font-medium ${
                  concurrentProcessor.state.userPose ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {concurrentProcessor.state.userPose ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Landmark Comparisons:</span>
                <span className="text-white font-medium">{stats.landmarkComparisons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Overall Feedback:</span>
                <span className="text-white font-medium text-xs">
                  {concurrentProcessor.state.realTimeFeedback.overallFeedback.slice(0, 20)}...
                </span>
              </div>
            </div>
          </div>

          {/* Joint Analysis */}
          {Object.keys(concurrentProcessor.state.realTimeFeedback.jointAccuracies).length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Joint Analysis
              </h3>
              <div className="space-y-2">
                {Object.entries(concurrentProcessor.state.realTimeFeedback.jointAccuracies)
                  .slice(0, 4)
                  .map(([joint, data]) => (
                    <div key={joint} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm capitalize">{joint}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              data.similarity > 90 ? 'bg-green-500' :
                              data.similarity > 70 ? 'bg-yellow-500' :
                              data.similarity > 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(data.similarity, 5)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getLandmarkQualityColor(data.similarity / 100)}`}>
                          {data.similarity.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accuracy History Chart */}
      {stats.accuracyHistory.length > 5 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Real-time Accuracy Trend</h3>
          <div className="h-24 flex items-end justify-between gap-1">
            {stats.accuracyHistory.slice(-30).map((accuracy, index) => (
              <div 
                key={index}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  accuracy > 80 ? 'bg-green-500' :
                  accuracy > 60 ? 'bg-yellow-500' :
                  accuracy > 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ height: `${Math.max(accuracy, 5)}%` }}
                title={`${accuracy.toFixed(1)}% accuracy`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>-30s</span>
            <span>Current: {stats.accuracyHistory[stats.accuracyHistory.length - 1]?.toFixed(1) || 0}%</span>
            <span>Now</span>
          </div>
        </div>
      )}
    </div>
  );
}
