import React from 'react';

export function TremorControls({
  isActive,
  toggleAssist,
  sensitivity,
  setSensitivity,
  demoMode,
  toggleDemoMode,
}) {
  const sensitivityOptions = [
    { id: 1.5, label: 'Gentle' },
    { id: 2.5, label: 'Medium' },
    { id: 4.0, label: 'Strong' },
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-blue-100 flex flex-col gap-5">
      <h2 className="text-lg font-bold text-blue-900 border-b border-blue-50 pb-2">
        Tremor Settings
      </h2>

      {/* Main Tremor Assist Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={toggleAssist}
          className={`w-full min-h-[64px] rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 touch-manipulation select-none active:scale-[0.98] border-2 shadow-lg relative overflow-hidden ${
            isActive
              ? 'bg-blue-600 border-blue-700 text-white animate-pulse-gentle'
              : 'bg-neutral-100 border-neutral-300 text-neutral-600'
          }`}
          aria-pressed={isActive}
        >
          {isActive && (
            <span className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
          )}
          <span
            className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-400' : 'bg-neutral-400'}`}
          />
          <span>Tremor Assist: {isActive ? 'ACTIVE' : 'OFF'}</span>
        </button>
        <p className="text-xs text-neutral-500 font-medium text-center">
          {isActive
            ? 'Words are counter-shifted to stay locked in space in front of your eyes, and enlarged for easy reading.'
            : 'Turn Tremor Assist ON. TremorLens measures your hand movement and slides the words the opposite way to hold them steady.'}
        </p>
      </div>

      {/* Sensitivity Picker */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-blue-900">Compensation Strength</span>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            {typeof sensitivity === 'number' ? `${sensitivity.toFixed(1)}x` : 'Auto'}
          </span>
        </div>
        <p className="text-[11px] text-neutral-400 font-medium -mt-1">
          How hard TremorLens pushes the words opposite to your hand's shake. Tune until the text feels steadiest.
        </p>
        
        {/* Preset Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {sensitivityOptions.map((opt) => {
            const isSelected = sensitivity === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSensitivity(opt.id)}
                className={`min-h-[48px] rounded-xl font-extrabold text-base border-2 transition duration-150 touch-manipulation select-none ${
                  isSelected
                    ? 'bg-blue-100 border-blue-600 text-blue-950'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
                aria-label={`Set compensation strength to ${opt.label}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Live Calibration Slider */}
        <div className="flex flex-col gap-1 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <label htmlFor="calibrator-slider" className="text-xs font-bold text-neutral-500">
            Manual Tuning (Calibrator Slider)
          </label>
          <input
            id="calibrator-slider"
            type="range"
            min="0.1"
            max="8.0"
            step="0.1"
            value={typeof sensitivity === 'number' ? sensitivity : 2.0}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer mt-2 accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 font-bold mt-1">
            <span>0.1x (Dampened)</span>
            <span>8.0x (Amplified)</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Trigger */}
      <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-bold text-blue-900 block">Demo Mode (Desktop)</span>
            <span className="text-xs text-neutral-500 block">
              Simulates a physical hand tremor on the screen
            </span>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`min-h-[48px] px-5 font-bold rounded-xl border-2 transition duration-150 touch-manipulation select-none ${
              demoMode
                ? 'bg-amber-100 border-amber-600 text-amber-950 animate-pulse'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
            aria-pressed={demoMode}
          >
            {demoMode ? 'SIMULATOR ON' : 'SIMULATOR OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
