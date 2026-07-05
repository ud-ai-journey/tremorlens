// Shared hand-exercise data — used by the Exercises tab and the voice assistant.

export const OVERVIEW =
  'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233692/3d483270-443b-4421-84cc-dc498fd5d115_jajwfa.png';

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
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233962/be12c3db-5620-48e8-9258-6442f6267fc4_u3idp1.png',
    steps:
      'Hold your hand out with fingers together and straight. Slowly spread your fingers as wide as you can and hold for 5 seconds. Then slowly bring them back together. Repeat 3 times, both hands.',
  },
  {
    n: 3,
    title: 'Finger Interlace Stretch',
    focus: 'Flexibility & reduced stiffness',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233979/e0ba9a35-f305-426d-ad6d-de46689f93a0_tg5ckk.png',
    steps:
      'Interlace your fingers and hold them together. Slowly push your palms away from your body, keeping the fingers interlaced. Hold for 5 seconds, then relax. Repeat 3 times.',
  },
  {
    n: 4,
    title: 'Fist Stretch',
    focus: 'Hand flexibility & function',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783233992/8e4dfae7-d44e-49bc-933e-4c513fcf0837_rmjzlk.png',
    steps:
      'Gently curl your fingers into your palm to make a fist and hold for 5 seconds. Then slowly open your fingers as wide as possible and hold for 5 seconds. Repeat 5 times, both hands.',
  },
  {
    n: 5,
    title: 'Thumb Stretch',
    focus: 'Thumb flexibility & mobility',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783234068/0ee8a8a0-b2ea-4ee4-9a19-3f19e4dc29fe_xbhe32.png',
    steps:
      'Gently pull your thumb across your palm with your other hand and hold for 5 seconds. Return to the starting position. Repeat 3 times each hand.',
  },
  {
    n: 6,
    title: 'Finger Tip Touch',
    focus: 'Coordination & fine motor control',
    img: 'https://res.cloudinary.com/tdq0puk9/image/upload/v1783234441/e3f13732-a9ae-4685-8fea-edad58bbd316_lvaivg.png',
    steps:
      'Touch your thumb to the tip of each finger, one by one — index, middle, ring, then little finger. Hold each for a moment. Repeat 3 times, both hands.',
  },
];

export function exerciseByNumber(n) {
  return EXERCISES.find((e) => e.n === n) || null;
}
