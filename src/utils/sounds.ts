let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
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
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Bell "ding" — two metallic partials
    [2400, 3200].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08 - i * 0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });

    // Cash drawer spring "cha" — filtered noise burst
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(4000, now);
    bandpass.Q.setValueAtTime(0.5, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noiseSrc.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now + 0.1);
    noiseSrc.stop(now + 0.25);

    // Low thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    thudGain.gain.setValueAtTime(0.15, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.15);
  } catch {
    // Audio not available
  }
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

export function playNotificationSound() {
  playTone(880, 0.06, 'sine', 0.06);
  setTimeout(() => playTone(1100, 0.08, 'sine', 0.05), 60);
}
