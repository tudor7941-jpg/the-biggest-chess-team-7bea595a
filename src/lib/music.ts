/**
 * Procedural high-energy action soundtrack (Web Audio API).
 * No audio assets needed - everything is synthesized and loops forever.
 */

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  timer: number | null;
  step: number;
  nextTime: number;
};

let engine: Engine | null = null;
let playing = false;
const listeners = new Set<(on: boolean) => void>();

const BPM = 148;
const STEP = 60 / BPM / 4; // 16th note
const STORAGE_KEY = "cto_music_on";

// Driving minor riff (A minor / epic action)
const BASS: number[] = [
  55.0, 0, 55.0, 0, 55.0, 0, 65.41, 0, 58.27, 0, 58.27, 0, 43.65, 0, 49.0, 0, 55.0, 0, 55.0, 0,
  55.0, 0, 65.41, 0, 73.42, 0, 65.41, 0, 58.27, 0, 49.0, 0,
];
const LEAD: number[] = [
  440, 523.25, 659.25, 523.25, 440, 0, 392, 440, 523.25, 0, 493.88, 440, 392, 0, 440, 0, 440,
  523.25, 659.25, 783.99, 659.25, 0, 587.33, 523.25, 493.88, 0, 440, 493.88, 523.25, 0, 587.33, 0,
];

function notify() {
  listeners.forEach((l) => l(playing));
}

export function onMusicChange(cb: (on: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isMusicPlaying() {
  return playing;
}

export function musicPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function kick(ctx: AudioContext, out: GainNode, t: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(44, t + 0.12);
  g.gain.setValueAtTime(1.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.25);
}

function noiseBurst(ctx: AudioContext, out: GainNode, t: number, dur: number, gain: number, hp: number) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function tone(
  ctx: AudioContext,
  out: GainNode,
  t: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  detune = 0,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function scheduleStep(e: Engine, step: number, t: number) {
  const { ctx, master } = e;
  const bar = Math.floor(step / 16) % 4;

  // Four-on-the-floor kick with extra push
  if (step % 4 === 0 || step % 16 === 14) kick(ctx, master, t);
  // Snare / clap on 2 and 4
  if (step % 8 === 4) noiseBurst(ctx, master, t, 0.18, 0.5, 1200);
  // Hi-hats every 8th, open hat accent
  if (step % 2 === 0) noiseBurst(ctx, master, t, 0.04, 0.16, 7000);
  if (step % 16 === 10) noiseBurst(ctx, master, t, 0.16, 0.2, 6000);

  // Bass riff
  const bassNote = BASS[step % BASS.length] ?? 0;
  if (bassNote > 0) {
    tone(ctx, master, t, bassNote, STEP * 1.9, "sawtooth", 0.28);
    tone(ctx, master, t, bassNote * 2, STEP * 1.4, "square", 0.09);
  }

  // Lead riff kicks in from bar 2 for a build-up feel
  if (bar >= 1) {
    const leadNote = LEAD[step % LEAD.length] ?? 0;
    if (leadNote > 0) {
      tone(ctx, master, t, leadNote, STEP * 1.6, "sawtooth", bar >= 2 ? 0.13 : 0.08, -7);
      tone(ctx, master, t, leadNote, STEP * 1.6, "sawtooth", bar >= 2 ? 0.13 : 0.08, 7);
    }
  }

  // Power chord stabs on the downbeat of each bar
  if (step % 16 === 0) {
    const root = bar % 2 === 0 ? 110 : 87.31;
    tone(ctx, master, t, root, 0.5, "sawtooth", 0.14);
    tone(ctx, master, t, root * 1.5, 0.5, "sawtooth", 0.1);
  }
}

function loop(e: Engine) {
  const lookAhead = 0.25;
  while (e.nextTime < e.ctx.currentTime + lookAhead) {
    scheduleStep(e, e.step, e.nextTime);
    e.step = (e.step + 1) % 64;
    e.nextTime += STEP;
  }
}

export async function startMusic() {
  if (playing) return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  if (!engine) {
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    engine = { ctx, master, timer: null, step: 0, nextTime: 0 };
  }

  const e = engine;
  try {
    await e.ctx.resume();
  } catch {
    return;
  }
  if (e.ctx.state !== "running") return;

  e.step = 0;
  e.nextTime = e.ctx.currentTime + 0.1;
  e.master.gain.cancelScheduledValues(e.ctx.currentTime);
  e.master.gain.setValueAtTime(0.0001, e.ctx.currentTime);
  e.master.gain.linearRampToValueAtTime(0.16, e.ctx.currentTime + 1.2);

  if (e.timer !== null) clearInterval(e.timer);
  e.timer = window.setInterval(() => loop(e), 40);
  playing = true;
  try {
    localStorage.setItem(STORAGE_KEY, "on");
  } catch {
    /* ignore */
  }
  notify();
}

export function stopMusic() {
  const e = engine;
  playing = false;
  try {
    localStorage.setItem(STORAGE_KEY, "off");
  } catch {
    /* ignore */
  }
  notify();
  if (!e) return;
  try {
    e.master.gain.cancelScheduledValues(e.ctx.currentTime);
    e.master.gain.setValueAtTime(e.master.gain.value, e.ctx.currentTime);
    e.master.gain.linearRampToValueAtTime(0.0001, e.ctx.currentTime + 0.4);
  } catch {
    /* ignore */
  }
  if (e.timer !== null) {
    clearInterval(e.timer);
    e.timer = null;
  }
}

export function toggleMusic() {
  if (playing) stopMusic();
  else void startMusic();
}
