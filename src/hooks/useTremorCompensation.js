import { useState, useEffect, useRef } from 'react';
import { useDeviceMotion } from './useDeviceMotion';

export function useTremorCompensation(demoMode = false) {
  const { offset, permission, requestPermission } = useDeviceMotion(demoMode);

  const [isActive, setIsActive] = useState(false);
  // How strongly the text reacts to phone movement WHEN ASSIST IS OFF.
  // (When assist is ON the text is pinned still regardless of this value.)
  const [sensitivity, setSensitivity] = useState(2.0);
  const [motion, setMotion] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (demoMode) {
      // Demo starts from the "shaking" state so the user can flip assist ON
      // and immediately watch the text lock into place.
      setIsActive(false);
    } else if (permission === 'granted') {
      // Real device: begin stabilizing as soon as sensor access is allowed.
      setIsActive(true);
    }
  }, [permission, demoMode]);

  // Keep latest raw sensor + sensitivity in refs for the animation loop.
  const rawRef = useRef({ beta: 0, gamma: 0 });
  rawRef.current = offset;
  const sensRef = useRef(sensitivity);
  sensRef.current = sensitivity;
  const smoothRef = useRef({ x: 0, y: 0 });

  const toggle = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        setIsActive(true);
      }
    } else {
      setIsActive((prev) => !prev);
    }
  };

  // Continuously translate raw gyroscope deltas into a smoothed "how far the
  // text should follow the hand" signal. This drives the OFF-state shake on a
  // real device. Demo mode generates its own simulated tremor in the viewport,
  // so this loop stays idle there.
  useEffect(() => {
    if (demoMode) {
      smoothRef.current = { x: 0, y: 0 };
      setMotion({ x: 0, y: 0 });
      return;
    }

    let rafId;
    const tick = () => {
      const gamma = rawRef.current.gamma || 0; // left/right tilt -> X
      const beta = rawRef.current.beta || 0; // front/back tilt -> Y
      const mult = typeof sensRef.current === 'number' ? sensRef.current : 2.0;

      const targetX = gamma * mult;
      const targetY = beta * mult;

      // Exponential smoothing so the text glides with the hand instead of snapping.
      smoothRef.current.x = smoothRef.current.x * 0.6 + targetX * 0.4;
      smoothRef.current.y = smoothRef.current.y * 0.6 + targetY * 0.4;

      const x = Math.max(-70, Math.min(70, smoothRef.current.x));
      const y = Math.max(-70, Math.min(70, smoothRef.current.y));

      // Skip no-op state updates so a resting phone doesn't re-render 60x/sec.
      setMotion((prev) =>
        Math.abs(prev.x - x) < 0.05 && Math.abs(prev.y - y) < 0.05 ? prev : { x, y }
      );

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [demoMode]);

  return {
    motionX: motion.x,
    motionY: motion.y,
    isActive,
    toggle,
    sensitivity,
    setSensitivity,
    permissionState: permission,
    requestPermission,
  };
}
