import React, { useEffect, useRef, useState } from 'react';
import { parseCommand, voiceConfigured } from '../utils/voiceCommand';

const SR =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Accept common mishearings of "Hey Dadu".
const WAKE = /\b(hey|hi|hello|ok|okay|a)\s+(dadu|dada|dhadu|thadu|daddy|dad|dodo|uday|udai|oday|today|udhay|u day|you day|hoday|uda)\b/;

/**
 * Global voice assistant. Listens for the wake phrase "Hey Dadu" (Chrome/Android;
 * unsupported on iOS Safari), or use the tap-to-talk mic. The spoken command is
 * parsed by GPT-4o into an action that onAction() executes; onAction returns a
 * short confirmation string that is spoken back.
 */
export function VoiceAssistant({ onAction }) {
  const supported = !!SR;
  const [open, setOpen] = useState(false);
  const [wake, setWake] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | wake | command | processing
  const [heard, setHeard] = useState('');
  const [feedback, setFeedback] = useState('');

  const recRef = useRef(null);
  const phaseRef = useRef('idle');
  const wakeRef = useRef(false);
  const restartRef = useRef(false);
  const busyRef = useRef(false);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const speak = (text, cb) => {
    if (!text || !('speechSynthesis' in window)) {
      if (cb) cb();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => cb && cb();
      u.onerror = () => cb && cb();
      window.speechSynthesis.speak(u);
    } catch {
      if (cb) cb();
    }
  };

  const startListening = () => {
    if (!recRef.current) return;
    restartRef.current = true;
    try {
      recRef.current.start();
    } catch {
      /* already started */
    }
  };
  const stopListening = () => {
    restartRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* not running */
    }
  };

  const finalize = async (text) => {
    if (busyRef.current) return;
    const cmd = (text || '').trim();
    if (!cmd) return;
    busyRef.current = true;
    setHeard(cmd);
    setPhaseBoth('processing');
    stopListening(); // don't let the mic hear our own spoken reply

    let confirmation = '';
    try {
      const action = await parseCommand(cmd); // GPT-4o with keyword fallback
      confirmation = (await onActionRef.current(action)) || 'Done.';
    } catch (err) {
      console.error('Voice command failed:', err);
      confirmation = "Sorry, I didn't catch that. Please try again.";
    }
    setFeedback(confirmation);
    speak(confirmation, () => {
      busyRef.current = false;
      if (wakeRef.current) {
        setPhaseBoth('wake');
        startListening();
      } else {
        setPhaseBoth('idle');
      }
    });
  };

  const silenceTimerRef = useRef(null);
  const transcriptAccumulatorRef = useRef('');

  const handleResult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }

    const combinedInterim = (transcriptAccumulatorRef.current + ' ' + final + ' ' + interim).trim();
    setHeard(combinedInterim || 'Listening…');

    // If we have final text, append it to our accumulator
    if (final) {
      transcriptAccumulatorRef.current = (transcriptAccumulatorRef.current + ' ' + final).trim();
    }

    if (phaseRef.current === 'wake') {
      const combinedLower = combinedInterim.toLowerCase();
      const m = combinedLower.match(WAKE);
      if (m) {
        // Found wake word! Extract command following wake word
        const wakeWordIdx = combinedLower.indexOf(m[0]);
        const rest = combinedInterim.slice(wakeWordIdx + m[0].length).trim();
        
        setPhaseBoth('command');
        transcriptAccumulatorRef.current = rest;
        setHeard(rest || 'Listening…');
        
        // Reset silence timer for the command phase
        resetSilenceTimer();
      }
    } else if (phaseRef.current === 'command') {
      // In command mode, reset silence timeout to wait for user to finish speaking
      resetSilenceTimer();
    }
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    silenceTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'command' && transcriptAccumulatorRef.current.trim()) {
        const fullSentence = transcriptAccumulatorRef.current.trim();
        transcriptAccumulatorRef.current = '';
        finalize(fullSentence);
      }
    }, 1500); // Wait for 1.5 seconds of silence before finishing the command
  };

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!SR) return undefined;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = handleResult;
    rec.onend = () => {
      if (restartRef.current) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      }
    };
    rec.onerror = () => {
      /* onend handles restart on recoverable errors */
    };
    recRef.current = rec;
    return () => {
      restartRef.current = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleWake = () => {
    if (wakeRef.current) {
      wakeRef.current = false;
      setWake(false);
      stopListening();
      setPhaseBoth('idle');
    } else {
      wakeRef.current = true;
      setWake(true);
      setFeedback('');
      setHeard('');
      setPhaseBoth('wake');
      startListening();
    }
  };

  const tapToTalk = () => {
    if (busyRef.current) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setFeedback('');
    transcriptAccumulatorRef.current = '';
    setHeard('Listening…');
    setPhaseBoth('command');
    startListening();
  };

  if (!supported) return null;

  const listening = phase === 'wake' || phase === 'command';
  const statusText =
    phase === 'processing'
      ? 'Thinking…'
      : phase === 'command'
        ? 'Listening for your command…'
        : phase === 'wake'
          ? 'Say “Hey Dadu”…'
          : 'Tap the mic or turn on “Hey Dadu”.';

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-72 bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-blue-900">Voice Assistant</h3>
            <button onClick={() => setOpen(false)} className="text-neutral-400 font-bold text-lg leading-none px-1">
              ×
            </button>
          </div>

          {!voiceConfigured && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium">
              Add an OpenAI key (VITE_OPENAI_API_KEY) to enable commands.
            </p>
          )}

          <div className="text-sm text-neutral-600 font-medium min-h-[40px]">
            <p className="font-bold text-blue-800">{statusText}</p>
            {heard && <p className="text-neutral-500 italic mt-0.5">“{heard}”</p>}
            {feedback && <p className="text-green-700 font-semibold mt-1">{feedback}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={tapToTalk}
              disabled={phase === 'processing'}
              className="flex-1 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl active:scale-95 transition touch-manipulation"
            >
              🎙 Tap to talk
            </button>
            <button
              onClick={toggleWake}
              className={`flex-1 min-h-[48px] font-black rounded-xl active:scale-95 transition touch-manipulation border-2 ${
                wake ? 'bg-green-100 border-green-400 text-green-800' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
              }`}
            >
              {wake ? '“Hey Dadu” ON' : '“Hey Dadu” OFF'}
            </button>
          </div>

          <p className="text-[10px] text-neutral-400 font-medium">
            Try: “open exercises and start the first one”, “scan my medicine label”,
            or “explain this photo”. Wake word works on Chrome/Android, not iPhone.
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Voice assistant"
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-95 transition ${
          listening ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-600 text-white'
        }`}
      >
        🎤
      </button>
    </div>
  );
}
