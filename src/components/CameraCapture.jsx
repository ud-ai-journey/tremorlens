import React, { useEffect, useRef, useState } from 'react';

/**
 * In-app camera with hands-free auto-capture. Opens a live camera, counts down
 * "hold steady 3-2-1", then snaps a frame and returns it as a data URL.
 * Requires HTTPS (or localhost) for getUserMedia.
 */
export function CameraCapture({ label = 'Scan', onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | ready | counting | error
  const [count, setCount] = useState(3);
  const [error, setError] = useState('');

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stop();
    onCapture(dataUrl);
  };

  // Start the camera on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus('ready');
      } catch (err) {
        console.error('Camera error:', err);
        setError('Could not open the camera. Please allow camera access, or use the upload buttons.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  // Auto-capture countdown once the camera is ready.
  useEffect(() => {
    if (status !== 'ready') return;
    setStatus('counting');
    setCount(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        capture();
      } else {
        setCount(n);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <h3 className="text-white font-black text-lg text-center">{label} — hold steady</h3>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {status === 'counting' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white text-7xl font-black drop-shadow-lg">{count}</span>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-white text-center font-semibold">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {status !== 'error' && (
            <button
              onClick={capture}
              className="flex-1 min-h-[52px] bg-white text-black font-black rounded-xl active:scale-95 transition touch-manipulation"
            >
              Capture now
            </button>
          )}
          <button
            onClick={() => {
              stop();
              onCancel();
            }}
            className="flex-1 min-h-[52px] bg-neutral-700 text-white font-bold rounded-xl active:scale-95 transition touch-manipulation"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
