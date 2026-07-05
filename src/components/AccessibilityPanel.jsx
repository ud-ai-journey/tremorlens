import React from 'react';

export function AccessibilityPanel({
  contrastMode,
  setContrastMode,
  fontSize,
  setFontSize,
  ttsPlay,
  ttsStop,
  ttsPlaying,
  ttsSupported,
  ttsLoading,
}) {
  const contrastThemes = [
    { id: 'default', label: 'Default Calm', previewBg: 'bg-[#E8F4F8]', previewText: 'text-blue-900 border-neutral-300' },
    { id: 'yellow', label: 'Black on Yellow', previewBg: 'bg-[#FEF08A]', previewText: 'text-black border-yellow-600' },
    { id: 'black', label: 'White on Black', previewBg: 'bg-black', previewText: 'text-white border-black' },
    { id: 'blue', label: 'Dark Blue', previewBg: 'bg-[#1E3A8A]', previewText: 'text-blue-100 border-blue-950' },
  ];

  const handleDecreaseFont = () => {
    setFontSize(Math.max(24, fontSize - 4));
  };

  const handleIncreaseFont = () => {
    setFontSize(Math.min(72, fontSize + 4));
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-blue-100 flex flex-col gap-5">
      <h2 className="text-lg font-bold text-blue-900 border-b border-blue-50 pb-2">
        Accessibility Controls
      </h2>

      {/* Contrast Themes Selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-blue-900">Contrast Color Theme</span>
        <div className="grid grid-cols-2 gap-3">
          {contrastThemes.map((theme) => {
            const isSelected = contrastMode === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setContrastMode(theme.id)}
                className={`min-h-[56px] rounded-xl flex items-center justify-center p-2 font-bold border-2 transition duration-150 touch-manipulation select-none ${theme.previewBg} ${theme.previewText} ${
                  isSelected ? 'ring-4 ring-blue-500 border-blue-500 scale-[1.02]' : 'hover:opacity-90'
                }`}
                aria-label={`Select contrast theme ${theme.label}`}
              >
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size Selector (Slider + Buttons) */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-blue-900">Text Font Size</span>
          <span className="text-lg font-extrabold text-blue-950 bg-blue-50 px-2 py-0.5 rounded-md">
            {fontSize}px
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Decrease Button */}
          <button
            onClick={handleDecreaseFont}
            disabled={fontSize <= 24}
            className={`w-14 h-14 rounded-xl font-black text-2xl flex items-center justify-center border-2 transition duration-150 touch-manipulation select-none active:scale-95 ${
              fontSize <= 24
                ? 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            }`}
            aria-label="Decrease font size"
          >
            A-
          </button>

          {/* Slider input */}
          <div className="flex-1 px-2">
            <input
              type="range"
              min="24"
              max="72"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full h-4 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
              style={{ height: '12px' }}
              aria-label="Font size slider"
            />
          </div>

          {/* Increase Button */}
          <button
            onClick={handleIncreaseFont}
            disabled={fontSize >= 72}
            className={`w-14 h-14 rounded-xl font-black text-2xl flex items-center justify-center border-2 transition duration-150 touch-manipulation select-none active:scale-95 ${
              fontSize >= 72
                ? 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            }`}
            aria-label="Increase font size"
          >
            A+
          </button>
        </div>
      </div>

      {/* Screen Reader (TTS) Controls */}
      <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
        <span className="text-sm font-bold text-blue-900">Text-to-Speech Player</span>

        {!ttsSupported ? (
          <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
            Text-to-Speech is not supported in this browser.
          </div>
        ) : (
          <div className="flex gap-4">
            {ttsPlaying ? (
              <button
                onClick={ttsStop}
                className="flex-1 min-h-[48px] bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-lg rounded-xl flex items-center justify-center gap-2 transition duration-150 touch-manipulation select-none shadow"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
                <span>Stop Reading</span>
              </button>
            ) : (
              <button
                onClick={ttsPlay}
                disabled={ttsLoading}
                className={`flex-1 min-h-[48px] text-white font-extrabold text-lg rounded-xl flex items-center justify-center gap-2 transition duration-150 touch-manipulation select-none shadow ${
                  ttsLoading
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 active:scale-95'
                }`}
              >
                {ttsLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Initializing TTS...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                    <span>Read Aloud</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
