import React, { useState, useEffect } from 'react';
import { SpiralTest } from './SpiralTest';
import { ScreeningResults } from './ScreeningResults';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const STEPS = ['spiral', 'results'];

function StepDots({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-2.5 rounded-full transition-all ${
            i === idx ? 'w-8 bg-blue-600' : i < idx ? 'w-2.5 bg-green-500' : 'w-2.5 bg-neutral-300'
          }`}
        />
      ))}
    </div>
  );
}

export function ScreeningFlow() {
  const [phase, setPhase] = useState('intro'); // intro | spiral | results
  const [spiralResult, setSpiralResult] = useState(null);
  const tts = useTextToSpeech();

  // Gentle spoken guidance when the test appears (seniors-first).
  useEffect(() => {
    if (!tts.supported) return;
    if (phase === 'spiral') {
      tts.speak('Spiral test. Put your finger on the blue dot and slowly trace the spiral outward.');
    }
    return () => tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const restart = () => {
    setSpiralResult(null);
    setPhase('intro');
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-blue-100 shadow-md p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">🌀</div>
        <h2 className="text-2xl font-black text-blue-900">1-Minute Tremor Check</h2>
        <p className="text-neutral-600 font-medium">
          Trace a spiral with your finger and we'll measure the small shaking
          movements in your hand — giving you an easy-to-understand result you can
          share with your doctor.
        </p>
        <ol className="text-left flex flex-col gap-3 w-full max-w-sm">
          <li className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center flex-shrink-0">1</span>
            <span className="text-neutral-700 font-medium"><strong>Spiral test</strong> — slowly trace the spiral with your finger.</span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center flex-shrink-0">2</span>
            <span className="text-neutral-700 font-medium"><strong>Get your result</strong> — a clear score with a plain-language explanation.</span>
          </li>
        </ol>
        <button
          onClick={() => setPhase('spiral')}
          className="w-full max-w-sm min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl active:scale-95 transition shadow-md touch-manipulation"
        >
          Start the check
        </button>
        <p className="text-xs text-neutral-400 font-medium italic">
          A wellness screening — not a medical diagnosis.
        </p>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="flex flex-col gap-6">
        <StepDots current="results" />
        <ScreeningResults spiral={spiralResult} postural={null} onRestart={restart} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <StepDots current={phase} />
      <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6">
        <SpiralTest onComplete={setSpiralResult} />
      </div>

      {/* Advance control */}
      <div className="flex gap-3">
        <button
          onClick={() => setPhase('results')}
          disabled={!spiralResult}
          className={`flex-1 min-h-[52px] font-black rounded-xl transition touch-manipulation ${
            spiralResult
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow active:scale-95'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {spiralResult ? 'See my results →' : 'Finish the spiral to continue'}
        </button>
      </div>
    </div>
  );
}
