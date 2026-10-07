import { useState, useCallback } from 'react';
import { Pose } from '../types/pose';

export const useYouTubePoseTracking = (
  detectPose: (media: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => Promise<Pose | null>
) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const captureTrainerPose = useCallback(async (): Promise<Pose | null> => {
    setIsCapturing(true);
    setCaptureError(null);

    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      // Wait for metadata and playing state
      await new Promise((resolve) => {
        if (video.readyState >= 2) return resolve(null);
        video.onloadedmetadata = () => resolve(null);
      });
      await new Promise((resolve) => {
        if (!video.paused) return resolve(null);
        video.onplaying = () => resolve(null);
      });

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Wait one animation frame to ensure pixels are available, then draw
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Detect pose from captured frame using the canvas directly
      const pose = await detectPose(canvas);

      if (!pose) {
        throw new Error('No pose detected in captured frame (try pausing the video at a clear full-body frame, then capture again)');
      }

      // Normalize the trainer pose to 0..1 so it matches WebcamFeed output
      const normalized: Pose = {
        ...pose,
        keypoints: pose.keypoints.map(kp => ({
          ...kp,
          x: (kp.x > 1 ? kp.x / canvas.width : kp.x),
          y: (kp.y > 1 ? kp.y / canvas.height : kp.y),
        }))
      };

      setIsCapturing(false);
      return normalized;
    } catch (error: any) {
      console.error('Error capturing trainer pose:', error);
      setCaptureError(error.message || 'Failed to capture pose');
      setIsCapturing(false);
      return null;
    }
  }, [detectPose]);

  return {
    captureTrainerPose,
    isCapturing,
    captureError
  };
};
