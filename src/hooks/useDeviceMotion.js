import { useState, useEffect, useRef } from 'react';

export function useDeviceMotion(demoMode = false) {
  const [reading, setReading] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [average, setAverage] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [offset, setOffset] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [permission, setPermission] = useState('default'); // 'default', 'granted', 'denied'
  const samplesRef = useRef([]);

  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        setPermission(res);
        return res === 'granted';
      } catch (err) {
        console.error('Error requesting device orientation permission:', err);
        setPermission('denied');
        return false;
      }
    } else {
      setPermission('granted');
      return true;
    }
  };

  useEffect(() => {
    // Check if DeviceOrientationEvent permission is already granted/supported
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission !== 'function'
    ) {
      setPermission('granted');
    }
  }, []);

  const lastCenterRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const handleNewReading = (newReading) => {
      setReading(newReading);

      if (!isInitializedRef.current) {
        lastCenterRef.current = { ...newReading };
        isInitializedRef.current = true;
        setAverage(newReading);
        return;
      }

      // Smooth Low-Pass Filter (Exponential Smoothing)
      // alpha = 0.98 means the baseline moves very slowly, preventing the return-to-center bounce
      const SMOOTHING = 0.98;
      const avg = {
        alpha: lastCenterRef.current.alpha * SMOOTHING + newReading.alpha * (1 - SMOOTHING),
        beta: lastCenterRef.current.beta * SMOOTHING + newReading.beta * (1 - SMOOTHING),
        gamma: lastCenterRef.current.gamma * SMOOTHING + newReading.gamma * (1 - SMOOTHING),
      };
      
      lastCenterRef.current = avg;
      setAverage(avg);

      // Inverted offset compensation (reverse coefficients to cancel out the shake)
      // When phone tilts right (+gamma), offset must translate left (-X).
      setOffset({
        alpha: newReading.alpha - avg.alpha,
        beta: -(newReading.beta - avg.beta),   // Inverted Y axis
        gamma: -(newReading.gamma - avg.gamma)  // Inverted X axis
      });
    };

    if (demoMode) {
      // Simulation mode (for desktop/testing)
      let time = 0;
      const intervalId = setInterval(() => {
        time += 0.1;
        // Generate random shaking centered around (180, 45, 0)
        const alphaTremor = 180 + Math.sin(time * 15) * 3 + (Math.random() - 0.5) * 2;
        const betaTremor = 45 + Math.cos(time * 17) * 3 + (Math.random() - 0.5) * 2;
        const gammaTremor = 0 + Math.sin(time * 12) * 3 + (Math.random() - 0.5) * 2;

        handleNewReading({
          alpha: alphaTremor,
          beta: betaTremor,
          gamma: gammaTremor,
        });
      }, 50); // 20Hz update speed for natural tremor frequency

      return () => clearInterval(intervalId);
    } else {
      // Real device sensor mode
      if (permission !== 'granted') return;

      const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event;
        // Check for null values (some desktop browsers send empty events)
        if (alpha === null || beta === null || gamma === null) return;
        handleNewReading({ alpha, beta, gamma });
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [demoMode, permission]);

  return {
    reading,
    average,
    offset,
    permission,
    requestPermission,
  };
}
