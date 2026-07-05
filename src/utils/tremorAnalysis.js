/**
 * NeuroScreen tremor analysis.
 *
 * Turns raw motion samples (touch points from the spiral test, or accelerometer
 * samples from the postural hold) into objective, quantifiable tremor metrics:
 * dominant frequency, amplitude, regularity, and a heuristic screening score.
 *
 * IMPORTANT: this is a wellness/awareness screening, NOT a medical diagnosis.
 * Frequencies are informative (Parkinsonian rest tremor ~4-6 Hz, essential /
 * action tremor ~4-12 Hz) but a real assessment requires a clinician.
 */

// ---------------------------------------------------------------------------
// Signal helpers
// ---------------------------------------------------------------------------

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function detrend(signal) {
  const m = mean(signal);
  return signal.map((v) => v - m);
}

// Hann window reduces spectral leakage before the DFT.
function applyHann(signal) {
  const N = signal.length;
  if (N < 2) return signal.slice();
  return signal.map((v, n) => v * 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1))));
}

function rms(signal) {
  if (!signal.length) return 0;
  return Math.sqrt(signal.reduce((s, v) => s + v * v, 0) / signal.length);
}

/**
 * Resample an irregularly-timed 1-D signal onto a uniform grid so we can run a
 * clean spectral analysis. `samples` = [{ t (ms), v }], returns { series, fs }.
 */
export function resampleUniform(samples, targetFs = 60) {
  if (samples.length < 2) return { series: [], fs: targetFs };
  const t0 = samples[0].t;
  const t1 = samples[samples.length - 1].t;
  const durationS = (t1 - t0) / 1000;
  if (durationS <= 0) return { series: [], fs: targetFs };

  const n = Math.max(2, Math.floor(durationS * targetFs));
  const series = new Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + (i / targetFs) * 1000;
    while (j < samples.length - 2 && samples[j + 1].t < t) j++;
    const a = samples[j];
    const b = samples[j + 1] || a;
    const span = b.t - a.t || 1;
    const frac = Math.max(0, Math.min(1, (t - a.t) / span));
    series[i] = a.v + (b.v - a.v) * frac;
  }
  return { series, fs: targetFs };
}

/**
 * Scan the tremor band with a direct DFT (cheap for our sample counts) and
 * return the dominant frequency plus the full band spectrum for charting.
 */
export function tremorSpectrum(series, fs, fMin = 2, fMax = 14, step = 0.25) {
  const clean = applyHann(detrend(series));
  const N = clean.length;
  const spectrum = [];
  let peak = { freq: 0, power: 0 };

  if (N < 4) return { peak, spectrum, bandPower: 0 };

  let bandPower = 0;
  for (let f = fMin; f <= fMax + 1e-9; f += step) {
    let re = 0;
    let im = 0;
    const w = (2 * Math.PI * f) / fs;
    for (let n = 0; n < N; n++) {
      re += clean[n] * Math.cos(w * n);
      im -= clean[n] * Math.sin(w * n);
    }
    const power = (re * re + im * im) / (N * N);
    spectrum.push({ freq: Math.round(f * 100) / 100, power });
    bandPower += power;
    if (power > peak.power) peak = { freq: Math.round(f * 100) / 100, power };
  }

  return { peak, spectrum, bandPower };
}

// ---------------------------------------------------------------------------
// Postural (accelerometer) test
// ---------------------------------------------------------------------------

/**
 * samples: [{ t (ms), x, y, z }] of linear acceleration (m/s^2).
 * Returns dominant tremor frequency, amplitude, and regularity.
 */
export function analyzePostural(samples) {
  if (!samples || samples.length < 20) return null;

  // Analyze each axis as a SIGNED signal. Do NOT take the vector magnitude —
  // rectifying a zero-mean oscillation (|sin|) doubles its apparent frequency.
  const fs = 60;
  const axes = ['x', 'y', 'z'].map((ax) => {
    const { series } = resampleUniform(
      samples.map((s) => ({ t: s.t, v: s[ax] || 0 })),
      fs
    );
    return series;
  });
  if (axes[0].length < 16) return null;

  // Per-axis RMS (in-band energy) combined into an overall amplitude.
  const amplitude = Math.sqrt(axes.reduce((s, series) => s + rms(detrend(series)) ** 2, 0));

  // Sum the per-axis power spectra so the peak reflects true tremor frequency.
  const perAxis = axes.map((series) => tremorSpectrum(series, fs));
  const template = perAxis[0].spectrum;
  const spectrum = template.map((bin, i) => ({
    freq: bin.freq,
    power: perAxis.reduce((s, pa) => s + (pa.spectrum[i]?.power || 0), 0),
  }));

  let peak = { freq: 0, power: 0 };
  let bandPower = 0;
  for (const bin of spectrum) {
    bandPower += bin.power;
    if (bin.power > peak.power) peak = { freq: bin.freq, power: bin.power };
  }

  // Regularity: how concentrated the energy is around the peak (0..1).
  const totalPower = bandPower || 1;
  const nearPeak = spectrum
    .filter((p) => Math.abs(p.freq - peak.freq) <= 1.0)
    .reduce((s, p) => s + p.power, 0);
  const regularity = Math.max(0, Math.min(1, nearPeak / totalPower));

  return {
    type: 'postural',
    durationS: (samples[samples.length - 1].t - samples[0].t) / 1000,
    dominantFreq: peak.freq,
    amplitude,
    regularity,
    bandPower,
    spectrum,
    sampleCount: samples.length,
  };
}

// ---------------------------------------------------------------------------
// Spiral drawing test
// ---------------------------------------------------------------------------

/**
 * points: [{ t (ms), x, y }] in canvas pixels.
 * Fits an Archimedes spiral (r = a + b*theta) and measures the deviation, which
 * is where tremor shows up as a high-frequency wobble on an otherwise smooth line.
 */
export function analyzeSpiral(points, center) {
  if (!points || points.length < 30) return null;

  const cx = center?.x ?? mean(points.map((p) => p.x));
  const cy = center?.y ?? mean(points.map((p) => p.y));

  // Convert to polar with an unwrapped angle so theta grows monotonically.
  let prevAngle = null;
  let wraps = 0;
  const polar = points.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const r = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx);
    if (prevAngle !== null) {
      let d = a - prevAngle;
      if (d > Math.PI) wraps -= 1;
      else if (d < -Math.PI) wraps += 1;
    }
    prevAngle = a;
    const theta = a + wraps * 2 * Math.PI;
    return { t: p.t, r, theta };
  });

  // Least-squares fit r = a + b*theta.
  const th = polar.map((p) => p.theta);
  const rr = polar.map((p) => p.r);
  const n = polar.length;
  const mt = mean(th);
  const mr = mean(rr);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (th[i] - mt) * (rr[i] - mr);
    den += (th[i] - mt) * (th[i] - mt);
  }
  const b = den === 0 ? 0 : num / den;
  const a = mr - b * mt;

  // Radial residual = actual radius minus the ideal smooth spiral.
  const residualSamples = polar.map((p) => ({ t: p.t, v: p.r - (a + b * p.theta) }));
  const residualVals = residualSamples.map((s) => s.v);
  const meanR = mean(rr) || 1;

  // Normalize deviation by spiral size so it's scale-independent across screens.
  const deviation = rms(detrend(residualVals)) / meanR; // ~0 (smooth) .. higher (shaky)

  // Frequency content of the wobble over time.
  const { series, fs } = resampleUniform(residualSamples, 60);
  const { peak, spectrum } = tremorSpectrum(series, fs);

  const durationS = (points[points.length - 1].t - points[0].t) / 1000;

  return {
    type: 'spiral',
    durationS,
    deviation, // normalized tremor amplitude
    dominantFreq: peak.freq,
    spectrum,
    turns: Math.abs(th[n - 1] - th[0]) / (2 * Math.PI),
    pointCount: n,
  };
}

// ---------------------------------------------------------------------------
// Combined scoring + plain-language report
// ---------------------------------------------------------------------------

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Combine the two tests into a 0-100 screening index and a risk band.
 * Heuristic and intentionally conservative — this is awareness, not diagnosis.
 */
export function scoreScreening({ spiral, postural }) {
  let score = 0;
  let parts = 0;

  if (spiral) {
    // Normalized deviation ~0.02 (steady) to ~0.15+ (very shaky).
    const s = clamp01((spiral.deviation - 0.02) / 0.13);
    score += s;
    parts += 1;
  }
  if (postural) {
    // RMS acceleration ~0.05 (steady) to ~0.8 m/s^2 (pronounced).
    const p = clamp01((postural.amplitude - 0.05) / 0.75);
    score += p;
    parts += 1;
  }

  const index = parts ? Math.round((score / parts) * 100) : 0;

  let band;
  let bandLabel;
  if (index < 30) {
    band = 'low';
    bandLabel = 'Low signs of tremor';
  } else if (index < 60) {
    band = 'monitor';
    bandLabel = 'Some tremor detected — worth monitoring';
  } else {
    band = 'consult';
    bandLabel = 'Noticeable tremor — consider consulting a doctor';
  }

  // The most reliable frequency estimate available.
  const freq = postural?.dominantFreq || spiral?.dominantFreq || 0;

  return { index, band, bandLabel, dominantFreq: freq };
}

export function buildReport({ spiral, postural, score }) {
  const lines = [];
  lines.push(`Tremor screening index: ${score.index} out of 100. ${score.bandLabel}.`);

  if (score.dominantFreq) {
    lines.push(
      `Your most steady rhythm of shaking was around ${score.dominantFreq.toFixed(1)} hertz` +
        ` (times per second). For reference, common tremors sit between 4 and 12 hertz.`
    );
  }

  if (postural) {
    lines.push(
      `In the holding test, your hand's movement was ${describeAmplitude(
        postural.amplitude,
        0.05,
        0.75
      )} over ${postural.durationS.toFixed(0)} seconds.`
    );
  }
  if (spiral) {
    lines.push(
      `In the spiral test, your line was ${describeAmplitude(
        spiral.deviation,
        0.02,
        0.13
      )}, meaning it wobbled ${spiral.deviation < 0.05 ? 'very little' : 'more than a smooth line would'}.`
    );
  }

  lines.push(
    score.band === 'low'
      ? 'This is reassuring. Repeat the check now and then to watch for changes over time.'
      : score.band === 'monitor'
        ? 'This is not a diagnosis, but it is worth repeating over a few days and mentioning to your doctor if it continues.'
        : 'This is not a diagnosis. Please consider booking a check-up with your doctor or a neurologist, and show them these results.'
  );

  return lines.join(' ');
}

function describeAmplitude(v, low, high) {
  const n = clamp01((v - low) / (high - low));
  if (n < 0.2) return 'very steady';
  if (n < 0.45) return 'fairly steady';
  if (n < 0.7) return 'moderately shaky';
  return 'quite shaky';
}

/**
 * Map a screening score to a reading-help profile. Higher tremor => bigger text,
 * higher contrast, and (for the optional on-screen steadying) more strength.
 */
export function readingProfileFromScore(score) {
  if (!score || score.band === 'low') {
    return { fontSize: 26, contrast: 'default', level: 'Light help', strength: 0.1 };
  }
  if (score.band === 'monitor') {
    return { fontSize: 40, contrast: 'default', level: 'Medium help', strength: 1.2 };
  }
  return { fontSize: 56, contrast: 'black', level: 'Strong help', strength: 2.8 };
}

export function doctorQuestions(score) {
  const base = [
    'Could my hand tremor be essential tremor, Parkinson’s, or something else?',
    'Are any of my current medications or caffeine making the shaking worse?',
    'Should I have a neurological examination or any further tests?',
  ];
  if (score.band !== 'low') {
    base.push('What signs should prompt me to come back sooner?');
    base.push('Are there exercises, therapies, or treatments that could help?');
  }
  return base;
}
