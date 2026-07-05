import { useState, useEffect, useRef } from 'react';
import { useDeviceMotion } from './useDeviceMotion';

/**
 * Retinal stabilization core.
 *
 * The eye-relative motion of the text is caused by the phone physically
 * TRANSLATING in space. We read linear acceleration, isolate the tremor-band
 * oscillation, integrate it twice into a displacement, and then shift the text
 * by the OPPOSITE of that displacement — so the letters stay locked in 3D space
 * in front of the reader even while the phone frame keeps shaking.
 *
 * Double-integration normally drifts to infinity. Two "leaky" integrators act
 * as high-pass filters: they bleed off the slow drift (and any intentional slow
 * movement like scrolling / bringing the phone closer) while preserving the
 * fast 4-12 Hz tremor we actually want to cancel.
 */
export function useTremorCompensation(demoMode = false) {
  const { accelRef, permission, requestPermission } = useDeviceMotion(demoMode);

  const [isActive, setIsActive] = useState(false);
  // Compensation strength — how hard we push the text opposite to the shake.
  const [sensitivity, setSensitivity] = useState(2.5);
  // Low-frequency mirror of the compensation, for the stability game / UI.
  const [motion, setMotion] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (demoMode) {
      setIsActive(false);
    } else if (permission === 'granted') {
      setIsActive(true);
    }
  }, [permission, demoMode]);

  const sensRef = useRef(sensitivity);
  sensRef.current = sensitivity;

  // Per-frame compensation (px) consumed directly by the viewport animation loop.
  const motionRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    if (demoMode) {
      motionRef.current = { x: 0, y: 0 };
      velRef.current = { x: 0, y: 0 };
      posRef.current = { x: 0, y: 0 };
      setMotion({ x: 0, y: 0 });
      return;
    }

    const LEAK_V = 0.92; // velocity drift bleed
    const LEAK_P = 0.86; // position drift bleed (this sets the tremor high-pass corner)
    const PX_PER_M = 6000; // rough CSS px per metre of physical travel (tuned by the slider)
    const MAX = 60; // clamp: we can only slide text within the reading area
    const dt = 1 / 60;

    let rafId;
    const tick = () => {
      const a = accelRef.current;

      // Integrate acceleration -> velocity -> position, bleeding off drift.
      velRef.current.x = velRef.current.x * LEAK_V + a.x * dt;
      velRef.current.y = velRef.current.y * LEAK_V + a.y * dt;

      posRef.current.x = posRef.current.x * LEAK_P + velRef.current.x * dt;
      posRef.current.y = posRef.current.y * LEAK_P + velRef.current.y * dt;

      const gain = (typeof sensRef.current === 'number' ? sensRef.current : 2.5) * PX_PER_M;

      // Compensation = OPPOSITE of the phone's displacement. Device +y is "up",
      // which is CSS -y, so the Y sign is flipped relative to X.
      const shiftX = Math.max(-MAX, Math.min(MAX, -posRef.current.x * gain));
      const shiftY = Math.max(-MAX, Math.min(MAX, posRef.current.y * gain));

      motionRef.current = { x: shiftX, y: shiftY };

      // Mirror to state only on meaningful change (idle phone => no re-renders).
      setMotion((prev) =>
        Math.abs(prev.x - shiftX) < 0.3 && Math.abs(prev.y - shiftY) < 0.3
          ? prev
          : { x: shiftX, y: shiftY }
      );

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [demoMode, accelRef]);

  return {
    motionRef,
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
