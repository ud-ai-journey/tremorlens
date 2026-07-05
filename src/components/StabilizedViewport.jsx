import React, { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

export function StabilizedViewport({
  text,
  fontSize,
  contrastMode,
  assistActive,
  motionX,
  motionY,
  demoMode,
  sensitivity,
  ttsPlay,
  ttsStop,
  ttsPlaying,
  ttsSupported,
  ttsLoading,
  currentWordIndex,
}) {
  const innerRef = useRef(null); // wrapper we translate to show / cancel shake

  // Keep the latest live values so the animation loop reads fresh state
  // without tearing down and restarting on every prop change.
  const liveRef = useRef({ assistActive, motionX, motionY, demoMode, sensitivity });
  liveRef.current = { assistActive, motionX, motionY, demoMode, sensitivity };

  // One requestAnimationFrame loop drives the transform directly on the DOM
  // node — smooth 60fps motion without re-rendering the whole word list, and no
  // CSS transition (which would smear the shake).
  useEffect(() => {
    let rafId;
    let startTs;

    const loop = (ts) => {
      if (startTs === undefined) startTs = ts;
      const inner = innerRef.current;
      if (!inner) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const { assistActive, motionX, motionY, demoMode, sensitivity } = liveRef.current;

      if (assistActive) {
        // TremorLens ON: the words are pinned perfectly still.
        inner.style.transform = 'translate(0px, 0px)';
      } else if (demoMode) {
        // OFF + desktop demo: an organic simulated hand tremor moves the text so
        // you can see how hard it is to read while shaking. Amplitude follows
        // the Movement Sensitivity slider for instant, visible feedback.
        const s = (ts - startTs) / 1000;
        const amp = Math.max(2, Math.min(48, (typeof sensitivity === 'number' ? sensitivity : 2) * 7));
        const shakeX = Math.sin(s * TAU * 5.5) * amp + Math.sin(s * TAU * 9.1) * amp * 0.35;
        const shakeY = Math.cos(s * TAU * 4.9) * amp + Math.cos(s * TAU * 8.3) * amp * 0.3;
        inner.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
      } else {
        // OFF + real phone: the text follows the gyroscope, so tilting/shaking
        // the phone visibly moves the words.
        inner.style.transform = `translate(${motionX}px, ${motionY}px)`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Contrast Themes
  const themeStyles = {
    default: {
      bg: 'bg-[#E8F4F8]',
      text: 'text-blue-950',
      border: 'border-blue-200',
      wordHighlight: 'bg-yellow-200 text-blue-900 px-1 py-0.5 rounded font-black border border-yellow-300 shadow-sm',
      wordDefault: 'text-blue-950 transition-colors duration-150',
      floatingBg: 'bg-white/80 border-blue-200 text-blue-900',
      floatingBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    yellow: {
      bg: 'bg-[#FEF08A]',
      text: 'text-black',
      border: 'border-yellow-600',
      wordHighlight: 'bg-black text-[#FEF08A] px-1 py-0.5 rounded font-black',
      wordDefault: 'text-black',
      floatingBg: 'bg-black/90 border-yellow-600 text-[#FEF08A]',
      floatingBtn: 'bg-[#FEF08A] text-black border-2 border-black hover:bg-yellow-300',
    },
    black: {
      bg: 'bg-black',
      text: 'text-white',
      border: 'border-neutral-800',
      wordHighlight: 'bg-yellow-400 text-black px-1 py-0.5 rounded font-black',
      wordDefault: 'text-neutral-200',
      floatingBg: 'bg-neutral-900/90 border-neutral-800 text-white',
      floatingBtn: 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold',
    },
    blue: {
      bg: 'bg-[#1E3A8A]',
      text: 'text-blue-50',
      border: 'border-blue-900',
      wordHighlight: 'bg-amber-400 text-blue-950 px-1 py-0.5 rounded font-black',
      wordDefault: 'text-blue-200',
      floatingBg: 'bg-blue-950/90 border-blue-900 text-blue-100',
      floatingBtn: 'bg-amber-400 text-blue-950 hover:bg-amber-300 font-extrabold',
    },
  };

  const currentTheme = themeStyles[contrastMode] || themeStyles.default;

  // Split original text while keeping whitespace for correct layout rendering
  const tokens = text ? text.split(/(\s+)/) : [];

  // TremorLens ON enlarges the text ~20% for extra readability.
  const effectiveFontSize = assistActive ? Math.round(fontSize * 1.2) : fontSize;

  return (
    <div className="w-full flex flex-col gap-3 relative">
      <div className="flex flex-wrap justify-between items-center gap-2 px-1">
        <h3 className="text-lg font-bold text-blue-900">Stabilized Viewport</h3>
        {/* Explicit before/after status so the difference is unmistakable */}
        {assistActive ? (
          <span className="flex items-center gap-2 bg-green-100 text-green-800 font-black text-sm px-3 py-1.5 rounded-full border border-green-300">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            Steady &amp; enlarged — easy to read
          </span>
        ) : (
          <span className="flex items-center gap-2 bg-amber-100 text-amber-900 font-black text-sm px-3 py-1.5 rounded-full border border-amber-300 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Shaking — turn on TremorLens
          </span>
        )}
      </div>

      {/* Main Viewport Container (stays still — a stable frame of reference) */}
      <div
        className={`w-full h-[400px] md:h-[500px] overflow-y-auto rounded-2xl p-6 md:p-8 border-2 shadow-inner select-none ${currentTheme.bg} ${currentTheme.border}`}
      >
        {/* Text Wrapper — this is what shakes (OFF) or holds still (ON) */}
        <div ref={innerRef} className="w-full min-h-full leading-relaxed select-text will-change-transform">
          {!text ? (
            <p className="text-neutral-400 italic text-center text-xl mt-12">
              No text to read. Paste some text above to begin reading.
            </p>
          ) : (
            <div
              className="whitespace-pre-wrap break-words"
              style={{ fontSize: `${effectiveFontSize}px`, transition: 'font-size 0.25s ease' }}
            >
              {tokens.map((token, idx) => {
                const isWord = !/^\s+$/.test(token);
                const isSpeaking = idx === currentWordIndex;
                if (!isWord) {
                  return <span key={idx}>{token}</span>;
                }
                return (
                  <span
                    key={idx}
                    className={isSpeaking ? currentTheme.wordHighlight : currentTheme.wordDefault}
                  >
                    {token}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating/Fixed TTS control bar inside viewport - ALWAYS VISIBLE */}
      <div
        className={`absolute bottom-4 right-4 p-2 rounded-xl border flex items-center gap-2 shadow-lg backdrop-blur-md transition-all duration-200 z-10 ${currentTheme.floatingBg}`}
      >
        <span className="text-xs font-bold px-2 uppercase select-none hidden xs:inline">
          Reader
        </span>

        {!ttsSupported ? (
          <span className="text-xs text-red-500 font-bold px-2">TTS Offline</span>
        ) : ttsPlaying ? (
          <button
            onClick={ttsStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-lg flex items-center gap-1.5 shadow min-h-[48px] touch-manipulation active:scale-95"
            aria-label="Stop text-to-speech reading"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
            </svg>
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={ttsPlay}
            disabled={ttsLoading || !text}
            className={`px-4 py-2 font-black text-sm rounded-lg flex items-center gap-1.5 shadow min-h-[48px] touch-manipulation active:scale-95 ${
              ttsLoading || !text
                ? 'bg-neutral-400 text-neutral-200 cursor-not-allowed'
                : currentTheme.floatingBtn
            }`}
            aria-label="Start reading aloud"
          >
            {ttsLoading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
            <span>{ttsLoading ? 'Loading' : 'Speak'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
