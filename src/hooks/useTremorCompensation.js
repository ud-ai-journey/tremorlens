import { useState, useEffect, useRef } from 'react';
import { useDeviceMotion } from './useDeviceMotion';

export function useTremorCompensation(demoMode = false) {
  const { offset, permission, requestPermission } = useDeviceMotion(demoMode);

  // Initialize active state based on permission state
  const [isActive, setIsActive] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.15); // Default to highly dampened (0.15x)
  const [offsets, setOffsets] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (permission === 'granted') {
      setIsActive(true);
    }
  }, [permission]);

  // Keep latest raw offsets in a ref
  const rawOffsetRef = useRef({ beta: 0, gamma: 0 });
  rawOffsetRef.current = offset;

  const toggle = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        setIsActive(true);
      }
    } else {
      setIsActive(prev => !prev);
    }
  };

  const currentOffsetsRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId;

    const tick = () => {
      // Calculate dynamic tremor magnitude
      const currentBeta = rawOffsetRef.current.beta || 0;
      const currentGamma = rawOffsetRef.current.gamma || 0;
      const magnitude = Math.sqrt(currentBeta * currentBeta + currentGamma * currentGamma);

      // 1. Auto-Activation: If movement magnitude is above noise threshold, stabilize
      const isMoving = magnitude > 0.15;

      if (isActive && isMoving) {
        // 2. Auto-Sensitivity: Scale multiplier dynamically based on current tremor strength
        let multiplier = 2.0; // Default baseline
        
        if (typeof sensitivity === 'number') {
          multiplier = sensitivity;
        } else if (sensitivity === 'auto') {
          multiplier = Math.max(1.0, Math.min(4.5, magnitude * 0.7));
        } else if (sensitivity === 'low') {
          multiplier = 1.0;
        } else if (sensitivity === 'high') {
          multiplier = 4.0;
        }

        // Target offset values
        const targetX = currentGamma * multiplier;
        const targetY = currentBeta * multiplier;

        // Apply Linear Interpolation (Lerp) to smooth the jumps
        // 0.65 retains 65% of the old position, sliding slowly into the remaining 35%
        const smoothedX = currentOffsetsRef.current.x * 0.65 + targetX * 0.35;
        const smoothedY = currentOffsetsRef.current.y * 0.65 + targetY * 0.35;

        // Clamp to ±50px
        const clampedX = Math.max(-50, Math.min(50, smoothedX));
        const clampedY = Math.max(-50, Math.min(50, smoothedY));

        // Save current positions for next frame
        currentOffsetsRef.current = { x: clampedX, y: clampedY };
        setOffsets({ x: clampedX, y: clampedY });
      } else {
        // Slowly return back to center (0,0) when resting
        const returnX = currentOffsetsRef.current.x * 0.8;
        const returnY = currentOffsetsRef.current.y * 0.8;
        currentOffsetsRef.current = { x: returnX, y: returnY };
        setOffsets({ x: returnX, y: returnY });
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, sensitivity]);

  return {
    offsetX: offsets.x,
    offsetY: offsets.y,
    isActive,
    toggle,
    sensitivity,
    setSensitivity,
    permissionState: permission,
    requestPermission,
  };
}
