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

export async function parseCommand(text) {
  if (!voiceConfigured) throw new Error('Voice commands need an OpenAI key.');

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

  if (!res.ok) {
    throw new Error(`Command parse failed (${res.status}).`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    return { action: 'unknown' };
  }
}
