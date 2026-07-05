import { useState, useEffect, useRef } from 'react';

/**
 * Reads the device's LINEAR acceleration (DeviceMotion) — the signal that
 * actually reflects the phone physically translating through space in a
 * trembling hand. Gravity is stripped out so only real movement remains.
 *
 * We expose the gravity-removed acceleration through a ref (accelRef) rather
 * than React state, because it updates ~60x/sec and is consumed by an
 * animation loop, not by rendering.
 */
export function useDeviceMotion(demoMode = false) {
  const [permission, setPermission] = useState('default'); // 'default' | 'granted' | 'denied'
  const [supported, setSupported] = useState(true);

  const accelRef = useRef({ x: 0, y: 0 }); // gravity-removed accel, device frame (m/s^2)
  const gravityRef = useRef({ x: 0, y: 0 }); // slow low-pass estimate of gravity (fallback path)

  const requestPermission = async () => {
    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        const res = await DeviceMotionEvent.requestPermission();
        setPermission(res);
        return res === 'granted';
      }
      // Non-gated platforms (Android/desktop): access is implicitly allowed.
      setPermission('granted');
      return true;
    } catch (err) {
      console.error('Error requesting device motion permission:', err);
      setPermission('denied');
      return false;
    }
  };

  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setSupported(false);
      return;
    }
    // Platforms without the gated permission API don't need a user gesture.
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      setPermission('granted');
    }
  }, []);

  useEffect(() => {
    if (demoMode) {
      accelRef.current = { x: 0, y: 0 };
      return;
    }
    if (permission !== 'granted') return;

    const GRAVITY_LP = 0.9; // low-pass factor for the gravity estimate (fallback)

    const handleMotion = (event) => {
      const acc = event.acceleration;
      let ax;
      let ay;

      if (acc && acc.x !== null && acc.y !== null) {
        // Preferred: hardware already removed gravity.
        ax = acc.x || 0;
        ay = acc.y || 0;
      } else {
        // Fallback: subtract a slow low-pass (gravity) from the raw signal.
        const g = event.accelerationIncludingGravity;
        if (!g || g.x === null || g.y === null) return;
        gravityRef.current.x = gravityRef.current.x * GRAVITY_LP + (g.x || 0) * (1 - GRAVITY_LP);
        gravityRef.current.y = gravityRef.current.y * GRAVITY_LP + (g.y || 0) * (1 - GRAVITY_LP);
        ax = (g.x || 0) - gravityRef.current.x;
        ay = (g.y || 0) - gravityRef.current.y;
      }

      accelRef.current = { x: ax, y: ay };
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [demoMode, permission]);

  return { accelRef, permission, requestPermission, supported };
}
