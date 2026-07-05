import React from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const OVERVIEW =
  'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233692/3d483270-443b-4421-84cc-dc498fd5d115_jajwfa.png';

// Exercise 1 (Finger Extension) has no dedicated card — it lives in the overview.
const FINGER_EXTENSION = {
  n: 1,
  title: 'Finger Extension',
  focus: 'Flexibility',
  steps:
    'Gently pull each finger back and hold for 5 seconds. Repeat 3 times on each hand.',
};

const EXERCISES = [
  {
    n: 2,
    title: 'Finger Spread',
    focus: 'Finger flexibility & mobility',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233962/be12c3db-5620-48e8-9258-6442f6267fc4_u3idp1.png',
    steps:
      'Hold your hand out with fingers together and straight. Slowly spread your fingers as wide as you can and hold for 5 seconds. Then slowly bring them back together. Repeat 3 times, both hands.',
  },
  {
    n: 3,
    title: 'Finger Interlace Stretch',
    focus: 'Flexibility & reduced stiffness',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233979/e0ba9a35-f305-426d-ad6d-de46689f93a0_tg5ckk.png',
    steps:
      'Interlace your fingers and hold them together. Slowly push your palms away from your body, keeping the fingers interlaced. Hold for 5 seconds, then relax. Repeat 3 times.',
  },
  {
    n: 4,
    title: 'Fist Stretch',
    focus: 'Hand flexibility & function',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233992/8e4dfae7-d44e-49bc-933e-4c513fcf0837_rmjzlk.png',
    steps:
      'Gently curl your fingers into your palm to make a fist and hold for 5 seconds. Then slowly open your fingers as wide as possible and hold for 5 seconds. Repeat 5 times, both hands.',
  },
  {
    n: 5,
    title: 'Thumb Stretch',
    focus: 'Thumb flexibility & mobility',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783234068/0ee8a8a0-b2ea-4ee4-9a19-3f19e4dc29fe_xbhe32.png',
    steps:
      'Gently pull your thumb across your palm with your other hand and hold for 5 seconds. Return to the starting position. Repeat 3 times each hand.',
  },
  {
    n: 6,
    title: 'Finger Tip Touch',
    focus: 'Coordination & fine motor control',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783234441/e3f13732-a9ae-4685-8fea-edad58bbd316_lvaivg.png',
    steps:
      'Touch your thumb to the tip of each finger, one by one — index, middle, ring, then little finger. Hold each for a moment. Repeat 3 times, both hands.',
  },
];

export function ExercisesTab() {
  const tts = useTextToSpeech();

  const speak = (title, steps) => {
    if (!tts.supported) return;
    if (tts.isPlaying) {
      tts.stop();
    } else {
      tts.speak(`${title}. ${steps}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Intro */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 text-center flex flex-col gap-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mx-auto">🖐️</div>
        <h2 className="text-2xl font-black text-blue-900">Daily Hand Exercises</h2>
        <p className="text-neutral-600 font-medium">
          Gentle stretches to keep your hands supple, ease stiffness, and support
          steady, comfortable movement — a good daily habit alongside your tremor check.
        </p>
      </div>

      {/* Overview poster */}
      <a href={OVERVIEW} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
        <img src={OVERVIEW} alt="Overview: six finger and hand stretches for seniors" loading="lazy" className="w-full h-auto" />
      </a>

      {/* Exercise 1 — text only (shown in the overview above) */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-black flex items-center justify-center flex-shrink-0">
              {FINGER_EXTENSION.n}
            </span>
            <div>
              <h3 className="text-lg font-black text-blue-900">{FINGER_EXTENSION.title}</h3>
              <p className="text-xs text-neutral-400 font-bold uppercase">{FINGER_EXTENSION.focus}</p>
            </div>
          </div>
          {tts.supported && (
            <button
              onClick={() => speak(FINGER_EXTENSION.title, FINGER_EXTENSION.steps)}
              className="min-h-[44px] px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg text-sm active:scale-95 transition touch-manipulation"
            >
              {tts.isPlaying ? '■ Stop' : '▶ Read aloud'}
            </button>
          )}
        </div>
        <p className="text-base leading-relaxed text-neutral-800">{FINGER_EXTENSION.steps}</p>
      </div>

      {/* Exercises 2–6 with detail images */}
      {EXERCISES.map((ex) => (
        <div key={ex.n} className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden flex flex-col">
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
          <a href={ex.img} target="_blank" rel="noreferrer" className="block">
            <img src={ex.img} alt={`${ex.title} — step-by-step`} loading="lazy" className="w-full h-auto" />
          </a>
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
