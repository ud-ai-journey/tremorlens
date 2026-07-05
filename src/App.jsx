import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScreeningFlow } from './components/ScreeningFlow';
import { ExercisesTab } from './components/ExercisesTab';
import { HistoryTab } from './components/HistoryTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('screen');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    setIsStandalone(standalone);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-neutral-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        installPrompt={deferredPrompt}
        triggerInstall={triggerInstall}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        {/* iOS PWA install tip */}
        {isIOS && !isStandalone && (
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 rounded-2xl shadow-sm text-sm font-semibold flex items-center gap-3">
            <svg className="w-8 h-8 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-extrabold text-base">Add to Home Screen</p>
              <p className="text-xs mt-0.5">
                In Safari, tap <strong className="underline">Share</strong> then{' '}
                <strong>Add to Home Screen</strong> for the full app with motion sensors.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'screen' && <ScreeningFlow />}
        {activeTab === 'exercises' && <ExercisesTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'about' && <About />}
      </main>

      <footer className="bg-neutral-800 text-neutral-400 py-6 border-t border-neutral-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-bold">NeuroScreen v1.0.0</p>
          <p className="text-xs mt-1 text-neutral-500">
            A wellness screening tool — not a medical device or diagnosis.
          </p>
        </div>
      </footer>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="text-2xl font-black text-blue-900">About NeuroScreen</h2>
        <p className="text-neutral-700 leading-relaxed">
          Early signs of essential tremor and Parkinson's often go unnoticed for
          years. NeuroScreen turns your phone into a simple, at-home tremor check
          so changes can be spotted — and discussed with a doctor — sooner.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 flex flex-col gap-3">
        <h3 className="text-lg font-black text-blue-900">How it measures tremor</h3>
        <ul className="flex flex-col gap-2 text-neutral-700">
          <li><strong>Spiral test:</strong> tracing an Archimedes spiral — a long-standing clinical tool — reveals the tiny wobble tremor adds to an otherwise smooth line. We record your finger's path and compare it to a perfectly smooth spiral.</li>
          <li><strong>Frequency analysis:</strong> we find your dominant shaking rhythm from that wobble. Most tremors sit between 4–12 Hz (rest tremor ~4–6 Hz, action tremor ~4–12 Hz).</li>
          <li><strong>Plain-language result:</strong> a simple 0–100 index, an explanation, and questions to bring to your doctor.</li>
        </ul>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex flex-col gap-2">
        <h3 className="text-lg font-black text-amber-900">Important</h3>
        <p className="text-amber-900 text-sm leading-relaxed">
          NeuroScreen is a wellness and awareness tool. It does <strong>not</strong>{' '}
          diagnose any condition. A rising trend or a concerning result should be
          reviewed by a qualified doctor or neurologist. If you have sudden or
          severe symptoms, seek medical care right away.
        </p>
      </div>
    </div>
  );
}
