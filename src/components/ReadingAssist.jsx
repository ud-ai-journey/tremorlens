import React, { useState, useRef } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { readingProfileFromScore } from '../utils/tremorAnalysis';
import { ocrConfigured, fileToDataUrl, extractTextFromImage, describeImage } from '../utils/ocr';

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
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState(''); // 'extract' | 'explain' while running
  const [scanError, setScanError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const modeRef = useRef('extract');
  const tts = useTextToSpeech();

  const theme = THEMES[contrast] || THEMES.default;
  const tokens = text ? text.split(/(\s+)/) : [];

  const processImageFile = async (file, mode) => {
    if (!file || !ocrConfigured) return;
    setScanError('');
    setScanMode(mode);
    setScanning(true);
    tts.stop();
    try {
      const dataUrl = await fileToDataUrl(file);
      if (mode === 'explain') {
        const explanation = await describeImage(dataUrl);
        setText(explanation || 'Sorry, I could not describe that photo.');
        setEditing(false);
        setFontSize((f) => Math.max(f, 34));
      } else {
        const extracted = await extractTextFromImage(dataUrl);
        if (!extracted || extracted.toLowerCase() === 'no text found.') {
          setScanError('No readable text was found in that photo. Try again with better lighting.');
        } else {
          setText(extracted);
          setEditing(false);
          setFontSize((f) => Math.max(f, 40)); // labels read better large
        }
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      setScanError(err?.message || 'Could not process that photo.');
    } finally {
      setScanning(false);
      setScanMode('');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    processImageFile(file, modeRef.current);
  };

  const openPicker = (mode) => {
    if (!ocrConfigured) return;
    modeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file, 'explain'); // dropping a photo = "get to know more about it"
    }
  };

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
        {onBack && (
          <button
            onClick={onBack}
            className="min-h-[44px] px-4 bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl text-sm active:scale-95 transition touch-manipulation"
          >
            ← Back
          </button>
        )}
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

        {/* Scan text (OCR) or explain a photo — GPT-4o vision */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openPicker('extract')}
            disabled={scanning || !ocrConfigured}
            className={`min-h-[52px] font-black rounded-xl transition touch-manipulation ${
              !ocrConfigured
                ? 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200 cursor-not-allowed'
                : scanning
                  ? 'bg-indigo-300 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow'
            }`}
          >
            {scanning && scanMode === 'extract' ? 'Reading…' : '📷 Scan text'}
          </button>
          <button
            onClick={() => openPicker('explain')}
            disabled={scanning || !ocrConfigured}
            className={`min-h-[52px] font-black rounded-xl transition touch-manipulation ${
              !ocrConfigured
                ? 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200 cursor-not-allowed'
                : scanning
                  ? 'bg-purple-300 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95 shadow'
            }`}
          >
            {scanning && scanMode === 'explain' ? 'Looking…' : '🔍 Explain a photo'}
          </button>
        </div>
        {ocrConfigured ? (
          <p className="text-[11px] text-neutral-400 font-medium">
            Tip: you can also drag a photo onto the reading area below to learn about it.
          </p>
        ) : (
          <p className="text-[11px] text-neutral-400 font-medium">
            Photo features need an OpenAI key (VITE_OPENAI_API_KEY). See .env.example.
          </p>
        )}
        {scanError && (
          <p className="text-xs text-red-600 font-semibold">{scanError}</p>
        )}

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
      <div
        onDragOver={(e) => {
          if (!ocrConfigured) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 shadow-inner p-6 min-h-[300px] transition ${theme.bg} ${
          dragOver ? 'border-purple-500 ring-4 ring-purple-200' : 'border-blue-200'
        }`}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-purple-50/80 rounded-2xl pointer-events-none">
            <span className="text-purple-700 font-black text-lg">Drop the photo to learn about it</span>
          </div>
        )}
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
