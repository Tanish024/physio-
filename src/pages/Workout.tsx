import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// removed unused Progress/Badge imports after redesign
import { ArrowLeft, Camera, CameraOff, Youtube, PlayCircle, StopCircle, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { usePoseEngine } from "@/hooks/usePoseEngine";
import type { ExerciseType } from "@/analysis/poseEngine";
import type { Pose } from "@/types/pose";
import { normalizePose, drawSkeleton, drawJointAnglesOverlay, calculateJointAngles, ANGLE_TRIPLES } from "@/utils/poseUtils";
import { AccuracyMeter } from "@/components/poseMatch/AccuracyMeter";
import { computeSegmentAccuracy, EXERCISE_ANGLES, type SegmentScores } from "@/analysis/exerciseAngles";

// Local types to avoid importing MediaPipe-based detector
interface FormFeedback {
  score: number; // 0-100
  message: string;
  severity: "excellent" | "good" | "warning" | "critical";
  issues: string[];
  suggestions: string[];
}

interface RepInfo {
  count: number;
  isInPosition: boolean;
  phase: "up" | "down" | "hold" | string;
}

const Workout = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback>({
    score: 0,
    message: "Start workout to see feedback",
    severity: "good",
    issues: [],
    suggestions: [],
  });
  const [repInfo, setRepInfo] = useState<RepInfo>({
    count: 0,
    isInPosition: false,
    phase: "up",
  });
  const [duration, setDuration] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [allFormScores, setAllFormScores] = useState<number[]>([]);
  const [accuracy, setAccuracy] = useState<SegmentScores>({ overall: 0, upperBody: 0, core: 0, lowerBody: 0, issues: [] });
  const activeFramesRef = useRef<number>(0);
  const activationFramesNeeded = 8;

  const exerciseNames: { [key: string]: string } = {
    plank: "Plank",
    squat: "Squats",
    pushup: "Push-ups",
    lunge: "Lunges",
    "jumping-jack": "Jumping Jacks",
  };

  const EXERCISE_GATING: Record<string, { required: string[]; minConf: number; minBodyHeightRatio: number }> = {
    plank: { required: ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee'], minConf: 0.65, minBodyHeightRatio: 0.35 },
    squat: { required: ['leftKnee','rightKnee','leftHip','rightHip'], minConf: 0.7, minBodyHeightRatio: 0.5 },
    pushup: { required: ['leftElbow','rightElbow','leftHip','rightHip'], minConf: 0.65, minBodyHeightRatio: 0.35 },
    lunge: { required: ['leftKnee','rightKnee','leftHip','rightHip'], minConf: 0.7, minBodyHeightRatio: 0.5 },
    'jumping-jack': { required: ['leftShoulder','rightShoulder','leftKnee','rightKnee'], minConf: 0.65, minBodyHeightRatio: 0.45 }
  };

  const validateExerciseFrame = (p: Pose, ex: string): { ok: boolean; issues: string[] } => {
    const cfg = EXERCISE_GATING[ex] || EXERCISE_GATING['plank'];
    const issues: string[] = [];
    const confGate = Math.max(0.5, cfg.minConf - 0.05);
    const video = videoRef.current;
    const vh = video?.videoHeight || 1;
    let visibleRequired = 0;
    const yVals: number[] = [];
    for (const joint of cfg.required) {
      const triple = (ANGLE_TRIPLES as any)[joint] as [number, number, number] | undefined;
      if (!triple) continue;
      const [i1, ip, i3] = triple;
      const kp1 = p.keypoints[i1];
      const kp2 = p.keypoints[ip];
      const kp3 = p.keypoints[i3];
      const avg = ((kp1?.score || 0) + (kp2?.score || 0) + (kp3?.score || 0)) / 3;
      if (avg >= confGate) {
        visibleRequired++;
        [kp1, kp2, kp3].filter(Boolean).forEach((k: any) => yVals.push(k.y > 1 ? k.y : k.y * vh));
      } else {
        issues.push(`Low visibility: ${joint}`);
      }
    }
    const allowedMissing = Math.min(1, Math.floor(cfg.required.length / 3));
    if (visibleRequired < cfg.required.length - allowedMissing) issues.push('Ensure all key joints are in frame');
    if (yVals.length >= 2) {
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);
      const bodyH = Math.max(0, maxY - minY);
      const ratio = bodyH / vh;
      if (ratio < cfg.minBodyHeightRatio) issues.push('Move camera or step back to fit more of your body');
    } else {
      issues.push('Move so required joints are visible');
    }
    return { ok: issues.length === 0, issues };
  };

  const checkExerciseActivation = (angles: Record<string, number>, p: Pose, ex: string): { ok: boolean; issues: string[] } => {
    const t = (EXERCISE_ANGLES[ex] || EXERCISE_ANGLES['plank']).tolerance;
    const get = (k: string) => angles[k];
    const near = (k: string, target: number, tol: number = t) => {
      const v = get(k);
      return isFinite(v as number) && Math.abs((v as number) - target) <= tol;
    };
    const angFromHoriz = (i: number, j: number) => {
      const video = videoRef.current; const w = video?.videoWidth || 1; const h = video?.videoHeight || 1;
      const a = p.keypoints[i]; const b = p.keypoints[j]; if (!a || !b) return 90;
      const ax = a.x > 1 ? a.x : a.x * w; const ay = a.y > 1 ? a.y : a.y * h;
      const bx = b.x > 1 ? b.x : b.x * w; const by = b.y > 1 ? b.y : b.y * h;
      return Math.abs(Math.atan2(by - ay, bx - ax) * 180 / Math.PI);
    };
    let ok = false; const issues: string[] = [];
    switch (ex) {
      case 'plank': {
        let m = 0; if (near('leftHip', 180, 25)) m++; if (near('rightHip', 180, 25)) m++; if (near('leftKnee', 170, 25)) m++; if (near('rightKnee', 170, 25)) m++; if (near('leftShoulder', 165, 30)) m++; if (near('rightShoulder', 165, 30)) m++;
        const torsoOk = Math.min(angFromHoriz(5,11), angFromHoriz(6,12)) < 30;
        ok = m >= 4 && torsoOk; if (!torsoOk) issues.push('Keep torso horizontal');
        break;
      }
      case 'squat': {
        let m = 0; if (near('leftKnee', 90, 25)) m++; if (near('rightKnee', 90, 25)) m++; if (near('leftHip', 150, 30)) m++; if (near('rightHip', 150, 30)) m++;
        const thighOk = Math.max(angFromHoriz(11,13), angFromHoriz(12,14)) > 45;
        ok = m >= 3 && thighOk; if (!thighOk) issues.push('Thighs more vertical');
        break;
      }
      case 'pushup': {
        let m = 0; if (near('leftElbow', 90, 25)) m++; if (near('rightElbow', 90, 25)) m++; if (near('leftHip', 180, 30)) m++; if (near('rightHip', 180, 30)) m++;
        const torsoOk = Math.min(angFromHoriz(5,11), angFromHoriz(6,12)) < 30;
        ok = m >= 3 && torsoOk; if (!torsoOk) issues.push('Keep torso horizontal');
        break;
      }
      case 'lunge': {
        const left = near('leftKnee', 90, 25) && near('rightKnee', 120, 35);
        const right = near('rightKnee', 90, 25) && near('leftKnee', 120, 35);
        const hipOk = near('leftHip', 150, 35) || near('rightHip', 150, 35);
        const thighOk = angFromHoriz(11,13) > 45 || angFromHoriz(12,14) > 45;
        ok = (left || right) && hipOk && thighOk; if (!thighOk) issues.push('Front thigh more vertical');
        break;
      }
      case 'jumping-jack': {
        let m = 0; if (near('leftShoulder', 180, 30)) m++; if (near('rightShoulder', 180, 30)) m++; if (near('leftKnee', 60, 35)) m++; if (near('rightKnee', 60, 35)) m++;
        ok = m >= 3; break;
      }
      default: ok = true;
    }
    return { ok, issues };
  };

  // Map route param -> engine exercise
  const mapToEngineExercise = (id?: string): ExerciseType => {
    switch (id) {
      case "plank":
        return "plank";
      case "squat":
      case "lunge":
      case "jumping-jack":
        return "squat";
      case "pushup":
      default:
        return "pushup";
    }
  };

  const { detectPose, isLoading, error } = usePoseDetection();
  const engine = usePoseEngine(mapToEngineExercise(exerciseId));

  const youtubeLinks: { [key: string]: string } = {
    plank: "https://www.youtube.com/embed/pSHjTRCQxIw",
    squat: "https://www.youtube.com/embed/aclHkVaku9U",
    pushup: "https://www.youtube.com/embed/IODxDxX7oi4",
    lunge: "https://www.youtube.com/embed/QOVaHwm-Q6U",
    "jumping-jack": "https://www.youtube.com/embed/c4DAnQ6DtF8",
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isActive) {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  useEffect(() => {
    return () => {
      // Cleanup
      stopDetectLoop();
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }

      toast.success("Camera ready! Position yourself in frame");
    } catch (e) {
      console.error("Error accessing camera:", e);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const startDetectLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const detectFrame = async () => {
      if (!video || video.readyState !== 4) {
        rafRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rawPose = await detectPose(video);
      let normalizedPose: Pose | null = null;
      if (rawPose) {
        normalizedPose = normalizePose(rawPose, canvas.width, canvas.height);
        const currentAngles = calculateJointAngles(normalizedPose);
        const exKey = (exerciseId || "plank");
        const frameOk = validateExerciseFrame(normalizedPose, exKey);
        if (!frameOk.ok) {
          setAccuracy({ overall: 0, upperBody: 0, core: 0, lowerBody: 0, issues: frameOk.issues });
          drawSkeleton(ctx, normalizedPose, "#ef4444", canvas.width, canvas.height);
        } else {
          const active = checkExerciseActivation(currentAngles as any, normalizedPose, exKey);
          if (active.ok) activeFramesRef.current = Math.min(activationFramesNeeded, activeFramesRef.current + 1); else activeFramesRef.current = 0;
          if (activeFramesRef.current >= activationFramesNeeded) {
            const seg = computeSegmentAccuracy(currentAngles, exKey);
            setAccuracy(seg);
            const overlayColor = seg.overall >= 80 ? "#22c55e" : seg.overall >= 60 ? "#f59e0b" : "#ef4444";
            drawSkeleton(ctx, normalizedPose, overlayColor, canvas.width, canvas.height);
            drawJointAnglesOverlay(ctx, normalizedPose, canvas.width, canvas.height, overlayColor);
          } else {
            setAccuracy({ overall: 0, upperBody: 0, core: 0, lowerBody: 0, issues: active.issues });
            drawSkeleton(ctx, normalizedPose, "#f59e0b", canvas.width, canvas.height);
          }
        }
      }

      // For engine accuracy gate, pass 1 to keep rep detection permissive.
      // We use engine suggestions/severity for feedback.
      if (normalizedPose) {
        engine.update(normalizedPose, 1);
      } else {
        // Reset output when no pose
        engine.update(null as any, 0);
      }

      const out = engine.output;
      if (out) {
        setRepInfo({
          count: out.repCount,
          isInPosition: out.phase === "bottom" || out.phase === "holding",
          phase: (out.phase as any) || "up",
        });

        // Use predefined-angle accuracy as score, map to severity
        const score = accuracy.overall || 0;
        const sev: FormFeedback["severity"] = score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "warning" : "critical";

        // Simple headline message
        const message = out.phase === "holding" ? `Hold steady${out.holdTimeMs ? ` • ${Math.floor((out.holdTimeMs || 0) / 1000)}s` : ""}` : `Phase: ${out.phase} • Reps: ${out.repCount}`;

        setFeedback({
          score,
          severity: sev,
          message,
          issues: (accuracy.overall > 0 ? accuracy.issues : []).slice(0, 3),
          suggestions: out.suggestions.slice(0, 3),
        });

        if (isActive && score > 0) {
          setAllFormScores((prev) => [...prev, score]);
        }
      } else {
        setFeedback({
          score: 0,
          severity: "warning",
          message: "No pose detected - step back and ensure full body is in frame",
          issues: ["Pose not detected"],
          suggestions: ["Ensure good lighting", "Move back to fit head-to-toe in view"],
        });
      }

      rafRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  };

  const stopDetectLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startWorkout = async () => {
    if (!cameraReady) {
      await startCamera();
    }

    setIsActive(true);
    setDuration(0);
    setAllFormScores([]);

    setFeedback({
      score: 0,
      message: "Analyzing your form...",
      severity: "good",
      issues: [],
      suggestions: [],
    });
    setRepInfo({ count: 0, isInPosition: false, phase: "up" });

    startDetectLoop();
    toast.success("Workout started! Watch your form feedback");
  };

  const stopWorkout = async () => {
    setIsActive(false);
    stopDetectLoop();

    // Calculate average form score
    const avgFormScore = allFormScores.length > 0 ? allFormScores.reduce((a, b) => a + b, 0) / allFormScores.length : 0;

    // Save session to database
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("workout_sessions").insert({
        user_id: session.user.id,
        exercise_name: exerciseNames[exerciseId || ""],
        duration_seconds: duration,
        reps_completed: repInfo.count,
        form_score: avgFormScore / 100,
      });

      toast.success(`Great workout! ${repInfo.count} reps with ${avgFormScore.toFixed(0)}% avg form`, {
        description: `Duration: ${duration}s`,
      });
    }
  };

  const openTutorial = () => {
    const link = youtubeLinks[exerciseId || ""];
    if (link) window.open(link, "_blank");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "warning":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "excellent":
        return "bg-green-500/10 border-green-500/20";
      case "good":
        return "bg-blue-500/10 border-blue-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "critical":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading AI model...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Failed to load pose model.</p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {exerciseNames[exerciseId || ""]}
          </h1>
          <Button onClick={openTutorial} variant="outline" size="sm" className="gap-2">
            <Youtube className="w-4 h-4" />
            Tutorial
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button onClick={startCamera} size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90">
                      <Camera className="w-5 h-5" />
                      Enable Camera
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                {!isActive ? (
                  <>
                    <Button onClick={startWorkout} disabled={!cameraReady} size="lg" className="gap-2 bg-gradient-to-r from-success to-accent text-success-foreground hover:opacity-90">
                      <PlayCircle className="w-5 h-5" />
                      Start Workout
                    </Button>
                    {cameraReady && (
                      <Button onClick={stopCamera} size="lg" variant="outline" className="gap-2">
                        <CameraOff className="w-5 h-5" />
                        Disable Camera
                      </Button>
                    )}
                  </>
                ) : (
                  <Button onClick={stopWorkout} size="lg" variant="destructive" className="gap-2">
                    <StopCircle className="w-5 h-5" />
                    Stop Workout
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Trainer Video Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Youtube className="w-4 h-4" /> Trainer Video
              </h3>
              <div className="relative">
                <div className="w-full">
                  <YouTubePlayer />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar: Form Accuracy + Feedback */}
          <div className="space-y-4">
            <AccuracyMeter metrics={accuracy} isActive={isActive && cameraReady} />

            <Card className={`p-6 border ${getSeverityBg(feedback.severity)}`}>
              <div className="flex items-center gap-2 mb-3">
                {feedback.severity === "excellent" && <CheckCircle className="w-5 h-5 text-green-500" />}
                {feedback.severity === "good" && <CheckCircle className="w-5 h-5 text-blue-500" />}
                {feedback.severity === "warning" && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                {feedback.severity === "critical" && <AlertCircle className="w-5 h-5 text-red-500" />}
                <h3 className="text-lg font-semibold">Form Feedback</h3>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={feedback.message} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                  <p className={`text-base font-medium ${getSeverityColor(feedback.severity)}`}>{feedback.message}</p>

                  {feedback.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Issues Detected:
                      </p>
                      {feedback.issues.map((issue, index) => (
                        <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-2 text-sm">
                          <span className="text-destructive mt-0.5">•</span>
                          <span className="text-muted-foreground">{issue}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {feedback.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        How to Fix:
                      </p>
                      {feedback.suggestions.map((suggestion, index) => (
                        <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">→</span>
                          <span className="text-foreground font-medium">{suggestion}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {!isActive && feedback.issues.length === 0 && (
                    <p className="text-sm text-muted-foreground">Start your workout to see real-time AI feedback on your form</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workout;
