/**
 * Photo/label OCR via OpenAI GPT-4o vision. Extracts readable text from a
 * captured or uploaded image so it can be shown large and read aloud.
 *
 * NOTE: the key is a VITE_ var embedded in the browser bundle. For production
 * this should be proxied through a serverless function so the key stays
 * server-side; for the hackathon it mirrors the original app's client-side call.
 */

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const ocrConfigured = !!OPENAI_KEY && OPENAI_KEY.startsWith('sk-');

/** Read a File into a base64 data URL. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

/** Send an image data URL to GPT-4o and return the extracted text. */
export async function extractTextFromImage(dataUrl) {
  if (!ocrConfigured) {
    throw new Error('OCR is not configured (missing OpenAI key).');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Extract all readable text from this image exactly as written, ' +
                'preserving line breaks and order. Return ONLY the text, with no ' +
                'commentary. If there is no legible text, reply exactly: No text found.',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message || '';
    } catch {
      /* ignore */
    }
    throw new Error(`Vision request failed (${res.status}). ${detail}`.trim());
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

/**
 * Explain an image in warm, plain language for an older adult — "get to know
 * more about it". Handles medicine labels, letters, documents, or any photo.
 */
export async function describeImage(dataUrl) {
  if (!ocrConfigured) {
    throw new Error('Photo help is not configured (missing OpenAI key).');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'You are helping an older adult understand a photo. In simple, ' +
                'warm, plain language with short sentences, explain what this ' +
                'image shows and anything important to know. If it is a medicine ' +
                'label, give the medicine name, what it is commonly used for, and ' +
                'the dosage instructions in plain words — and add a gentle reminder ' +
                'to follow their doctor. Keep it under 130 words. Do not give ' +
                'medical advice beyond what the label says.',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message || '';
    } catch {
      /* ignore */
    }
    throw new Error(`Photo help failed (${res.status}). ${detail}`.trim());
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}
