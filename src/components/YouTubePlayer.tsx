import { useMemo, useState } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Play, Link as LinkIcon, AlertTriangle } from "lucide-react";

interface YouTubePlayerProps {
  onReady?: (event: any) => void;
}

export function YouTubePlayer({ onReady }: YouTubePlayerProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
      /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/.+\bv=([A-Za-z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const id = extractVideoId(videoUrl.trim());
    if (id) {
      setVideoId(id);
    } else {
      setVideoId(null);
      setError("Could not recognize a valid YouTube URL. Try a full video link.");
    }
  };

  const opts: YouTubeProps["opts"] = useMemo(() => {
    let origin: string | undefined;
    try {
      const { protocol } = window.location;
      if (protocol === "http:" || protocol === "https:") {
        origin = window.location.origin;
      }
    } catch {
      // ignore SSR-like cases
    }

    return {
      width: "100%",
      height: "100%",
      host: "https://www.youtube.com",
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        iv_load_policy: 3,
        enablejsapi: 1,
        ...(origin ? { origin } : {})
      }
    };
  }, []);

  return (
    <div className="relative w-full bg-card rounded-2xl overflow-hidden border border-border">
      {!videoId ? (
        <div className="flex flex-col items-center justify-center gap-6 p-6">
          <div className="w-full max-w-xl">
            <h3 className="text-2xl font-bold mb-4">Load Trainer Video</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste a YouTube URL (watch, share, shorts, or embed)"
                  className="w-full pl-12 pr-4 py-3 bg-background border border-input rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90"
              >
                <Play className="w-5 h-5" />
                Load Video
              </button>
            </form>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-100 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Tip: Some videos block embedding. If a video fails to load, try a different video or open it on YouTube.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-video w-full">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onReady}
              onError={() => setError("YouTube refused to load this video (embedding blocked). Try another video.")}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-sm text-muted-foreground">Trainer Video</div>
            <button
              onClick={() => {
                setVideoId(null);
                setError(null);
              }}
              className="px-4 py-2 border border-input rounded-lg hover:bg-accent"
            >
              Change Video
            </button>
          </div>
          {error && (
            <div className="m-4 flex items-center gap-2 text-amber-600 bg-amber-100 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}