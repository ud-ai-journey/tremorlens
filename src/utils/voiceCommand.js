/**
 * Turn a spoken command into a structured app action using GPT-4o.
 * Used by the "Hey Dadu" voice assistant.
 */

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const voiceConfigured = !!OPENAI_KEY && OPENAI_KEY.startsWith('sk-');

const SYSTEM = `You are the intent parser for "Dadu", a tremor-screening app for seniors.
Convert the user's spoken command into ONE JSON action. Return ONLY JSON, no prose.

Tabs: "screen" (spiral tremor test), "read" (read/scan/explain text & photos),
"exercises" (hand-stretch exercises), "history" (past results), "about".

Hand exercises are numbered: 1 Finger Extension, 2 Finger Spread,
3 Finger Interlace Stretch, 4 Fist Stretch, 5 Thumb Stretch, 6 Finger Tip Touch.

Action shapes (pick exactly one):
- {"action":"navigate","tab":"<tab>"}                     // "open exercises", "go to history"
- {"action":"screen"}                                      // "start my tremor test", "do the spiral test"
- {"action":"scan","mode":"extract"}                       // "scan my medicine label", "read this label", "open the camera"
- {"action":"scan","mode":"explain"}                       // "what is this", "explain this photo/medicine"
- {"action":"exercise","n":<1-6>}                          // "do the first exercise", "start finger spread"
- {"action":"speak","text":"<short helpful reply>"}        // a question you can answer briefly
- {"action":"unknown"}                                     // anything else

Rules:
- If the user names OR numbers a specific exercise ("first exercise", "exercise 3",
  "finger tip touch", "thumb stretch"), ALWAYS use {"action":"exercise","n":N} —
  even when they also say "open exercises". Prefer the specific exercise over navigate.
- Only use navigate to "exercises" when NO specific exercise is mentioned.
- If they ask to open the camera or scan a label without saying explain, use mode "extract".
- "what is this" / "explain this photo" / "explain this medicine" -> scan explain.
Examples:
"make me do the first exercise" -> {"action":"exercise","n":1}
"open exercises and start finger tip touch" -> {"action":"exercise","n":6}
"open my exercises" -> {"action":"navigate","tab":"exercises"}
"scan my medicine label" -> {"action":"scan","mode":"extract"}
Keep any "speak" text under 30 words.`;

// Offline keyword fallback so commands still work if GPT-4o is slow/unreachable
// or no key is configured. Covers the common demo commands.
const EX_NAMES = [
  ['finger extension', 1],
  ['finger spread', 2],
  ['interlace', 3],
  ['fist', 4],
  ['thumb', 5],
  ['finger tip', 6],
  ['fingertip', 6],
  ['tip touch', 6],
];
const ORDINALS = {
  first: 1, one: 1, '1': 1,
  second: 2, two: 2, '2': 2,
  third: 3, three: 3, '3': 3,
  fourth: 4, four: 4, '4': 4,
  fifth: 5, five: 5, '5': 5,
  sixth: 6, six: 6, '6': 6,
};

export function localParseCommand(text) {
  const t = (text || '').toLowerCase();

  // Specific exercise by name or number
  if (/exercise|stretch|finger|thumb|fist|interlace/.test(t)) {
    for (const [name, n] of EX_NAMES) if (t.includes(name)) return { action: 'exercise', n };
    for (const word in ORDINALS) {
      if (new RegExp(`\\b${word}\\b`).test(t) && /exercise|stretch/.test(t)) {
        return { action: 'exercise', n: ORDINALS[word] };
      }
    }
    if (t.includes('exercise')) return { action: 'navigate', tab: 'exercises' };
  }

  if (/explain|what is this|what's this|tell me about|what.?s in/.test(t)) {
    return { action: 'scan', mode: 'explain' };
  }
  if (/scan|camera|medicine|label|prescription|read (this|my|the)/.test(t)) {
    return { action: 'scan', mode: 'extract' };
  }
  if (/spiral|tremor|screen|test my|check my/.test(t)) return { action: 'screen' };
  if (/history|past|results|trend|record/.test(t)) return { action: 'navigate', tab: 'history' };
  if (/exercise/.test(t)) return { action: 'navigate', tab: 'exercises' };
  if (/read|text|reading/.test(t)) return { action: 'navigate', tab: 'read' };
  if (/about|help|what can you do/.test(t)) return { action: 'navigate', tab: 'about' };
  return { action: 'unknown' };
}

export async function parseCommand(text) {
  if (voiceConfigured) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 120,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: text },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        if (parsed && parsed.action && parsed.action !== 'unknown') return parsed;
      }
    } catch (err) {
      console.warn('GPT command parse failed, using keyword fallback:', err);
    }
  }
  // Fallback: keyword matching (also handles the no-key case).
  return localParseCommand(text);
}
