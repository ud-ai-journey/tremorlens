import { useState, useEffect, useRef } from 'react';

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setLoading(false);
        }
      };

      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = checkVoices;
      }
      
      checkVoices();

      // Safety timeout for loading state
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);

      return () => {
        clearTimeout(timer);
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    } else {
      setSupported(false);
      setLoading(false);
    }
  }, []);

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  const speak = (text) => {
    if (!supported || !text) return;

    // Reset speech state
    window.speechSynthesis.cancel();

    // Split text by whitespace while retaining white space to build character ranges
    const tokens = text.split(/(\s+)/);
    let cumulative = 0;
    const ranges = tokens.map((token) => {
      const start = cumulative;
      const end = cumulative + token.length;
      cumulative = end;
      return { start, end };
    });

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Attempt to set a high-quality local voice if possible
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentWordIndex(-1);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis utterance error:', e);
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Find which token index corresponds to this charIndex
        const tokenIdx = ranges.findIndex(
          (r) => charIndex >= r.start && charIndex < r.end
        );
        if (tokenIdx !== -1) {
          setCurrentWordIndex(tokenIdx);
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return {
    supported,
    loading,
    isPlaying,
    currentWordIndex,
    speak,
    stop,
  };
}
