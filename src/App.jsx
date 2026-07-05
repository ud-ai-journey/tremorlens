import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TextInput } from './components/TextInput';
import { TremorControls } from './components/TremorControls';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { StabilizedViewport } from './components/StabilizedViewport';
import { useTremorCompensation } from './hooks/useTremorCompensation';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import ReportsTab from './components/ReportsTab';

const DEFAULT_TEXT = `Welcome to TremorLens. This application is designed specifically to help individuals with hand tremors read text on their screens comfortably.

By using your device's built-in orientation sensors, TremorLens moves the text in the opposite direction of your hand's shakes. This keeps the text stationary relative to your eyes.

Instructions:
1. Toggle the big "Tremor Assist" button to turn on stabilization.
2. If you are reading on a computer, turn on "Demo Mode" to simulate a hand tremor. Watch how the text remains perfectly still while the background shakes!
3. Tap "Read Aloud" or "Speak" below to hear the text. Spoken words will be highlighted in yellow.
4. Go to the "Exercises" tab to practice holding your device steady with our stability training game.`;

export default function App() {
  const [activeTab, setActiveTab] = useState('read');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [fontSize, setFontSize] = useState(32); // Default larger text
  const [contrastMode, setContrastMode] = useState('default');
  const [demoMode, setDemoMode] = useState(false);

  // Tremor compensation hook
  const {
    offsetX,
    offsetY,
    isActive: assistActive,
    toggle: toggleAssist,
    sensitivity,
    setSensitivity,
    permissionState,
    requestPermission,
  } = useTremorCompensation(demoMode);

  // Text to Speech hook
  const {
    supported: ttsSupported,
    loading: ttsLoading,
    isPlaying: ttsPlaying,
    currentWordIndex,
    speak,
    stop: ttsStop,
  } = useTextToSpeech();

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Intercept Web Share Target API query parameters
    const parsedUrl = new URL(window.location.href);
    const sharedText = parsedUrl.searchParams.get('text') || parsedUrl.searchParams.get('url');
    if (sharedText) {
      setText(decodeURIComponent(sharedText));
      // Automatically clean up url params to avoid repeated loads on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen for mobile Chrome PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Detect if app is launched in Standalone PWA mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    setIsStandalone(standalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleTTSPlay = () => {
    speak(text);
  };

  const toggleDemoMode = () => {
    setDemoMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-neutral-900 select-none">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        installPrompt={deferredPrompt}
        triggerInstall={triggerInstall}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">
        {/* Gyroscope Permission Activator (Crucial for Mobile browsers) */}
        {permissionState !== 'granted' && (
          <div className="bg-blue-50 border-2 border-blue-300 text-blue-950 p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse">
            <div>
              <h3 className="text-lg font-black text-blue-900">Enable Stabilization Sensors</h3>
              <p className="text-xs font-semibold text-neutral-500 mt-1">
                TremorLens requires sensor permission to read device coordinates and automatically stabilize shaking hand movements.
              </p>
            </div>
            <button
              onClick={requestPermission}
              className="w-full sm:w-auto min-h-[52px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow active:scale-95 transition touch-manipulation whitespace-nowrap"
            >
              Enable Sensors
            </button>
          </div>
        )}

        {/* iOS PWA Installation Tip */}
        {isIOS && !isStandalone && (
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 rounded-2xl shadow-sm text-sm font-semibold flex items-center gap-3">
            <svg className="w-8 h-8 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-extrabold text-base">Add to Home Screen</p>
              <p className="text-xs mt-0.5">
                Using Safari? Tap the <strong className="underline">Share</strong> button at the bottom and choose <strong>Add to Home Screen</strong> for the full standalone offline experience.
              </p>
            </div>
          </div>
        )}

        {/* Read Tab */}
        {activeTab === 'read' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Controls Column */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <TextInput value={text} onChange={setText} />
              
              <TremorControls
                isActive={assistActive}
                toggleAssist={toggleAssist}
                sensitivity={sensitivity}
                setSensitivity={setSensitivity}
                demoMode={demoMode}
                toggleDemoMode={toggleDemoMode}
              />

              <AccessibilityPanel
                contrastMode={contrastMode}
                setContrastMode={setContrastMode}
                fontSize={fontSize}
                setFontSize={setFontSize}
                ttsPlay={handleTTSPlay}
                ttsStop={ttsStop}
                ttsPlaying={ttsPlaying}
                ttsSupported={ttsSupported}
                ttsLoading={ttsLoading}
              />
            </div>

            {/* Right Display Column (Sticky on Desktop) */}
            <div className="md:col-span-7 md:sticky md:top-6">
              <StabilizedViewport
                text={text}
                fontSize={fontSize}
                contrastMode={contrastMode}
                assistActive={assistActive}
                offsetX={offsetX}
                offsetY={offsetY}
                demoMode={demoMode}
                ttsPlay={handleTTSPlay}
                ttsStop={ttsStop}
                ttsPlaying={ttsPlaying}
                ttsSupported={ttsSupported}
                ttsLoading={ttsLoading}
                currentWordIndex={currentWordIndex}
              />
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsTab />
        )}

        {/* Exercises Tab (Fully interactive Stability Training game) */}
        {activeTab === 'exercises' && (
          <StabilityExercise demoMode={demoMode} offsetX={offsetX} offsetY={offsetY} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 text-neutral-400 py-6 border-t border-neutral-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-bold">TremorLens Core v1.0.0</p>
          <p className="text-xs mt-1 text-neutral-500">
            Designed to improve digital readability and accessible text rendering.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* 
  Interactive Stability Training Mini-Game Component
  Objective: Hold the device steady to keep the dot centered inside the target ring.
*/
function StabilityExercise({ demoMode, offsetX, offsetY }) {
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15); // 15-second round
  const [message, setMessage] = useState('Hold your phone flat and tap Start');

  const timerRef = useRef(null);

  // Track orientation offsets to drive the dot position
  useEffect(() => {
    if (!isPlaying) return;

    let xVal, yVal;
    if (demoMode) {
      // Simulate random shaky hand movements
      xVal = (Math.random() - 0.5) * 45;
      yVal = (Math.random() - 0.5) * 45;
    } else {
      // Scale sensors to fit game container bounds
      xVal = offsetX * 2.5;
      yVal = offsetY * 2.5;
    }

    setDotPos({ x: xVal, y: yVal });

    // Check distance from center (0,0)
    const distance = Math.sqrt(xVal * xVal + yVal * yVal);
    if (distance < 30) {
      // Inside target ring -> Increase stability points!
      setScore((prev) => prev + 1);
    }
  }, [offsetX, offsetY, isPlaying, demoMode]);

  // Round loop timer
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  // Handle Round completion
  useEffect(() => {
    if (timeLeft === 0 && !isPlaying) {
      if (score > highScore) {
        setHighScore(score);
        setMessage(`New Record! Stability Score: ${score}. Try again!`);
      } else {
        setMessage(`Time's up! Stability Score: ${score}. Try again!`);
      }
    }
  }, [timeLeft, isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setIsPlaying(true);
    setMessage('Hold steady! Keep the white dot inside the yellow ring.');
  };

  const stopGame = () => {
    setIsPlaying(false);
    clearInterval(timerRef.current);
    setMessage('Game Stopped. Tap Start to play.');
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-blue-900">Stability Trainer</h2>
        <p className="text-neutral-500 text-sm font-medium mt-1">
          Practice holding your phone steady to increase motor control.
        </p>
      </div>

      <div className="flex gap-12 text-center">
        <div>
          <span className="text-xs text-neutral-400 font-bold uppercase block">Time Left</span>
          <span className="text-2xl font-black text-blue-900">{timeLeft}s</span>
        </div>
        <div>
          <span className="text-xs text-neutral-400 font-bold uppercase block">Current Score</span>
          <span className="text-2xl font-black text-blue-600">{score}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-400 font-bold uppercase block">Personal Best</span>
          <span className="text-2xl font-black text-amber-600">{highScore}</span>
        </div>
      </div>

      {/* Target Arena */}
      <div className="w-64 h-64 rounded-full bg-blue-900 relative flex items-center justify-center border-4 border-blue-950 overflow-hidden shadow-inner">
        {/* Target Ring (Yellow, Radius 30px -> Width 60px) */}
        <div className="w-[60px] h-[60px] rounded-full border-4 border-yellow-400 absolute opacity-70 animate-pulse" />

        {/* Outer Ring boundary */}
        <div className="w-[120px] h-[120px] rounded-full border border-blue-800 absolute opacity-40" />

        {/* Shaky Dot */}
        <div
          style={{
            transform: `translate(${dotPos.x}px, ${dotPos.y}px)`,
            transition: 'transform 0.08s ease-out',
          }}
          className={`w-6 h-6 rounded-full shadow-lg absolute border-2 border-blue-900 ${
            isPlaying ? 'bg-white' : 'bg-neutral-500'
          }`}
        />
      </div>

      <p className="text-center font-bold text-blue-950 px-4 min-h-[40px]">
        {message}
      </p>

      {/* Start / Stop Controls */}
      <div className="w-full flex gap-4 max-w-xs">
        {isPlaying ? (
          <button
            onClick={stopGame}
            className="flex-1 min-h-[48px] bg-red-100 border-2 border-red-300 hover:bg-red-200 text-red-800 font-black rounded-xl active:scale-95 transition touch-manipulation"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={startGame}
            className="flex-1 min-h-[48px] bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-xl active:scale-95 transition shadow-md touch-manipulation"
          >
            Start Training
          </button>
        )}
      </div>

      {demoMode && (
        <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-full">
          Desktop simulation active: dot shifts automatically.
        </span>
      )}
    </div>
  );
}
