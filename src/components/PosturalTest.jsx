import React, { useRef, useState, useEffect, useCallback } from 'react';
import { analyzePostural } from '../utils/tremorAnalysis';

const DURATION_MS = 10000;

/**
 * Postural tremor test: hold the phone out for 10 seconds while we record
 * linear acceleration, then analyze the tremor band. On a device without a
 * usable accelerometer (e.g. a laptop) a clearly-labelled demo signal lets the
 * flow still be shown end-to-end.
 */
export function PosturalTest({ onComplete }) {
  const samplesRef = useRef([]);
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const gotRealDataRef = useRef(false);

  const [phase, setPhase] = useState('idle'); // idle | recording | done | error
  const [remaining, setRemaining] = useState(10);
  const [message, setMessage] = useState('');

  const stopListening = useCallback((handler) => {
    window.removeEventListener('devicemotion', handler);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const finish = useCallback(
    (samples) => {
      setPhase('done');
      const result = analyzePostural(samples);
      if (result) onComplete(result);
    },
    [onComplete]
  );

  const beginRecording = useCallback(() => {
    samplesRef.current = [];
    gotRealDataRef.current = false;
    startRef.current = performance.now();
    setPhase('recording');
    setRemaining(10);
    setMessage('Hold the phone out in front of you and keep as still as you can…');

    const handleMotion = (event) => {
      const acc = event.acceleration;
      let x;
      let y;
      let z;
      if (acc && acc.x !== null) {
        x = acc.x || 0;
        y = acc.y || 0;
        z = acc.z || 0;
      } else {
        const g = event.accelerationIncludingGravity;
        if (!g || g.x === null) return;
        const LP = 0.9;
        gravityRef.current.x = gravityRef.current.x * LP + (g.x || 0) * (1 - LP);
        gravityRef.current.y = gravityRef.current.y * LP + (g.y || 0) * (1 - LP);
        gravityRef.current.z = gravityRef.current.z * LP + (g.z || 0) * (1 - LP);
        x = (g.x || 0) - gravityRef.current.x;
        y = (g.y || 0) - gravityRef.current.y;
        z = (g.z || 0) - gravityRef.current.z;
      }
      gotRealDataRef.current = true;
      samplesRef.current.push({ t: event.timeStamp, x, y, z });
    };

    window.addEventListener('devicemotion', handleMotion);

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      setRemaining(Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000)));
      if (elapsed >= DURATION_MS) {
        stopListening(handleMotion);
        if (gotRealDataRef.current && samplesRef.current.length >= 30) {
          finish(samplesRef.current);
        } else {
          setPhase('error');
          setMessage(
            'No motion sensor readings were detected. On a computer there is no accelerometer — use the demo below, or open NeuroScreen on your phone.'
          );
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [finish, stopListening]);

  const start = useCallback(async () => {
    // iOS 13+ requires an explicit permission request from a user gesture.
    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') {
          setPhase('error');
          setMessage('Motion access was not granted. Please allow it and try again.');
          return;
        }
      }
    } catch (err) {
      console.error('Motion permission error:', err);
    }
    beginRecording();
  }, [beginRecording]);

  const runDemo = useCallback(() => {
    // Synthesize ~5.5 Hz tremor with noise, 10 s at 60 Hz — clearly a simulation.
    const samples = [];
    const fs = 60;
    const n = fs * 10;
    const f = 5.5;
    for (let i = 0; i < n; i++) {
      const t = (i / fs) * 1000;
      const base = Math.sin((2 * Math.PI * f * i) / fs) * 0.35;
      const noise = (i * 9301 + 49297) % 233280; // deterministic pseudo-noise
      const jitter = (noise / 233280 - 0.5) * 0.15;
      samples.push({ t, x: base + jitter, y: base * 0.6 + jitter * 0.8, z: jitter });
    }
    setPhase('done');
    setMessage('Demo tremor analyzed (simulated data).');
    const result = analyzePostural(samples);
    if (result) onComplete({ ...result, isDemo: true });
  }, [onComplete]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const pct = ((10 - remaining) / 10) * 100;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <h3 className="text-xl font-black text-blue-900">Holding Test</h3>
        <p className="text-sm text-neutral-600 font-medium mt-1 max-w-md">
          Hold your phone out in front of you and keep it as still as you can for
          10 seconds. We measure the tiny movements of your hand.
        </p>
      </div>

      {/* Countdown ring */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={phase === 'recording' ? '#2563eb' : '#94a3b8'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={(2 * Math.PI * 44 * (100 - pct)) / 100}
            style={{ transition: 'stroke-dashoffset 0.2s linear' }}
          />
        </svg>
        <span className="absolute text-4xl font-black text-blue-900">
          {phase === 'recording' ? remaining : phase === 'done' ? '✓' : '10'}
        </span>
      </div>

      {message && (
        <p className="text-center text-sm font-medium text-neutral-600 max-w-md min-h-[40px]">
          {message}
        </p>
      )}

      <div className="w-full max-w-xs flex flex-col gap-3">
        {phase === 'idle' && (
          <button
            onClick={start}
            className="min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl active:scale-95 transition shadow-md touch-manipulation"
          >
            Start Holding Test
          </button>
        )}
        {phase === 'recording' && (
          <span className="text-center text-blue-700 font-black animate-pulse">Recording…</span>
        )}
        {(phase === 'idle' || phase === 'error') && (
          <button
            onClick={runDemo}
            className="min-h-[48px] bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-900 font-bold rounded-xl active:scale-95 transition touch-manipulation"
          >
            No phone? Run demo tremor (simulated)
          </button>
        )}
        {phase === 'done' && (
          <span className="text-center text-green-700 font-black">Captured — nice work!</span>
        )}
      </div>
    </div>
  );
}
