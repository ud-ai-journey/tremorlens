import React from 'react';

export function TextInput({ value, onChange }) {
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        onChange(clipboardText);
      }
    } catch (err) {
      console.warn('Failed to read clipboard:', err);
      alert(
        'Unable to access the clipboard automatically. Please press and hold the text box to paste manually.'
      );
    }
  };

  const handleClear = () => {
    if (value && window.confirm('Are you sure you want to clear the text?')) {
      onChange('');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-blue-100 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <label htmlFor="reading-input" className="text-lg font-bold text-blue-900">
          Source Text
        </label>
        <span className="text-xs text-blue-500 font-medium">
          {value.length} characters
        </span>
      </div>

      <textarea
        id="reading-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or paste the text you want to read here..."
        className="w-full min-h-[160px] p-4 text-xl border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-0 resize-y outline-none transition duration-150 text-blue-950 font-medium placeholder-blue-300"
        aria-label="Text to read"
      />

      <div className="flex gap-4">
        {/* Paste Button (Touch Target min-h-[48px]) */}
        <button
          onClick={handlePaste}
          className="flex-1 min-h-[48px] bg-blue-100 text-blue-800 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-200 active:scale-[0.98] transition duration-150 touch-manipulation border border-blue-200 text-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <span>One-Tap Paste</span>
        </button>

        {/* Clear Button (Touch Target min-h-[48px]) */}
        <button
          onClick={handleClear}
          disabled={!value}
          className={`flex-1 min-h-[48px] font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition duration-150 touch-manipulation text-lg ${
            value
              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
