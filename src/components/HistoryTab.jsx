import React, { useEffect, useState } from 'react';
import { getScreenings, deleteScreening } from '../utils/screeningStore';

const BAND_CHIP = {
  low: 'bg-green-100 text-green-800 border-green-300',
  monitor: 'bg-amber-100 text-amber-900 border-amber-300',
  consult: 'bg-red-100 text-red-800 border-red-300',
};
const BAND_BAR = { low: 'bg-green-500', monitor: 'bg-amber-500', consult: 'bg-red-500' };

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function HistoryTab() {
  const [screenings, setScreenings] = useState([]);

  useEffect(() => {
    setScreenings(getScreenings());
  }, []);

  const remove = (id) => setScreenings(deleteScreening(id));

  if (!screenings.length) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-blue-100 shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">📈</div>
        <h2 className="text-xl font-black text-blue-900">No screenings yet</h2>
        <p className="text-neutral-500 font-medium mt-1">
          Run a tremor check and tap “Save to history”. Tracking results over time
          is the best way to notice changes early.
        </p>
      </div>
    );
  }

  // Oldest -> newest for the trend line.
  const trend = [...screenings].reverse();
  const maxIndex = 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Trend */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
        <h2 className="text-lg font-black text-blue-900 mb-3">Tremor index over time</h2>
        <div className="flex items-end gap-1.5 h-32">
          {trend.map((s) => (
            <div key={s.id} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t ${BAND_BAR[s.band] || 'bg-blue-400'}`}
                style={{ height: `${Math.max(3, (s.index / maxIndex) * 100)}%` }}
                title={`${s.index}/100`}
              />
              <span className="text-[9px] text-neutral-400 font-bold">{s.index}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 font-medium mt-2 text-center">
          Lower is steadier. A rising trend over weeks is worth discussing with a doctor.
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {screenings.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-neutral-900">{s.index}</span>
                <div className="flex flex-col">
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold w-fit ${BAND_CHIP[s.band]}`}>
                    {s.bandLabel}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium mt-0.5">
                    {formatDate(s.created_at)}
                    {s.dominantFreq ? ` · ${s.dominantFreq.toFixed(1)} Hz` : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(s.id)}
                className="text-neutral-400 hover:text-red-500 font-bold text-sm px-2 py-1 rounded touch-manipulation"
                aria-label="Delete screening"
              >
                Delete
              </button>
            </div>
            <p className="text-sm text-neutral-600">{s.report}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
