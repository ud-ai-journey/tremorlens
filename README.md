# NeuroScreen 🌀🧠

**Early, at-home tremor screening for seniors.** NeuroScreen turns a phone into a
simple 2-minute check for hand tremor — the kind that can be an early sign of
essential tremor or Parkinson's — and explains the result in plain language you
can share with a doctor.

Built with **React 18, Vite, Tailwind CSS**, and **Vapi** (voice assistant).

> ⚠️ NeuroScreen is a wellness / awareness tool. It does **not** diagnose any
> medical condition. Concerning results should be reviewed by a doctor.

---

## What it does

1. **Spiral test** — the user traces an Archimedes spiral (a long-standing
   clinical tremor test) with a finger. We record timed touch points and measure
   how much the line wobbles off a smooth spiral.
2. **Holding test** — the phone's accelerometer records the fine movements of the
   hand while held still for 10 seconds.
3. **Frequency analysis** — a windowed DFT finds the dominant tremor frequency
   (most tremors sit at 4–12 Hz) and amplitude for each test.
4. **Plain-language report** — a 0–100 screening index, a risk band, an
   explanation, and "questions to ask your doctor."
5. **Voice** — a Vapi voice assistant reads the results and answers spoken
   questions (falls back to browser text-to-speech if not configured).
6. **History** — results are saved locally so trends can be tracked over time.

## How the tremor math works

- Irregular samples are resampled onto a uniform grid (`resampleUniform`).
- The signal is de-trended and Hann-windowed, then a direct DFT scans the 2–14 Hz
  band (`tremorSpectrum`) to find the peak frequency and band power.
- The spiral test fits `r = a + b·θ` (least squares) and analyzes the radial
  residual — where tremor shows up as a high-frequency wobble.
- Scores are combined into a conservative 0–100 index (`scoreScreening`).

See [`src/utils/tremorAnalysis.js`](src/utils/tremorAnalysis.js).

## File structure

```text
/src
  /components
    ScreeningFlow.jsx      # intro -> spiral -> holding -> results, with voice guidance
    SpiralTest.jsx         # Archimedes spiral tracing canvas
    PosturalTest.jsx       # 10s accelerometer capture (+ desktop demo fallback)
    ScreeningResults.jsx   # score, spectrum, report, doctor questions, voice, save
    HistoryTab.jsx         # saved screenings + trend
    Header.jsx             # nav + PWA install
  /hooks
    useVapi.js             # Vapi web SDK wrapper (graceful fallback)
    useTextToSpeech.js     # browser TTS (read-aloud + step guidance)
  /utils
    tremorAnalysis.js      # DFT, spiral/postural metrics, scoring, report text
    screeningStore.js      # localStorage persistence
  App.jsx                  # tabs: Screen / History / About
```

## Setup

```bash
npm install
npm run dev        # served with --host for phone testing on your network
npm run build
```

Environment variables are **optional** — see [`.env.example`](.env.example). The
app works fully offline without keys; add a Vapi public key to enable the spoken
assistant.

## Testing

- **Desktop:** the spiral test works with a mouse; the holding test has a
  "Run demo tremor" button (simulated data) since laptops have no accelerometer.
- **Phone (real sensors):** open the HTTPS URL, allow motion access when prompted,
  and run both tests. iOS requires the in-app permission tap.
