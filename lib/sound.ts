/**
 * Tiny Web Audio synth — no audio assets, works offline / static export.
 * `playTwangyBass` makes a short, plucky, wobbling bass note used as the Funky
 * theme's signature sound.
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

/** A short twangy bass pluck (~0.6s). Safe to call from a user gesture. */
export function playTwangyBass(): void {
  const ac = getCtx();
  if (!ac) return;
  // Browsers start the context suspended until a gesture; resume on demand.
  if (ac.state === "suspended") void ac.resume();

  const t = ac.currentTime;
  const f0 = 73.42; // D2 — low and fat

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.4, t + 0.006); // quick pluck attack
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); // decay
  master.connect(ac.destination);

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2600, t);
  filter.frequency.exponentialRampToValueAtTime(420, t + 0.4);
  filter.Q.value = 7;
  filter.connect(master);

  // Main saw with a downward pitch bend = the "twang".
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(f0 * 2, t);
  osc.frequency.exponentialRampToValueAtTime(f0, t + 0.12);
  osc.connect(filter);

  // Sub-octave sine for body.
  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(f0 / 2, t);
  const subGain = ac.createGain();
  subGain.gain.value = 0.5;
  sub.connect(subGain);
  subGain.connect(filter);

  // Vibrato LFO for the wobble.
  const lfo = ac.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 6;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 11;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  const end = t + 0.62;
  osc.start(t);
  sub.start(t);
  lfo.start(t);
  osc.stop(end);
  sub.stop(end);
  lfo.stop(end);
}
