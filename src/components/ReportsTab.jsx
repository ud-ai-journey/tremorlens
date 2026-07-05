import React, { useState } from 'react';
import { CameraCapture } from './CameraCapture';
import { ReportsList } from './ReportsList';
import { isLocalMode } from '../utils/supabase';

export default function ReportsTab() {
  const [view, setView] = useState('list'); // 'list' | 'capture'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportSaved = () => {
    // Increment trigger to force ReportsList to refetch data
    setRefreshTrigger((prev) => prev + 1);
    setView('list');
  };

  const handleCancelCapture = () => {
    setView('list');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Database Mode Status Banner */}
      {isLocalMode && (
        <div className="bg-yellow-50 border-2 border-yellow-300 text-yellow-950 p-4 rounded-2xl shadow-sm text-sm font-semibold flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-extrabold text-sm">Offline Sandbox Mode</p>
            <p className="text-xs mt-0.5">
              Supabase/OpenAI credentials are not configured. Scanned labels are simulated using local AI mocks, and reports are saved to your browser's local storage.
            </p>
          </div>
        </div>
      )}

      {/* View Switcher Controls */}
      {view === 'list' && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-2xl p-4 shadow-sm border border-blue-50 gap-4">
          <div>
            <h2 className="text-xl font-black text-blue-900">Label Reader & Logs</h2>
            <p className="text-xs text-neutral-500 font-medium">
              Keep track of medicines, dosing, and easily forward label analyses to doctors.
            </p>
          </div>
          <button
            onClick={() => setView('capture')}
            className="w-full sm:w-auto min-h-[52px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 active:scale-95 transition shadow touch-manipulation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <span>Scan Label</span>
          </button>
        </div>
      )}

      {/* Render selected view */}
      {view === 'capture' ? (
        <CameraCapture
          onReportSaved={handleReportSaved}
          onCancel={handleCancelCapture}
        />
      ) : (
        <ReportsList refreshTrigger={refreshTrigger} />
      )}
    </div>
  );
}
