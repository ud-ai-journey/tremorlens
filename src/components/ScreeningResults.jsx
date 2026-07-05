import React, { useMemo, useState } from 'react';
import { scoreScreening, buildReport, doctorQuestions } from '../utils/tremorAnalysis';
import { saveScreening } from '../utils/screeningStore';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useVapi } from '../hooks/useVapi';

const BAND_STYLES = {
  low: { ring: 'text-green-500', chip: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
  monitor: { ring: 'text-amber-500', chip: 'bg-amber-100 text-amber-900 border-amber-300', bar: 'bg-amber-500' },
  consult: { ring: 'text-red-500', chip: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' },
};

function Spectrum({ spectrum, peakFreq, colorClass }) {
  if (!spectrum || !spectrum.length) return null;
  const max = Math.max(...spectrum.map((s) => s.power)) || 1;
  return (
    <div>
      <div className="flex items-end gap-[2px] h-24">
        {spectrum.map((s, i) => {
          const h = Math.max(2, (s.power / max) * 100);
          const isPeak = Math.abs(s.freq - peakFreq) < 0.13;
          return (
            <div
              key={i}
              title={`${s.freq} Hz`}
              className={`flex-1 rounded-t ${isPeak ? colorClass : 'bg-blue-200'}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-400 font-bold mt-1">
        <span>2 Hz</span>
        <span>8 Hz</span>
        <span>14 Hz</span>
      </div>
    </div>
  );
}

export function ScreeningResults({ spiral, postural, onRestart, onOpenAssist }) {
  const score = useMemo(() => scoreScreening({ spiral, postural }), [spiral, postural]);
  const report = useMemo(() => buildReport({ spiral, postural, score }), [spiral, postural, score]);
  const questions = useMemo(() => doctorQuestions(score), [score]);

  const tts = useTextToSpeech();
  const vapi = useVapi();
  const [saved, setSaved] = useState(false);

  const styles = BAND_STYLES[score.band];
  const chartSource = postural?.spectrum ? postural : spiral;

  const handleSave = () => {
    saveScreening({
      index: score.index,
      band: score.band,
      bandLabel: score.bandLabel,
      dominantFreq: score.dominantFreq,
      report,
      spiral: spiral
        ? { deviation: spiral.deviation, dominantFreq: spiral.dominantFreq, durationS: spiral.durationS }
        : null,
      postural: postural
        ? {
            amplitude: postural.amplitude,
            dominantFreq: postural.dominantFreq,
            durationS: postural.durationS,
            isDemo: !!postural.isDemo,
          }
        : null,
    });
    setSaved(true);
  };

  const emailBody = encodeURIComponent(
    `NeuroScreen tremor screening results\n\n${report}\n\nQuestions for the doctor:\n- ${questions.join('\n- ')}\n\n(Screening tool, not a diagnosis.)`
  );

  const voiceActive = vapi.status === 'active' || vapi.status === 'connecting';

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* Score header */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6 flex flex-col items-center gap-4">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              className={styles.ring}
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={(2 * Math.PI * 44 * (100 - score.index)) / 100}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black text-neutral-900">{score.index}</span>
            <span className="text-[10px] font-bold text-neutral-400">out of 100</span>
          </div>
        </div>
        <span className={`px-4 py-1.5 rounded-full border font-black text-sm text-center ${styles.chip}`}>
          {score.bandLabel}
        </span>
        {postural?.isDemo && (
          <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-full">
            Holding test used simulated demo data
          </span>
        )}
      </div>

      {/* Metrics + spectrum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex flex-col gap-1">
          <span className="text-xs font-bold text-neutral-400 uppercase">Dominant frequency</span>
          <span className="text-2xl font-black text-blue-900">
            {score.dominantFreq ? `${score.dominantFreq.toFixed(1)} Hz` : '—'}
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">
            Typical tremors fall between 4–12 Hz.
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
          <span className="text-xs font-bold text-neutral-400 uppercase">Tremor frequency spectrum</span>
          <div className="mt-2">
            <Spectrum
              spectrum={chartSource?.spectrum}
              peakFreq={chartSource?.dominantFreq}
              colorClass={styles.bar}
            />
          </div>
        </div>
      </div>

      {/* Plain-language report */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-blue-900">What this means</h3>
          <div className="flex gap-2">
            {tts.supported && (
              <button
                onClick={() => (tts.isPlaying ? tts.stop() : tts.speak(report))}
                className="min-h-[44px] px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg text-sm active:scale-95 transition touch-manipulation"
              >
                {tts.isPlaying ? '■ Stop' : '▶ Read aloud'}
              </button>
            )}
          </div>
        </div>
        <p className="text-base leading-relaxed text-neutral-800">{report}</p>
        <p className="text-xs text-neutral-400 font-medium italic">
          NeuroScreen is an awareness tool, not a medical diagnosis.
        </p>
      </div>

      {/* Personalized Reading Assist tuned to the score */}
      <button
        onClick={() => onOpenAssist && onOpenAssist({ score, report })}
        className="text-left bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-md p-5 text-white active:scale-[0.99] transition touch-manipulation"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Open your Reading Assist →</h3>
            <p className="text-sm text-indigo-100 mt-0.5">
              Reading help sized to your result — larger text, high contrast, and read-aloud.
            </p>
          </div>
          <span className="text-3xl">🔎</span>
        </div>
      </button>

      {/* Voice assistant (Vapi) */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-md p-5 text-white flex flex-col gap-3">
        <h3 className="text-lg font-black">Talk it through</h3>
        {vapi.supported ? (
          <>
            <p className="text-sm text-blue-100">
              Ask questions out loud and the NeuroScreen assistant will explain your results.
            </p>
            {!voiceActive ? (
              <button
                onClick={() => vapi.start({ report, score })}
                className="min-h-[52px] bg-white text-blue-700 font-black rounded-xl active:scale-95 transition touch-manipulation flex items-center justify-center gap-2"
              >
                🎙 Talk to your assistant
              </button>
            ) : (
              <button
                onClick={vapi.stop}
                className="min-h-[52px] bg-red-500 hover:bg-red-600 text-white font-black rounded-xl active:scale-95 transition touch-manipulation"
              >
                {vapi.status === 'connecting' ? 'Connecting…' : '■ End conversation'}
              </button>
            )}
            {vapi.status === 'error' && (
              <p className="text-xs text-blue-100">
                Voice assistant unavailable ({vapi.errorMsg}). Use “Read aloud” above instead.
              </p>
            )}
            {vapi.messages.length > 0 && (
              <div className="bg-blue-800/40 rounded-lg p-3 max-h-40 overflow-y-auto text-sm flex flex-col gap-1">
                {vapi.messages.slice(-6).map((m, i) => (
                  <p key={i}>
                    <span className="font-bold">{m.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                    {m.text}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-blue-100">
            Voice assistant not configured. Add a Vapi public key to enable a spoken
            conversation, or use “Read aloud” above. (See .env.example.)
          </p>
        )}
      </div>

      {/* Doctor questions */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-3">
        <h3 className="text-lg font-black text-blue-900">Questions to ask your doctor</h3>
        <ul className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <li key={i} className="flex gap-2 text-neutral-800">
              <span className="text-blue-600 font-black">•</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex-1 min-h-[52px] font-black rounded-xl active:scale-95 transition touch-manipulation ${
            saved
              ? 'bg-green-100 text-green-700 border-2 border-green-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
          }`}
        >
          {saved ? '✓ Saved to history' : 'Save to history'}
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent('My NeuroScreen tremor results')}&body=${emailBody}`}
          className="flex-1 min-h-[52px] flex items-center justify-center bg-white border-2 border-blue-200 text-blue-700 font-black rounded-xl active:scale-95 transition touch-manipulation"
        >
          Email to doctor / family
        </a>
        <button
          onClick={onRestart}
          className="flex-1 min-h-[52px] bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl active:scale-95 transition touch-manipulation"
        >
          New screening
        </button>
      </div>
    </div>
  );
}
