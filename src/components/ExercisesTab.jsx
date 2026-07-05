import React, { useEffect, useRef, useState } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { EXERCISES, OVERVIEW } from '../data/exercises';

export function ExercisesTab({ focusExercise }) {
  const tts = useTextToSpeech();
  const cardRefs = useRef({});
  const [highlight, setHighlight] = useState(null);
  const lastNonce = useRef(focusExercise?.nonce || 0);

  const speak = (title, steps) => {
    if (!tts.supported) return;
    if (tts.isPlaying) tts.stop();
    else tts.speak(`${title}. ${steps}`);
  };

  // Voice-triggered focus: scroll to and highlight an exercise.
  useEffect(() => {
    if (focusExercise && focusExercise.nonce && focusExercise.nonce !== lastNonce.current) {
      lastNonce.current = focusExercise.nonce;
      const n = focusExercise.n;
      const el = cardRefs.current[n];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlight(n);
        const t = setTimeout(() => setHighlight(null), 3500);
        return () => clearTimeout(t);
      }
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusExercise]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 text-center flex flex-col gap-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mx-auto">🖐️</div>
        <h2 className="text-2xl font-black text-blue-900">Daily Hand Exercises</h2>
        <p className="text-neutral-600 font-medium">
          Gentle stretches to keep your hands supple, ease stiffness, and support
          steady, comfortable movement — a good daily habit alongside your tremor check.
        </p>
      </div>

      <a href={OVERVIEW} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
        <img src={OVERVIEW} alt="Overview: six finger and hand stretches for seniors" loading="lazy" className="w-full h-auto" />
      </a>

      {EXERCISES.map((ex) => (
        <div
          key={ex.n}
          ref={(el) => (cardRefs.current[ex.n] = el)}
          className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col scroll-mt-24 transition ${
            highlight === ex.n ? 'border-blue-500 ring-4 ring-blue-200' : 'border-blue-100'
          }`}
        >
          <div className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-black flex items-center justify-center flex-shrink-0">
                {ex.n}
              </span>
              <div>
                <h3 className="text-lg font-black text-blue-900">{ex.title}</h3>
                <p className="text-xs text-neutral-400 font-bold uppercase">{ex.focus}</p>
              </div>
            </div>
            {tts.supported && (
              <button
                onClick={() => speak(ex.title, ex.steps)}
                className="min-h-[44px] px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg text-sm active:scale-95 transition touch-manipulation flex-shrink-0"
              >
                {tts.isPlaying ? '■ Stop' : '▶ Read aloud'}
              </button>
            )}
          </div>
          {ex.img && (
            <a href={ex.img} target="_blank" rel="noreferrer" className="block">
              <img src={ex.img} alt={`${ex.title} — step-by-step`} loading="lazy" className="w-full h-auto" />
            </a>
          )}
          <p className="p-5 text-base leading-relaxed text-neutral-800">{ex.steps}</p>
        </div>
      ))}

      <p className="text-xs text-neutral-400 font-medium italic text-center">
        Move slowly and gently, keep your wrist relaxed, and stop if anything hurts.
        These stretches are for general wellness, not medical treatment.
      </p>
    </div>
  );
}
