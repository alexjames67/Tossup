/**
 * Tiny Web Audio synth — no audio assets, works offline / static export.
 * `playTwangyBass` is a warm 1970s funk-bass pluck: a quick slide up into the
 * note, a resonant envelope-filter "wah" flare, soft tube saturation, a
 * finger-pluck transient, and a fat sub-octave.
 */

type WebkitWindow = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/** Soft asymmetric saturation curve for tube-like warmth. */
function saturationCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

/** A warm, twangy 70s funk-bass pluck (~1s). Call from a user gesture. */
export function playTwangyBass(): void {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime;
  const root = 82.41; // E2
  const slideFrom = root * 0.75; // a fourth below — the slide-up "twang"

  const out = ac.createGain();
  out.gain.value = 0.85;
  out.connect(ac.destination);

  // Amp envelope: snappy finger attack, then a warm sustain into a long decay.
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.42, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.2, t + 0.2);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  amp.connect(out);

  // Resonant envelope filter (auto-wah) — opens fast, then closes. The funk.
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 9;
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(1850, t + 0.09);
  filter.frequency.exponentialRampToValueAtTime(240, t + 0.6);
  filter.connect(amp);

  // Soft saturation for warmth/growl.
  const shaper = ac.createWaveShaper();
  shaper.curve = saturationCurve(2.2);
  shaper.oversample = "2x";
  shaper.connect(filter);

  // Main oscillator: sawtooth sliding up into the root note.
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(slideFrom, t);
  osc.frequency.exponentialRampToValueAtTime(root, t + 0.07);
  osc.connect(shaper);

  // Sub-octave sine for a round low end — bypasses the wah, stays clean.
  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(slideFrom / 2, t);
  sub.frequency.exponentialRampToValueAtTime(root / 2, t + 0.07);
  const subGain = ac.createGain();
  subGain.gain.value = 0.5;
  sub.connect(subGain);
  subGain.connect(amp);

  // Gentle, slow vibrato (not the toy-like fast wobble).
  const lfo = ac.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 4.5;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 2;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  // Finger-pluck transient: a short filtered noise click at the very start.
  const noiseBuf = ac.createBuffer(
    1,
    Math.floor(ac.sampleRate * 0.05),
    ac.sampleRate,
  );
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseBp = ac.createBiquadFilter();
  noiseBp.type = "bandpass";
  noiseBp.frequency.value = 1500;
  noiseBp.Q.value = 0.8;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.16, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(out);

  const end = t + 1.0;
  osc.start(t);
  sub.start(t);
  lfo.start(t);
  noise.start(t);
  osc.stop(end);
  sub.stop(end);
  lfo.stop(end);
}
