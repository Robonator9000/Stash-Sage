let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playSellSound() {
  playTone(880, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(1100, 0.2, 'sine', 0.1), 100);
}

export function playSmokeSound() {
  playTone(600, 0.08, 'triangle', 0.08);
  setTimeout(() => playTone(800, 0.12, 'triangle', 0.07), 60);
  setTimeout(() => playTone(1000, 0.15, 'triangle', 0.06), 120);
}

export function playSessionBeep() {
  playTone(520, 0.08, 'sine', 0.06);
  setTimeout(() => playTone(680, 0.1, 'sine', 0.05), 80);
}
