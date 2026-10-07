import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CameraOff } from 'lucide-react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { drawSkeleton, drawJointAnglesOverlay, calculateJointAngles, ANGLE_TRIPLES, calculateKeyExerciseAngles, drawAngleLines } from '../utils/poseUtils';
import { computeSegmentAccuracy, EXERCISE_ANGLES } from '../analysis/exerciseAngles';
import type { Pose } from '../types/pose';

const EXERCISE_LIST = ['plank', 'squat', 'pushup', 'lunge', 'jumping-jack'] as const;

type ExerciseKey = typeof EXERCISE_LIST[number];

function ExerciseFormAccuracy() {
  const navigate = useNavigate();
  const params = useParams();
  const routeKey = (params as any).exercise as ExerciseKey | undefined;
  const [exercise, setExercise] = useState<ExerciseKey>(routeKey && EXERCISE_LIST.includes(routeKey) ? routeKey : 'plank');

  const { detectPose, isLoading, error } = usePoseDetection();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const lastPoseRef = useRef<Pose | null>(null);
  const lastDetectTs = useRef<number>(0);
  const warmFrames = useRef<number>(0);
  const smoothedAnglesRef = useRef<Record<string, number>>({});
  const activeFramesRef = useRef<number>(0);
  const activationFramesNeeded = 4;
  const [statusText, setStatusText] = useState<string>('');

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [fps, setFps] = useState(0);
  const [pose, setPose] = useState<Pose | null>(null);
  const [angles, setAngles] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<{ overall: number; upperBody: number; core: number; lowerBody: number; issues: string[] }>({
    overall: 0,
    upperBody: 0,
    core: 0,
    lowerBody: 0,
    issues: []
  });
  const [stability, setStability] = useState<number>(0);
  const [formTips, setFormTips] = useState<string[]>([]);
  const jointAnglesRef = useRef<Record<string, number>>({});
  const angleHistoryRef = useRef<Record<string, number[]>[]>([{}]);
  const lastAngleUpdate = useRef<number>(0);

  // Per-exercise gating rules: which joints must be clearly visible and minimum body height ratio in frame
  const EXERCISE_GATING: Record<ExerciseKey, { required: string[]; minConf: number; minBodyHeightRatio: number }> = {
    plank: { required: ['leftShoulder','rightShoulder','leftHip','rightHip','leftKnee','rightKnee'], minConf: 0.6, minBodyHeightRatio: 0.3 },
    squat: { required: ['leftKnee','rightKnee','leftHip','rightHip'], minConf: 0.65, minBodyHeightRatio: 0.45 },
    pushup: { required: ['leftElbow','rightElbow','leftHip','rightHip'], minConf: 0.6, minBodyHeightRatio: 0.3 },
    lunge: { required: ['leftKnee','rightKnee','leftHip','rightHip'], minConf: 0.65, minBodyHeightRatio: 0.45 },
    'jumping-jack': { required: ['leftShoulder','rightShoulder','leftKnee','rightKnee'], minConf: 0.6, minBodyHeightRatio: 0.4 }
  };

  // Validate whether current frame is suitable for scoring for the selected exercise
  const validateExerciseFrame = useCallback((p: Pose): { ok: boolean; issues: string[] } => {
    const cfg = EXERCISE_GATING[exercise];
    const issues: string[] = [];
    const confGate = Math.max(0.5, cfg.minConf - 0.05);

    // Collect required triples and check visibility per required joint
    let visibleRequired = 0;
    const yVals: number[] = [];
    const video = videoRef.current;
    const vh = video?.videoHeight || 1;

    for (const joint of cfg.required) {
      const triple = (ANGLE_TRIPLES as any)[joint] as [number, number, number] | undefined;
      if (!triple) continue;
      const [i1, ip, i3] = triple;
      const kp1 = p.keypoints[i1];
      const kp2 = p.keypoints[ip];
      const kp3 = p.keypoints[i3];
      const avg = ((kp1?.score || 0) + (kp2?.score || 0) + (kp3?.score || 0)) / 3;
      const ok = avg >= confGate;
      if (ok) {
        visibleRequired++;
        // push y for coverage using present keypoints of this triple
        const acc = [kp1, kp2, kp3].filter(Boolean) as any[];
        acc.forEach(k => yVals.push(k.y > 1 ? k.y : k.y * vh));
      } else {
        issues.push(`Low visibility: ${joint}`);
      }
    }

    // Require most required joints visible (allow at most 1 missing)
    const allowedMissing = Math.min(1, Math.floor(cfg.required.length / 3));
    if (visibleRequired < cfg.required.length - allowedMissing) {
      issues.push('Ensure all key joints are in frame');
    }

    // Body height coverage based only on required joints
    if (yVals.length >= 2) {
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);
      const bodyH = Math.max(0, maxY - minY);
      const ratio = bodyH / vh;
      if (ratio < cfg.minBodyHeightRatio) {
        issues.push('Move camera or step back to fit more of your body');
      }
    } else {
      issues.push('Move so required joints are visible');
    }

    return { ok: issues.length === 0, issues };
  }, [exercise]);

  const checkExerciseActivation = useCallback((a: Record<string, number>, p: Pose): { ok: boolean; issues: string[] } => {
    const E = exercise;
    const g = EXERCISE_ANGLES[E];
    const t = g?.tolerance ?? 15;
    const get = (k: string) => a[k];
    const near = (k: string, target: number, tol: number = t) => {
      const v = get(k);
      return isFinite(v as number) && Math.abs((v as number) - target) <= tol;
    };
    const angFromHoriz = (i: number, j: number) => {
      const video = videoRef.current;
      const w = video?.videoWidth || 1; const h = video?.videoHeight || 1;
      const a = p.keypoints[i]; const b = p.keypoints[j];
      if (!a || !b) return 90; // worst case
      const ax = a.x > 1 ? a.x : a.x * w; const ay = a.y > 1 ? a.y : a.y * h;
      const bx = b.x > 1 ? b.x : b.x * w; const by = b.y > 1 ? b.y : b.y * h;
      const deg = Math.abs(Math.atan2(by - ay, bx - ax) * 180 / Math.PI);
      return deg; // 0=horizontal, 90=vertical
    };
    let ok = false;
    const issues: string[] = [];
    switch (E) {
      case 'plank': {
        let m = 0;
        if (near('leftHip', 180, 25)) m++;
        if (near('rightHip', 180, 25)) m++;
        if (near('leftKnee', 170, 25)) m++;
        if (near('rightKnee', 170, 25)) m++;
        if (near('leftShoulder', 165, 30)) m++;
        if (near('rightShoulder', 165, 30)) m++;
        // torso roughly horizontal
        const leftTorso = angFromHoriz(5,11);
        const rightTorso = angFromHoriz(6,12);
        const torsoOk = Math.min(leftTorso, rightTorso) < 40;
        ok = m >= 4 && torsoOk;
        if (!torsoOk) issues.push('Keep torso horizontal (plank)');
        if (!ok) issues.push('Get into plank alignment');
        break;
      }
      case 'squat': {
        let m = 0;
        if (near('leftKnee', 90, 25)) m++;
        if (near('rightKnee', 90, 25)) m++;
        if (near('leftHip', 150, 30)) m++;
        if (near('rightHip', 150, 30)) m++;
        // thigh roughly vertical
        const leftThigh = angFromHoriz(11,13);
        const rightThigh = angFromHoriz(12,14);
        const thighOk = Math.max(leftThigh, rightThigh) > 35; // close to vertical
        ok = m >= 3 && thighOk;
        if (!thighOk) issues.push('Thighs not vertical enough (squat depth)');
        if (!ok) issues.push('Get into squat bottom position');
        break;
      }
      case 'pushup': {
        let m = 0;
        if (near('leftElbow', 90, 25)) m++;
        if (near('rightElbow', 90, 25)) m++;
        if (near('leftHip', 180, 30)) m++;
        if (near('rightHip', 180, 30)) m++;
        const leftTorso = angFromHoriz(5,11);
        const rightTorso = angFromHoriz(6,12);
        const torsoOk = Math.min(leftTorso, rightTorso) < 30;
        ok = m >= 3 && torsoOk;
        if (!torsoOk) issues.push('Keep torso horizontal (push-up)');
        if (!ok) issues.push('Get into push-up position');
        break;
      }
      case 'lunge': {
        const left = near('leftKnee', 90, 25) && near('rightKnee', 120, 35);
        const right = near('rightKnee', 90, 25) && near('leftKnee', 120, 35);
        const hipOk = near('leftHip', 150, 35) || near('rightHip', 150, 35);
        // one thigh vertical-ish
        const leftThigh = angFromHoriz(11,13);
        const rightThigh = angFromHoriz(12,14);
        const thighOk = leftThigh > 35 || rightThigh > 35;
        ok = (left || right) && hipOk && thighOk;
        if (!thighOk) issues.push('Front thigh should be more vertical');
        if (!ok) issues.push('Get into lunge position');
        break;
      }
      case 'jumping-jack': {
        let m = 0;
        if (near('leftShoulder', 180, 30)) m++;
        if (near('rightShoulder', 180, 30)) m++;
        if (near('leftKnee', 60, 35)) m++;
        if (near('rightKnee', 60, 35)) m++;
        ok = m >= 3;
        if (!ok) issues.push('Raise arms and step feet out');
        break;
      }
    }
    return { ok, issues };
  }, [exercise]);

  // Enhanced angle smoothing and validation
  const smoothAngles = useCallback((raw: Record<string, number>, alpha = 0.6, maxDelta = 15) => {
    const now = Date.now();
    const timeDiff = now - lastAngleUpdate.current;
    
    // Update less frequently for smoother transitions
    if (timeDiff < 50) {  // ~20fps update rate
      return smoothedAnglesRef.current;
    }
    lastAngleUpdate.current = now;

    const prev = smoothedAnglesRef.current;
    const next: Record<string, number> = {};
    
    // Track angle history for stability calculation
    const currentAngles: Record<string, number> = {};
    
    Object.entries(raw).forEach(([joint, val]) => {
      if (!isFinite(val) || val <= 0) return;
      
      // Apply temporal smoothing
      const p = prev[joint];
      let smoothed = val;
      
      if (isFinite(p as number) && (p as number) > 0) {
        const dx = val - (p as number);
        const clamped = Math.max(-maxDelta, Math.min(maxDelta, dx));
        smoothed = p as number + alpha * clamped;
      }
      
      // Store the smoothed value
      next[joint] = smoothed;
      currentAngles[joint] = smoothed;
    });
    
    // Update history (keep last 10 frames)
    angleHistoryRef.current = [currentAngles, ...angleHistoryRef.current].slice(0, 10);
    
    // Calculate stability (0-1)
    if (angleHistoryRef.current.length > 5) {
      const stability = calculateStability(angleHistoryRef.current);
      setStability(Math.round(stability * 100));
    }
    
    smoothedAnglesRef.current = next;
    return next;
  }, []);

  // Calculate stability based on angle variations
  const calculateStability = (history: Record<string, number>[]) => {
    if (history.length < 2) return 0;
    
    const jointStabilities: number[] = [];
    const joints = Object.keys(history[0]);
    
    for (const joint of joints) {
      const values = history.map(h => h[joint]).filter(v => v !== undefined);
      if (values.length < 2) continue;
      
      // Calculate standard deviation
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Normalize stability (lower std dev = more stable)
      const maxDeviation = 15; // degrees
      const stability = Math.max(0, 1 - (stdDev / maxDeviation));
      jointStabilities.push(stability);
    }
    
    return jointStabilities.length > 0 
      ? jointStabilities.reduce((a, b) => a + b, 0) / jointStabilities.length
      : 0;
  };

  // Draw only selected joints' angles with a minimum confidence
  const drawSelectedAnglesOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    p: Pose,
    width: number,
    height: number,
    color: string,
    joints: string[],
    minConf: number
  ) => {
    joints.forEach((name) => {
      const triple = (ANGLE_TRIPLES as any)[name] as [number, number, number] | undefined;
      if (!triple) return;
      const [i1, ip, i3] = triple;
      const a = p.keypoints[i1];
      const b = p.keypoints[ip];
      const c = p.keypoints[i3];
      const avg = ((a?.score || 0) + (b?.score || 0) + (c?.score || 0)) / 3;
      if (avg < minConf) return;
      drawAngleLines(ctx, a, b, c, name, color, width, height);
    });
  }, []);

  // Keep route in sync when dropdown changes
  useEffect(() => {
    navigate(`/workout/exercises/${exercise}`, { replace: true });
  }, [exercise, navigate]);

  // Setup/teardown webcam
  useEffect(() => {
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          (videoRef.current as any).srcObject = stream;
          videoRef.current.muted = true;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error('Webcam error:', e);
      }
    }
    async function stop() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        (videoRef.current as any).srcObject = null;
      }
    }
    if (isCameraOn) start(); else stop();
    return () => { stop(); };
  }, [isCameraOn]);

  // Drawing routine
  const draw = useCallback((p: Pose, showAngles: boolean) => {
    const canvas = canvasRef.current; const video = videoRef.current;
    if (!canvas || !video || !p) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 640; const h = canvas.clientHeight || 480;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    ctx.clearRect(0,0,w,h);

    // object-contain mapping
    const vw = video.videoWidth || w; const vh = video.videoHeight || h;
    const scale = Math.min(w / vw, h / vh);
    const cw = vw * scale; const ch = vh * scale;
    const ox = (w - cw) / 2; const oy = (h - ch) / 2;

    ctx.save();
    ctx.translate(ox, oy);
    drawSkeleton(ctx, p, '#19C37D', cw, ch);
    if (showAngles) {
      const gate = EXERCISE_GATING[exercise];
      drawSelectedAnglesOverlay(ctx, p, cw, ch, '#19C37D', gate.required, gate.minConf);
    }
    ctx.restore();
  }, [exercise, drawSelectedAnglesOverlay]);

  // rAF loop: detect → angles → metrics → draw
  useEffect(() => {
    if (!isCameraOn || !videoRef.current) return;
    let frameCounter = 0; let lastFpsTs = performance.now();

    const tick = async () => {
      const force = warmFrames.current < 10 || Date.now() - lastDetectTs.current > 120;
      const p = await detectPose(videoRef.current as HTMLVideoElement, { forceDetection: force });
      if (p) {
        lastPoseRef.current = p; lastDetectTs.current = Date.now(); warmFrames.current++;
        setPose(p);
        // Confidence-aware angles: only keep targets relevant to this exercise
        const gate = EXERCISE_GATING[exercise];
        const keyAngles = calculateKeyExerciseAngles(p);
        const exerciseTargets = EXERCISE_ANGLES[exercise].targets as Record<string, number>;
        const current: Record<string, number> = {};
        Object.keys(exerciseTargets).forEach((joint) => {
          const ja = (keyAngles as any)[joint];
          if (ja && ja.isValid && ja.confidence >= gate.minConf) current[joint] = ja.angle; else current[joint] = NaN;
        });
        const smoothed = smoothAngles(current);
        setAngles(smoothed as any);
        if (smoothed) {
          jointAnglesRef.current = smoothed as Record<string, number>;
        }

        // Check if we have all required keypoints for this exercise
        const hasRequiredJoints = useCallback((p: Pose) => {
          const issues: string[] = [];
          const tips: string[] = [];
          const req = EXERCISE_ANGLES[exercise]?.targets ? Object.keys(EXERCISE_ANGLES[exercise].targets) : [];
          if (req.length === 0) return { ok: true, issues: [], tips: [] };

          const keypoints = p.keypoints;
          const jointScores: Record<string, number> = {};
          
          // Check each required joint
          const has = (name: string): boolean => {
            const triple = (ANGLE_TRIPLES as any)[name] as [number, number, number] | undefined;
            if (!triple) return false;
            
            // Calculate confidence score for this joint (0-1)
            const scores = triple.map(i => keypoints[i]?.score || 0);
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            jointScores[name] = avgScore;
            
            // Check if all keypoints are visible with good confidence
            return scores.every(s => s > 0.3);
          };

          // Check for missing joints and provide feedback
          const missing = [];
          for (const joint of req) {
            if (!has(joint)) {
              missing.push(joint);
              
              // Provide specific feedback for missing joints
              const jointFeedback: Record<string, string> = {
                'leftElbow': 'Make sure your left elbow is visible',
                'rightElbow': 'Make sure your right elbow is visible',
                'leftShoulder': 'Step back so we can see your left shoulder',
                'rightShoulder': 'Step back so we can see your right shoulder',
                'leftHip': 'Make sure your left hip is in frame',
                'rightHip': 'Make sure your right hip is in frame',
                'leftKnee': 'Step back to show your left knee',
                'rightKnee': 'Step back to show your right knee'
              };
              
              const feedback = jointFeedback[joint] || `Adjust to show your ${joint}`;
              if (!tips.includes(feedback)) {
                tips.push(feedback);
              }
            }
          }

          // Update form tips
          if (tips.length > 0) {
            setFormTips(tips.slice(0, 3)); // Show max 3 tips at a time
          } else {
            setFormTips(['Great form! Keep it up!']);
          }

          if (missing.length > 0) {
            issues.push(`Adjust position to see: ${missing.join(', ')}`);
          }

          return { 
            ok: missing.length === 0, 
            issues,
            jointScores,
            tips
          };
          return { ok: missing.length === 0 && Object.keys(newJointAngles).length > 0, issues };
        }, [exercise]);

        const validation = validateExerciseFrame(p);
        if (!validation.ok) {
          setMetrics({ overall: 0, upperBody: 0, core: 0, lowerBody: 0, issues: validation.issues });
          draw(p, false);
          setStatusText('Not ready: visibility/coverage');
        } else {
          const currentAngles = jointAnglesRef.current;
          const active = checkExerciseActivation(currentAngles, p);
          if (active.ok) {
            activeFramesRef.current = Math.min(activationFramesNeeded, activeFramesRef.current + 1);
          } else {
            activeFramesRef.current = 0;
          }

          if (activeFramesRef.current >= activationFramesNeeded) {
            // Calculate accuracy using the latest joint angles
            const scores = Object.keys(currentAngles).length > 0 ? 
              computeSegmentAccuracy(currentAngles, exercise) : 
              { overall: 0, upperBody: 0, core: 0, lowerBody: 0, issues: active.issues };
            setMetrics(scores);
            draw(p, true);
            setStatusText('Active');
          } else {
            // Still calculate accuracy even if not fully activated, but show as not active yet
            const scores = Object.keys(currentAngles).length > 0 ? 
              computeSegmentAccuracy(currentAngles, exercise) : 
              { overall: 0, upperBody: 0, core: 0, lowerBody: 0, issues: active.issues };
            
            // Keep the scores but show the activation status
            setMetrics({
              ...scores,
              issues: active.issues.length > 0 ? active.issues : scores.issues
            });
            draw(p, false);
            setStatusText(active.issues[0] || `Activating… ${activeFramesRef.current}/${activationFramesNeeded}`);
          }
        }
      } else if (lastPoseRef.current) {
        // Keep drawing last known pose to avoid flicker
        draw(lastPoseRef.current, false);
      }

      // fps
      frameCounter++; const now = performance.now();
      if (now - lastFpsTs >= 1000) { setFps(frameCounter / ((now - lastFpsTs) / 1000)); frameCounter = 0; lastFpsTs = now; }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [detectPose, isCameraOn, exercise, draw]);

  const issueList = useMemo(() => metrics.issues.slice(0, 4), [metrics.issues]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Loading AI Model</h2>
          <p className="text-gray-400">Setting up pose detection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Exercise Form Accuracy</h1>
            <p className="text-gray-400 text-sm">Real-time angle matching against standard targets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Panel */}
          <div className="lg:col-span-2 relative h-[65vh] min-h-[60vh] rounded-2xl overflow-hidden border border-emerald-500/30 bg-black">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain bg-black" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <select
                value={exercise}
                onChange={(e) => setExercise(e.target.value as ExerciseKey)}
                className="bg-slate-900 text-white rounded-lg border border-slate-700 p-2"
              >
                {EXERCISE_LIST.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>

              {!isCameraOn ? (
                <button onClick={() => setIsCameraOn(true)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Start Camera
                </button>
              ) : (
                <button onClick={() => setIsCameraOn(false)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-2">
                  <CameraOff className="w-4 h-4" /> Stop Camera
                </button>
              )}

              <div className="px-3 py-2 bg-black/60 rounded-lg border border-slate-700 text-white text-sm">{fps.toFixed(1)} FPS</div>
          <div className="px-3 py-2 bg-black/60 rounded-lg border border-slate-700 text-white text-sm min-w-[140px] text-center">{statusText}</div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-4">
            <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
              <div className="text-white font-semibold mb-2">Form Accuracy (Angles)</div>
              <div className="text-3xl font-bold text-emerald-400">{metrics.overall}%</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-300">Upper Body</span><span className="text-white font-semibold">{metrics.upperBody}%</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-300">Core</span><span className="text-white font-semibold">{metrics.core}%</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-300">Lower Body</span><span className="text-white font-semibold">{metrics.lowerBody}%</span></div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
              <div className="text-white font-semibold mb-2">Targets</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
                {Object.entries(EXERCISE_ANGLES[exercise].targets).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-slate-100">{v}° ±{EXERCISE_ANGLES[exercise].tolerance}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-700/50 rounded-2xl p-4">
              <div className="text-white font-semibold mb-2">Live Issues</div>
              {issueList.length === 0 ? (
                <div className="text-slate-400 text-sm">No issues detected. Maintain your form!</div>
              ) : (
                <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
                  {issueList.map((s, i) => (<li key={i}>{s}</li>))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExerciseFormAccuracy;
