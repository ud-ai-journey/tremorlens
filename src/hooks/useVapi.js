import { useState, useRef, useEffect, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

const isConfigured = !!PUBLIC_KEY && PUBLIC_KEY !== 'your-vapi-public-key-here';

function buildSystemPrompt(ctx) {
  return [
    'You are the NeuroScreen voice assistant, speaking with an older adult who just',
    'finished a simple at-home tremor screening. Be warm, calm, and slow. Use short,',
    'plain sentences. This is a wellness screening, NOT a medical diagnosis — never',
    'diagnose Parkinson\'s or any disease. Encourage them to see a doctor for anything',
    'concerning, and reassure them when results look mild.',
    '',
    'Here are their results to discuss and answer questions about:',
    ctx.report,
    '',
    `Screening index: ${ctx.score.index}/100 (${ctx.score.bandLabel}).`,
    ctx.score.dominantFreq ? `Dominant tremor frequency: ${ctx.score.dominantFreq.toFixed(1)} Hz.` : '',
    'Keep answers under 3 sentences unless asked for more.',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Thin wrapper around the Vapi web SDK. Exposes a simple start/stop plus live
 * status and transcript. If no public key is configured, `supported` is false
 * and callers should fall back to browser text-to-speech.
 */
export function useVapi() {
  const vapiRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | connecting | active | ended | error
  const [messages, setMessages] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isConfigured) return;
    let vapi;
    try {
      vapi = new Vapi(PUBLIC_KEY);
    } catch (err) {
      console.error('Vapi init failed:', err);
      return;
    }
    vapiRef.current = vapi;

    vapi.on('call-start', () => setStatus('active'));
    vapi.on('call-end', () => setStatus('ended'));
    vapi.on('error', (e) => {
      console.error('Vapi error:', e);
      setErrorMsg(typeof e === 'string' ? e : e?.message || 'Voice call failed.');
      setStatus('error');
    });
    vapi.on('message', (msg) => {
      if (msg?.type === 'transcript' && msg.transcriptType === 'final') {
        setMessages((prev) => [...prev, { role: msg.role, text: msg.transcript }]);
      }
    });

    return () => {
      try {
        vapi.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(async (ctx) => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    setMessages([]);
    setErrorMsg('');
    setStatus('connecting');

    const systemPrompt = buildSystemPrompt(ctx);
    const firstMessage =
      `Hello. I'm your NeuroScreen assistant. Your screening index came out at ` +
      `${ctx.score.index} out of 100, which we call "${ctx.score.bandLabel}". ` +
      `Would you like me to explain what that means?`;

    try {
      if (ASSISTANT_ID) {
        // Preferred: an assistant configured in the Vapi dashboard, seeded with
        // this session's results via overrides.
        await vapi.start(ASSISTANT_ID, {
          firstMessage,
          variableValues: {
            report: ctx.report,
            index: ctx.score.index,
            band: ctx.score.bandLabel,
          },
        });
      } else {
        // Inline "transient" assistant — works with only a public key when the
        // account allows transient assistants. Voice + transcriber are set
        // explicitly (Vapi requires them) using credit-covered defaults.
        await vapi.start({
          firstMessage,
          model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }],
          },
          voice: { provider: 'vapi', voiceId: 'Elliot' },
          transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en' },
        });
      }
    } catch (err) {
      console.error('Vapi start failed:', err);
      setErrorMsg(err?.message || 'Could not start the voice assistant.');
      setStatus('error');
    }
  }, []);

  const stop = useCallback(() => {
    try {
      vapiRef.current?.stop();
    } catch {
      /* ignore */
    }
    setStatus('ended');
  }, []);

  return { supported: isConfigured, status, messages, errorMsg, start, stop };
}
