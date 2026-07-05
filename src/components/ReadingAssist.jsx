import React, { useState } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { readingProfileFromScore } from '../utils/tremorAnalysis';

/**
 * Personalized reading help, auto-tuned by the tremor screening score.
 * The reliable helpers (large font, high contrast, read-aloud) scale with the
 * result — the higher the tremor, the more help is turned on by default.
 */

const THEMES = {
  default: { name: 'Calm', bg: 'bg-[#E8F4F8]', text: 'text-blue-950', hl: 'bg-yellow-200 text-blue-900 rounded px-0.5' },
  yellow: { name: 'Yellow', bg: 'bg-[#FEF08A]', text: 'text-black', hl: 'bg-black text-[#FEF08A] rounded px-0.5' },
  black: { name: 'Dark', bg: 'bg-black', text: 'text-white', hl: 'bg-yellow-400 text-black rounded px-0.5' },
  blue: { name: 'Blue', bg: 'bg-[#1E3A8A]', text: 'text-blue-50', hl: 'bg-amber-400 text-blue-950 rounded px-0.5' },
};

const SAMPLE =
  'This is your personalized reading mode. The text size and contrast have been set to match your tremor result. Tap Read aloud to have it spoken to you, and use the buttons to make the words bigger or change the colors until they are comfortable to read.';

export function ReadingAssist({ score, report, onBack }) {
  const profile = readingProfileFromScore(score);
  const [fontSize, setFontSize] = useState(profile.fontSize);
  const [contrast, setContrast] = useState(profile.contrast);
  const [text, setText] = useState(report || SAMPLE);
  const [editing, setEditing] = useState(false);
  const tts = useTextToSpeech();

  const theme = THEMES[contrast] || THEMES.default;
  const tokens = text ? text.split(/(\s+)/) : [];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-blue-900">Reading Assist</h2>
          <p className="text-xs text-neutral-500 font-medium">
            Tuned to your result: <strong>{profile.level}</strong>
          </p>
        </div>
        <button
          onClick={onBack}
          className="min-h-[44px] px-4 bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl text-sm active:scale-95 transition touch-manipulation"
        >
          ← Back
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-blue-900">Text size</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize((f) => Math.max(18, f - 4))}
              className="w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-800 font-black text-xl rounded-xl active:scale-95 transition touch-manipulation"
              aria-label="Smaller text"
            >
              A−
            </button>
            <span className="w-14 text-center font-black text-blue-900">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(96, f + 4))}
              className="w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-800 font-black text-2xl rounded-xl active:scale-95 transition touch-manipulation"
              aria-label="Bigger text"
            >
              A+
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-bold text-blue-900">Colors</span>
          <div className="flex gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setContrast(key)}
                className={`min-h-[44px] px-3 rounded-xl font-bold text-sm border-2 transition touch-manipulation ${
                  contrast === key ? 'border-blue-600 ring-2 ring-blue-200' : 'border-neutral-200'
                } ${t.bg} ${t.text}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {tts.supported && (
            <button
              onClick={() => (tts.isPlaying ? tts.stop() : tts.speak(text))}
              className="flex-1 min-h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl active:scale-95 transition touch-manipulation"
            >
              {tts.isPlaying ? '■ Stop reading' : '▶ Read aloud'}
            </button>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            className="min-h-[52px] px-4 bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl active:scale-95 transition touch-manipulation"
          >
            {editing ? 'Done' : 'Change text'}
          </button>
        </div>

        {editing && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Paste anything you want to read here…"
            className="w-full p-3 rounded-xl border-2 border-blue-200 text-base focus:outline-none focus:border-blue-500"
          />
        )}
      </div>

      {/* Reading area */}
      <div className={`rounded-2xl border-2 border-blue-200 shadow-inner p-6 min-h-[300px] ${theme.bg}`}>
        <div className={`whitespace-pre-wrap break-words leading-relaxed ${theme.text}`} style={{ fontSize: `${fontSize}px` }}>
          {tokens.map((tok, i) => {
            if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
            return (
              <span key={i} className={i === tts.currentWordIndex ? theme.hl : undefined}>
                {tok}
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-neutral-400 font-medium italic text-center">
        Large text, high contrast, and read-aloud are the most dependable reading
        help for hand tremor.
      </p>
    </div>
  );
}
