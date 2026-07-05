# TremorLens 🔬👁️

TremorLens is an accessibility-first Progressive Web Application (PWA) built using **React 18, Vite, and Tailwind CSS**. It is designed specifically to help individuals with hand tremors read text on their screens comfortably.

It leverages physical device orientation sensor data to dynamically move reading container contents in the opposite direction of the hand's tremors in real-time, effectively keeping the text stationary relative to the user's eyes.

## Key Features

1. **Tremor Stabilization Assist**: Real-time compensation offsets computed at 60fps via `requestAnimationFrame` using device sensors.
2. **Text-To-Speech with Highlighting**: Synthesizes speech from content while providing real-time word-by-word visual highlighting.
3. **Accessibility Typography & Contrast Panels**: Large font adjustments (24px to 72px) with extra-forgiving touch adjustments, and contrast presets (Calm Blue, Black on Yellow, Dark Blue, White on Black).
4. **Desktop Demo Mode Simulator**: Shakes the viewport elements artificially, showing physical compensation in real-time so judges can see the compensation working without using mobile devices.
5. **Stability Trainer Exercises**: A fun interactive training mini-game using gyroscope sensors to practice motor stability.
6. **Progressive Web App (PWA)**: Installable, standalone experience on iOS and Android with custom registration prompts and offline service worker caching.

---

## File Structure

```text
/src
  /components
    StabilizedViewport.jsx    # Text layout wrapper translating opposite to hand tremor
    TextInput.jsx             # Source text textarea with clipboard paste & clear triggers
    TremorControls.jsx        # Tremor assist toggler, strength, and simulator buttons
    AccessibilityPanel.jsx    # Font size range inputs + Contrast mode buttons
    Header.jsx                # Layout navigation tabs & install prompt integration
  /hooks
    useDeviceMotion.js        # Tracks device orientation, computes averages & offsets
    useTremorCompensation.js  # Filters, scales, and clamps offsets using requestAnimationFrame
    useTextToSpeech.js        # Synthesizes audio and reports word index speech boundaries
  App.jsx                     # Global state, tabs layout, reports dashboard
  main.jsx                    # React mounting & Service Worker registrations
  index.css                   # Custom Tailwind directives & slide animations
/public
  manifest.json               # Standalone manifest file for PWA setups
  sw.js                       # Simple offline cache-first service worker
  icon-192.png                # App icon 192x192 PNG
  icon-512.png                # App icon 512x512 PNG
index.html                    # Root index template loadingOutfit fonts and manifest
vite.config.js                # Build plugins & configs
vercel.json                   # Route rules redirecting requests for SPA structures
package.json                  # React 18, Tailwind CSS dependencies
README.md                     # Project documentation
```

---

## Setup & Running

### Installation
Run the following commands to install dependencies:
```bash
npm install
```

### Run Locally (Development)
Start the Vite dev server:
```bash
npm run dev
```

### Production Build
Create the production bundle:
```bash
npm run build
```

---

## How to Test the Tremor Compensation (Without a Phone)

1. Run the app on your computer (`npm run dev`) and open the browser.
2. Scroll to **Tremor Settings** on the left column.
3. Click the **SIMULATOR ON** button to toggle **Demo Mode**.
4. *Observation*: The reading text viewport on the right will begin to shake/tremble.
5. Next, click the big **Tremor Assist: OFF** button to toggle it **ACTIVE**.
6. *Observation*: The text inside the viewport immediately becomes static and easy to read, while the background and borders of the viewport continue to shake. This demonstrates how the compensation offsets perfectly cancel out the hand tremor!
