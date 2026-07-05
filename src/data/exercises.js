// Shared hand-exercise data — used by the Exercises tab and the voice assistant.

// Images are self-hosted in /public/exercises so they always load (no external
// CDN / referrer / adblock dependency) and can be cached offline.
export const OVERVIEW = '/exercises/ex1.png';

export const EXERCISES = [
  {
    n: 1,
    title: 'Finger Extension',
    focus: 'Flexibility',
    img: null, // shown within the overview poster
    steps: 'Gently pull each finger back and hold for 5 seconds. Repeat 3 times on each hand.',
  },
  {
    n: 2,
    title: 'Finger Spread',
    focus: 'Finger flexibility & mobility',
    img: '/exercises/ex2.png',
    steps:
      'Hold your hand out with fingers together and straight. Slowly spread your fingers as wide as you can and hold for 5 seconds. Then slowly bring them back together. Repeat 3 times, both hands.',
  },
  {
    n: 3,
    title: 'Finger Interlace Stretch',
    focus: 'Flexibility & reduced stiffness',
    img: '/exercises/ex3.png',
    steps:
      'Interlace your fingers and hold them together. Slowly push your palms away from your body, keeping the fingers interlaced. Hold for 5 seconds, then relax. Repeat 3 times.',
  },
  {
    n: 4,
    title: 'Fist Stretch',
    focus: 'Hand flexibility & function',
    img: '/exercises/ex4.png',
    steps:
      'Gently curl your fingers into your palm to make a fist and hold for 5 seconds. Then slowly open your fingers as wide as possible and hold for 5 seconds. Repeat 5 times, both hands.',
  },
  {
    n: 5,
    title: 'Thumb Stretch',
    focus: 'Thumb flexibility & mobility',
    img: '/exercises/ex5.png',
    steps:
      'Gently pull your thumb across your palm with your other hand and hold for 5 seconds. Return to the starting position. Repeat 3 times each hand.',
  },
  {
    n: 6,
    title: 'Finger Tip Touch',
    focus: 'Coordination & fine motor control',
    img: '/exercises/ex6.png',
    steps:
      'Touch your thumb to the tip of each finger, one by one — index, middle, ring, then little finger. Hold each for a moment. Repeat 3 times, both hands.',
  },
];

export function exerciseByNumber(n) {
  return EXERCISES.find((e) => e.n === n) || null;
}
