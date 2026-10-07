import { useRef, useState } from "react";
import { Image as ImageIcon, UploadCloud } from "lucide-react";
import { Pose } from "../../types/pose";
import { normalizePose } from "../../utils/poseUtils";

interface TrainerImageUploadProps {
  detectPose: (media: HTMLImageElement) => Promise<Pose | null>;
  onReferenceReady: (pose: Pose) => void;
}

export function TrainerImageUpload({ detectPose, onReferenceReady }: TrainerImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const pose = await detectPose(img);
      if (!pose) {
        setError("No pose detected in this image.");
        setIsProcessing(false);
        return;
      }

      const normalized = normalizePose(pose, img.naturalWidth || img.width, img.naturalHeight || img.height);
      onReferenceReady(normalized);
    } catch (e: any) {
      setError(e?.message || "Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
            <ImageIcon className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="text-white font-semibold">Upload Trainer Image</div>
            <div className="text-slate-400 text-xs">Detect pose from a picture to use as reference</div>
          </div>
        </div>
        <button onClick={handlePick} disabled={isProcessing} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
          <UploadCloud className="w-4 h-4" /> Choose Image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {previewUrl && (
        <div className="mt-3">
          <img src={previewUrl} alt="trainer preview" className="max-h-56 w-auto rounded-xl border border-slate-700" />
        </div>
      )}
      {error && (
        <div className="mt-3 text-amber-300 text-sm">{error}</div>
      )}
      {isProcessing && (
        <div className="mt-3 text-slate-300 text-sm">Processing image…</div>
      )}
    </div>
  );
}
