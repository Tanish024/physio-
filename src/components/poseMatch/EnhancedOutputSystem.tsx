import React, { useState, useRef, useEffect } from 'react';
import { Pose, AccuracyMetrics } from '../../types/pose';
import { JointAccuracyDetails } from '../../utils/liveAccuracyMatcher';
import { drawSkeleton, drawJointAnglesOverlay } from '../../utils/poseUtils';
import { Download, Eye, EyeOff, Activity, Zap, Target, TrendingUp } from 'lucide-react';

interface EnhancedOutputSystemProps {
  userPose: Pose | null;
  trainerPose: Pose | null;
  accuracy: AccuracyMetrics;
  jointDetails: JointAccuracyDetails[];
  frameRate: number;
  confidence: number;
  isStable: boolean;
  syncStatus: 'synced' | 'out_of_sync' | 'no_trainer';
  onExportData?: () => void;
}

interface VisualizationOptions {
  showSkeleton: boolean;
  showAngles: boolean;
  showJointDetails: boolean;
  showPerformanceMetrics: boolean;
  highlightPoorFormJoints: boolean;
}

export function EnhancedOutputSystem({
  userPose,
  trainerPose,
  accuracy,
  jointDetails,
  frameRate,
  confidence,
  isStable,
  syncStatus,
  onExportData
}: EnhancedOutputSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualOptions, setVisualOptions] = useState<VisualizationOptions>({
    showSkeleton: true,
    showAngles: true,
    showJointDetails: true,
    showPerformanceMetrics: true,
    highlightPoorFormJoints: true
  });

  // Real-time accuracy history for trend visualization
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const historyMaxLength = 50;

  useEffect(() => {
    setAccuracyHistory(prev => {
      const newHistory = [...prev, accuracy.overall].slice(-historyMaxLength);
      return newHistory;
    });
  }, [accuracy.overall]);

  useEffect(() => {
    drawComparison();
  }, [userPose, trainerPose, visualOptions]);

  const drawComparison = () => {
    const canvas = canvasRef.current;
    if (!canvas || (!userPose && !trainerPose)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Side-by-side comparison layout
    const halfWidth = canvas.width / 2;
    const fullHeight = canvas.height;

    // Draw trainer pose on left side
    if (trainerPose && visualOptions.showSkeleton) {
      ctx.save();
      ctx.translate(0, 0);
      ctx.scale(1, 1);
      drawSkeleton(ctx, trainerPose, '#00B3FF', halfWidth, fullHeight);
      if (visualOptions.showAngles) {
        drawJointAnglesOverlay(ctx, trainerPose, halfWidth, fullHeight, '#00B3FF');
      }
      ctx.restore();

      // Label
      ctx.save();
      ctx.fillStyle = '#00B3FF';
      ctx.font = 'bold 16px ui-sans-serif, system-ui';
      ctx.fillText('Trainer', 10, 25);
      ctx.restore();
    }

    // Draw user pose on right side
    if (userPose && visualOptions.showSkeleton) {
      ctx.save();
      ctx.translate(halfWidth, 0);
      ctx.scale(1, 1);
      const userColor = accuracy.overall > 80 ? '#39FF14' : accuracy.overall > 60 ? '#FFD700' : '#FF4500';
      drawSkeleton(ctx, userPose, userColor, halfWidth, fullHeight);
      if (visualOptions.showAngles) {
        drawJointAnglesOverlay(ctx, userPose, halfWidth, fullHeight, userColor);
      }
      ctx.restore();

      // Label
      ctx.save();
      ctx.fillStyle = userColor;
      ctx.font = 'bold 16px ui-sans-serif, system-ui';
      ctx.fillText('Your Form', halfWidth + 10, 25);
      ctx.restore();
    }

    // Draw divider line
    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, fullHeight);
    ctx.stroke();
    ctx.restore();

    // Highlight poor form joints if enabled
    if (visualOptions.highlightPoorFormJoints && visualOptions.showJointDetails) {
      highlightPoorFormJoints(ctx, halfWidth, fullHeight);
    }
  };

  const highlightPoorFormJoints = (ctx: CanvasRenderingContext2D, halfWidth: number, fullHeight: number) => {
    const poorJoints = jointDetails.filter(joint => joint.severity === 'major' || joint.severity === 'moderate');
    
    poorJoints.forEach(joint => {
      // This would need to map joint names to keypoint positions
      // For now, just draw warnings as text
      ctx.save();
      ctx.fillStyle = joint.severity === 'major' ? '#FF4500' : '#FFD700';
      ctx.font = 'bold 12px ui-sans-serif, system-ui';
      ctx.fillText(`⚠ ${joint.jointName}`, halfWidth + 10, 50 + poorJoints.indexOf(joint) * 20);
      ctx.restore();
    });
  };

  const getSeverityColor = (severity: JointAccuracyDetails['severity']) => {
    switch (severity) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-300';
      case 'minor': return 'text-yellow-400';
      case 'moderate': return 'text-orange-400';
      case 'major': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityIcon = (severity: JointAccuracyDetails['severity']) => {
    switch (severity) {
      case 'excellent': return '🎯';
      case 'good': return '✅';
      case 'minor': return '⚡';
      case 'moderate': return '⚠️';
      case 'major': return '🚨';
      default: return '❓';
    }
  };

  const exportPoseData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      userPose: userPose ? {
        keypoints: userPose.keypoints,
        score: userPose.score
      } : null,
      trainerPose: trainerPose ? {
        keypoints: trainerPose.keypoints,
        score: trainerPose.score
      } : null,
      accuracy,
      jointDetails,
      performance: {
        frameRate,
        confidence,
        isStable,
        syncStatus
      },
      accuracyHistory
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pose-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExportData?.();
  };

  return (
    <div className="space-y-6">
      {/* Main Visualization Canvas */}
      <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-700">
        <canvas 
          ref={canvasRef}
          className="w-full h-96"
          style={{ minHeight: '384px' }}
        />
        
        {/* Overlay Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setVisualOptions(prev => ({ ...prev, showSkeleton: !prev.showSkeleton }))}
            className={`p-2 rounded-lg transition-colors ${
              visualOptions.showSkeleton 
                ? 'bg-blue-600 text-white' 
                : 'bg-black/50 text-slate-400 hover:text-white'
            }`}
            title="Toggle skeleton display"
          >
            {visualOptions.showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setVisualOptions(prev => ({ ...prev, showAngles: !prev.showAngles }))}
            className={`p-2 rounded-lg transition-colors ${
              visualOptions.showAngles 
                ? 'bg-purple-600 text-white' 
                : 'bg-black/50 text-slate-400 hover:text-white'
            }`}
            title="Toggle angle display"
          >
            <Target className="w-4 h-4" />
          </button>

          <button
            onClick={exportPoseData}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Export pose data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="absolute bottom-4 left-4 flex gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            syncStatus === 'synced' 
              ? 'bg-green-900/50 text-green-300 border border-green-700/50'
              : 'bg-red-900/50 text-red-300 border border-red-700/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            {syncStatus === 'synced' ? 'Synced' : 'Not Synced'}
          </div>

          {isStable && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 text-blue-300 border border-blue-700/50 rounded-lg text-sm font-medium">
              <Activity className="w-4 h-4" />
              Stable
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {visualOptions.showPerformanceMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Frame Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{frameRate.toFixed(1)}</div>
            <div className="text-xs text-slate-400">FPS</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Confidence</span>
            </div>
            <div className="text-2xl font-bold text-white">{(confidence * 100).toFixed(1)}%</div>
            <div className="text-xs text-slate-400">Detection</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-slate-300">Overall</span>
            </div>
            <div className="text-2xl font-bold text-white">{accuracy.overall.toFixed(1)}%</div>
            <div className="text-xs text-slate-400">Accuracy</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Status</span>
            </div>
            <div className="text-lg font-bold text-white">
              {isStable ? 'Stable' : 'Adjusting'}
            </div>
            <div className="text-xs text-slate-400">Measurement</div>
          </div>
        </div>
      )}

      {/* Joint Details */}
      {visualOptions.showJointDetails && jointDetails.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Joint Analysis
          </h3>
          
          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {jointDetails.slice(0, 8).map((joint, index) => (
              <div 
                key={joint.jointName}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getSeverityIcon(joint.severity)}</span>
                  <div>
                    <div className="font-medium text-white capitalize">
                      {joint.jointName.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-slate-400">
                      {joint.userAngle.toFixed(1)}° vs {joint.trainerAngle.toFixed(1)}°
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getSeverityColor(joint.severity)}`}>
                      {joint.accuracy.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500">
                      ±{joint.angleDifference.toFixed(1)}°
                    </div>
                  </div>
                  
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        joint.accuracy > 90 ? 'bg-green-500' :
                        joint.accuracy > 70 ? 'bg-yellow-500' :
                        joint.accuracy > 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(joint.accuracy, 5)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {jointDetails.length > 8 && (
            <div className="mt-3 text-center">
              <button 
                onClick={() => setVisualOptions(prev => ({ ...prev, showJointDetails: !prev.showJointDetails }))}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Show all {jointDetails.length} joints
              </button>
            </div>
          )}
        </div>
      )}

      {/* Accuracy Trend */}
      {accuracyHistory.length > 10 && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Accuracy Trend
          </h3>
          
          <div className="h-24 flex items-end justify-between gap-1">
            {accuracyHistory.slice(-30).map((acc, index) => (
              <div 
                key={index}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  acc > 80 ? 'bg-green-500' :
                  acc > 60 ? 'bg-yellow-500' :
                  acc > 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ height: `${Math.max(acc, 5)}%` }}
                title={`${acc.toFixed(1)}% accuracy`}
              />
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>-30s</span>
            <span>Now</span>
          </div>
        </div>
      )}
    </div>
  );
}
