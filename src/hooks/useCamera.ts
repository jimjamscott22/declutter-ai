import { useCallback, useEffect, useRef, useState } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedVideo = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const releaseCamera = useCallback(() => {
    generation.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (attachedVideo.current) attachedVideo.current.srcObject = null;
    attachedVideo.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      releaseCamera();
    };
  }, [releaseCamera]);

  // The stream may resolve before React commits the conditional video element.
  useEffect(() => {
    if (videoRef.current) {
      attachedVideo.current = videoRef.current;
      videoRef.current.srcObject = streamRef.current;
    }
  });

  const stopCamera = useCallback(() => {
    releaseCamera();
    if (mounted.current) setIsCameraActive(false);
  }, [releaseCamera]);

  const startCamera = useCallback(async () => {
    if (!mounted.current) return;
    releaseCamera();
    const request = generation.current;
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (!mounted.current || request !== generation.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        attachedVideo.current = videoRef.current;
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (!mounted.current || request !== generation.current) return;
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please upload an image directly.');
      setIsCameraActive(false);
    }
  }, [releaseCamera]);

  return { videoRef, isCameraActive, cameraError, startCamera, stopCamera };
}
