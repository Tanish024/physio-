import { useEffect, useMemo, useRef, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Play, Link as LinkIcon, AlertTriangle, Camera } from 'lucide-react';
import { Pose } from '../../types/pose';
import { VideoSkeletonOverlay } from './VideoSkeletonOverlay';

interface YouTubePlayerProps {
  onReady?: (event: any) => void;
  onCaptureTrainerPose?: () => Promise<void>;
  isCapturing?: boolean;
  trainerPose?: Pose | null;
}

export function YouTubePlayer({ onReady, onCaptureTrainerPose, isCapturing, trainerPose }: YouTubePlayerProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const extractVideoId = (input: string): string | null => {
    const s = input.trim();

    // If a bare 11-char ID is provided
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;

    // Ensure we can URL-parse even if protocol is missing
    let urlStr = s;
    if (!/^https?:\/\//i.test(urlStr)) urlStr = `https://${urlStr}`;

    try {
      const u = new URL(urlStr);
      const host = u.hostname.toLowerCase();

      // youtu.be/<id>
      if (host === 'youtu.be') {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] && /^[A-Za-z0-9_-]{11}$/.test(parts[0])) return parts[0];
      }

      // *.youtube.com paths
      if (host.endsWith('youtube.com')) {
        // watch?v=<id>
        const v = u.searchParams.get('v');
        if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

        // shorts/<id>
        const shorts = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
        if (shorts) return shorts[1];

        // embed/<id>
        const embed = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
        if (embed) return embed[1];

        // live/<id>
        const live = u.pathname.match(/\/live\/([A-Za-z0-9_-]{11})/);
        if (live) return live[1];
      }
    } catch {
      // Fall through to regex fallback
    }

    // Fallback regex for odd cases and pasted text
    const fallback = s.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return fallback ? fallback[1] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const id = extractVideoId(videoUrl.trim());
    if (id) {
      setVideoId(id);
    } else {
      setVideoId(null);
      setError('Could not recognize a valid YouTube URL. Try a full video link.');
    }
  };

  const opts: YouTubeProps['opts'] = useMemo(() => {
    let origin: string | undefined;
    try {
      const { protocol } = window.location;
      if (protocol === 'http:' || protocol === 'https:') {
        origin = window.location.origin;
      }
    } catch {
      // ignore
    }

    return {
      width: '100%',
      height: '100%',
      host: 'https://www.youtube.com',
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        iv_load_policy: 3,
        enablejsapi: 1,
        ...(origin ? { origin } : {}),
      },
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
      {!videoId ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-blue-900/30 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative p-6 bg-slate-900 rounded-full border-4 border-slate-700">
              <Play className="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <div className="w-full max-w-md">
            <h3 className="text-white text-2xl font-bold mb-6 text-center">
              Load Training Video
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/80 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-all"
                />
              </div>
              <button
                type="submit"
                className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Load Video
                </span>
              </button>
            </form>
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
              <p className="text-blue-200 text-sm text-center">
                Paste any YouTube workout video URL to get started
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black youtube-container">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onReady}
              onError={() => setError('YouTube refused to load this video (embedding blocked). Try another video.')}
              className="w-full h-full"
              iframeClassName="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          {error && (
            <div className="absolute bottom-4 left-4 right-4 z-10 px-4 py-3 bg-amber-900/50 border border-amber-600/50 rounded-lg">
              <div className="flex items-center gap-2 text-amber-200">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-500/50 shadow-lg">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm"></div>
              </div>
              <span className="text-white text-sm font-bold">Trainer Video</span>
            </div>
            {onCaptureTrainerPose && (
              <button
                onClick={onCaptureTrainerPose}
                disabled={isCapturing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-xl border border-green-500/50 shadow-lg transition-all"
              >
                <Camera className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">
                  {isCapturing ? 'Capturing...' : '📸 Capture Trainer Pose'}
                </span>
              </button>
            )}
          </div>
          {trainerPose && dims.w > 0 && dims.h > 0 && (
            <VideoSkeletonOverlay
              pose={trainerPose}
              videoWidth={dims.w}
              videoHeight={dims.h}
            />
          )}
          <button
            onClick={() => setVideoId(null)}
            className="absolute top-4 right-4 z-10 px-4 py-2 bg-black/70 backdrop-blur-md text-white text-sm font-semibold rounded-xl hover:bg-black/90 transition-all border border-slate-600 hover:border-blue-500 shadow-lg"
          >
            Change Video
          </button>
        </>
      )}
    </div>
  );
}
