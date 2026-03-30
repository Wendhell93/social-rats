/**
 * Sound effects via Web Audio API synthesis.
 * No external files — pure oscillator tones.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(frequency: number, startTime: number, duration: number, gain: number, type: OscillatorType = "sine") {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Post created — 2 ascending notes (C5→E5), bright and short */
export function playCoinSound() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    playTone(523, t, 0.12, 0.25, "sine");         // C5
    playTone(659, t + 0.08, 0.15, 0.3, "sine");    // E5
    playTone(659, t + 0.08, 0.15, 0.08, "triangle"); // shimmer
  } catch { /* silent fail */ }
}

/** Voucher earned — 3 ascending notes (C5→E5→G5) with shimmer */
export function playVoucherSound() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    playTone(523, t, 0.12, 0.2, "sine");           // C5
    playTone(659, t + 0.1, 0.12, 0.25, "sine");    // E5
    playTone(784, t + 0.2, 0.2, 0.3, "sine");      // G5
    playTone(784, t + 0.2, 0.2, 0.1, "triangle");  // shimmer
    playTone(1047, t + 0.3, 0.15, 0.08, "sine");   // C6 sparkle
  } catch { /* silent fail */ }
}

/** Raffle win — full arpeggio (C5→E5→G5→C6), triumphant */
export function playRaffleWinSound() {
  try {
    const c = getCtx();
    const t = c.currentTime;
    playTone(523, t, 0.15, 0.2, "sine");           // C5
    playTone(659, t + 0.12, 0.15, 0.25, "sine");   // E5
    playTone(784, t + 0.24, 0.15, 0.3, "sine");    // G5
    playTone(1047, t + 0.36, 0.35, 0.35, "sine");  // C6 (held longer)
    playTone(1047, t + 0.36, 0.35, 0.12, "triangle"); // shimmer
    playTone(1047, t + 0.36, 0.35, 0.06, "square");   // grit
  } catch { /* silent fail */ }
}
