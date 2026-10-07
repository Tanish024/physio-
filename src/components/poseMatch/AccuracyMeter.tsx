import { AccuracyMetrics } from '../../types/pose';
import { getMotivationalMessage } from '../../utils/poseUtils';
import { Activity, TrendingUp } from 'lucide-react';

interface AccuracyMeterProps {
  metrics: AccuracyMetrics;
  isActive: boolean;
}

export function AccuracyMeter({ metrics, isActive }: AccuracyMeterProps) {
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'from-green-500 to-emerald-400';
    if (accuracy >= 60) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-pink-400';
  };

  const getAccuracyTextColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-green-400';
    if (accuracy >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 border border-blue-500/30 shadow-2xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur-md opacity-50"></div>
            <div className="relative p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Form Accuracy</h2>
            <div className="text-cyan-300 text-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time pose analysis</span>
            </div>
          </div>
        </div>

        {isActive ? (
          <>
            <div className="mb-8">
              <div className="flex items-end justify-between mb-4">
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wide">Overall Score</span>
                <div className="relative">
                  <div className={`absolute inset-0 ${getAccuracyTextColor(metrics.overall)} blur-2xl opacity-30`}></div>
                  <span className={`relative text-6xl font-black ${getAccuracyTextColor(metrics.overall)} drop-shadow-lg`}>
                    {Math.round(metrics.overall)}%
                  </span>
                </div>
              </div>

              <div className="relative h-5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${getAccuracyColor(metrics.overall)} transition-all duration-500 ease-out relative`}
                  style={{ width: `${metrics.overall}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent"></div>
                </div>
              </div>

              <div className="mt-5 p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-500/30 backdrop-blur-sm shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-300" />
                  </div>
                  <p className="font-semibold text-purple-200">{getMotivationalMessage(metrics.overall)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-semibold">Upper Body</span>
                  <span className="text-white text-base font-bold">
                    {Math.round(metrics.upperBody)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 relative"
                    style={{ width: `${metrics.upperBody}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-semibold">Core</span>
                  <span className="text-white text-base font-bold">
                    {Math.round(metrics.core)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 relative"
                    style={{ width: `${metrics.core}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-semibold">Lower Body</span>
                  <span className="text-white text-base font-bold">
                    {Math.round(metrics.lowerBody)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 relative"
                    style={{ width: `${metrics.lowerBody}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 bg-slate-800 rounded-full animate-pulse"></div>
              <div className="relative w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700">
                <Activity className="w-10 h-10 text-slate-600" />
              </div>
            </div>
            <p className="text-slate-400 font-medium">
              Enable webcam to start tracking
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Your form metrics will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}