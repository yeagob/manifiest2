const BPM = 104
const STEP = 60 / BPM / 4
const LOOKAHEAD = 0.14
const MAX_VOICES = 6
const FORMANTS = { a: [800, 1200], e: [450, 1900], i: [320, 2300], o: [500, 850], u: [350, 700] }
const PENTA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093]
const CHORDS = [[130.8, 164.8, 196], [110, 130.8, 164.8], [87.3, 110, 130.8], [98, 123.5, 146.8]]
const BRASS_RIFF = [0, null, 0, 3, 5, null, 7, 5, 3, null, 0, null, -2, 0, null, null]
const BASS_LINE = [0, 0, 7, 0, 5, 0, 7, 10]

export const ONOMATOPOEIA = {
  samba: ['¡PAM PAM!', '¡TUM-TAKA!', '¡BUM!'],
  whistle: ['¡FIU FIU!', '¡PRIII!'],
  bombo: ['¡BOOM!', '¡BOM!'],
  bells: ['¡RING RING!', '¡TILÍN!'],
  brass: ['¡TARARÍ!', '¡POROPÓ!'],
  bass: ['¡UNTS UNTS!'],
  dragon: ['¡GONG!', '¡CHAS!'],
  cards: ['¡FLAP FLAP!', '¡CLAC!'],
  doves: ['¡CURRUCÚ!'],
  whale: ['¡UUUUUH!'],
  hiss: ['¡FSSSHH!'],
  knock: ['¡TOC TOC!'],
  forest: ['¡PÍO PÍO!'],
  chimes: ['¡CLIN!']
}

export function syllabify(text) {
  const clean = String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ\s]/g, ' ')
  const out = []
  for (const w of clean.split(/\s+/).filter(Boolean)) {
    const parts = w.match(/[^aeiou]*[aeiou]+(?:[^aeiou]+$)?/g) ?? [w]
    parts.forEach((p, i) => out.push({ vowel: (p.match(/[aeiou]/) ?? ['a'])[0], consonant: /^[^aeiou]/.test(p), wordEnd: i === parts.length - 1 }))
  }
  return out.slice(0, 18)
}

function noiseBuffer(ctx, seconds, color) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, last = 0
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1
    if (color === 'pink') {
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2
    } else if (color === 'brown') {
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    } else d[i] = w
  }
  return buffer
}

function impulse(ctx, seconds) {
  const len = ctx.sampleRate * seconds
  const buffer = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buffer.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6
  }
  return buffer
}

class Voice {
  constructor(engine, emitter) {
    const { ctx } = engine
    this.engine = engine
    this.key = emitter.key
    this.counts = emitter.counts
    this.text = emitter.text
    this.offset = Math.floor(Math.random() * 8)
    this.panner = ctx.createPanner()
    Object.assign(this.panner, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 3.5, maxDistance: 90, rolloffFactor: 1.15 })
    this.gain = ctx.createGain()
    this.gain.gain.value = 0
    this.gain.gain.setTargetAtTime(1, ctx.currentTime, 0.4)
    this.out = ctx.createGain()
    this.out.connect(this.panner)
    this.panner.connect(this.gain)
    this.gain.connect(engine.bus)
    this.send = ctx.createGain()
    this.send.gain.value = 0.25
    this.gain.connect(this.send)
    this.send.connect(engine.reverb)
    this.loops = []
    const voices = (this.counts.marcher ?? 0) + (this.counts.citizen ?? 0) + (this.counts.giant_banner ?? 0) * 6 + (this.counts.rainbow_flag ?? 0) * 5
    if (voices) this.loop(engine.pink, 'bandpass', 520, 0.9, 0.035 * Math.sqrt(voices), 0.6)
    if (this.counts.color_smoke) this.loop(engine.white, 'highpass', 3200, 0.5, 0.012 * Math.sqrt(this.counts.color_smoke), 0.25)
    if (this.counts.walking_tree) this.loop(engine.pink, 'bandpass', 2600, 1.4, 0.012, 1.5)
    this.setPosition(emitter.position)
  }

  loop(buffer, type, freq, q, level, lfoRate) {
    const { ctx } = this.engine
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    src.loopStart = Math.random()
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = q
    const g = ctx.createGain()
    g.gain.value = level
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = lfoRate
    lfoGain.gain.value = level * 0.5
    lfo.connect(lfoGain).connect(g.gain)
    src.connect(filter).connect(g).connect(this.out)
    src.start(ctx.currentTime, Math.random() * buffer.duration)
    lfo.start()
    this.loops.push(src, lfo)
  }

  setPosition([x, y, z]) {
    const t = this.engine.ctx.currentTime
    this.panner.positionX.setTargetAtTime(x, t, 0.05)
    this.panner.positionY.setTargetAtTime(y, t, 0.05)
    this.panner.positionZ.setTargetAtTime(z, t, 0.05)
  }

  schedule(step, time) {
    const c = this.counts
    const e = this.engine
    const bar = Math.floor(step / 16)
    const s = step % 16
    const amt = n => Math.min(2.2, Math.sqrt(n))
    const voices = (c.marcher ?? 0) + (c.citizen ?? 0) + (c.giant_banner ?? 0) * 6 + (c.rainbow_flag ?? 0) * 5 + (c.choir ?? 0) * 4
    const chantBar = (bar + this.offset) % 8
    if (c.megaphone && chantBar === 0 && s === 0) {
      e.squeal(this.out, time)
      e.chant(this.out, time + 0.3, this.text, 1, true)
      e.chant(this.out, time + 0.3 + e.phraseLength(this.text) + 0.2, this.text, Math.min(8, 2 + voices), false)
      e.emit(this.key, 'chant', this.text, time + 0.3)
    } else if (!c.megaphone && voices && chantBar === 0 && s === 0 && (bar + this.offset) % 16 === 0) {
      e.chant(this.out, time, this.text, Math.min(8, 1 + voices), false)
      e.emit(this.key, 'chant', this.text, time)
    }
    if (c.drummer) {
      const a = amt(c.drummer)
      if (s === 4) e.drum(this.out, time, 72, 0.5 * a)
      if (s === 12) e.drum(this.out, time, 96, 0.42 * a)
      if (s % 2 === 0 || s === 7 || s === 15) e.snare(this.out, time, (s % 4 === 0 ? 0.12 : 0.06) * a)
      if ((s === 3 || s === 6 || s === 10) && bar % 2) e.drum(this.out, time, 220, 0.12 * a, 0.08)
      if (s === 0 && bar % 4 === 0) e.emit(this.key, 'samba', null, time)
    }
    if (c.flag_bearer && bar % 4 === 1 && (s === 0 || s === 2 || s === 4)) {
      e.whistle(this.out, time, 0.06 * amt(c.flag_bearer))
      if (s === 0) e.emit(this.key, 'whistle', null, time)
    }
    if (c.puppet_giant && (s === 0 || s === 8)) {
      e.drum(this.out, time, 52, (s === 0 ? 0.8 : 0.45) * amt(c.puppet_giant), 0.9)
      if (s === 0 && bar % 4 === 0) e.emit(this.key, 'bombo', null, time)
    }
    if (c.choir && s === 0 && bar % 4 === 0) e.choir(this.out, time, CHORDS[(bar / 4) % 4 | 0], Math.min(6, c.choir * 2), STEP * 64)
    if (c.bike_bloc && s % 4 === 0 && Math.random() < 0.18) {
      e.bell(this.out, time, 0.1 * amt(c.bike_bloc))
      e.emit(this.key, 'bells', null, time)
    }
    if (c.brass_band && bar % 4 < 2) {
      const note = BRASS_RIFF[s]
      if (note !== null) e.brass(this.out, time, 196 * 2 ** (note / 12), 0.09 * amt(c.brass_band), STEP * 1.8)
      if (s === 0 && bar % 4 === 0) e.emit(this.key, 'brass', null, time)
    }
    if (c.float) {
      if (s % 4 === 0) e.drum(this.out, time, 58, 0.55 * amt(c.float), 0.35)
      if (s % 2 === 0) e.bass(this.out, time, 55 * 2 ** (BASS_LINE[(s / 2) % 8] / 12), 0.16 * amt(c.float), STEP * 1.6)
      if (s === 0 && bar % 8 === 0) e.emit(this.key, 'bass', null, time)
    }
    if (c.lanterns && s % 2 === 0 && Math.random() < 0.22) e.pluck(this.out, time, PENTA[Math.floor(Math.random() * PENTA.length)], 0.05 * amt(c.lanterns))
    if (c.paper_dragon) {
      if (s === 0 && bar % 4 === 0) { e.gong(this.out, time, 0.35 * amt(c.paper_dragon)); e.emit(this.key, 'dragon', null, time) }
      if (s % 4 === 2) e.snare(this.out, time, 0.08, 6000, 0.25)
      if (s % 2 === 0) e.drum(this.out, time, 140, 0.18, 0.12)
    }
    if (c.card_mosaic && s === 0 && bar % 4 === 2) {
      for (let i = 0; i < 12; i++) e.click(this.out, time + i * 0.06, 0.12)
      e.emit(this.key, 'cards', null, time)
    }
    if (c.dove_flock && s === 0 && bar % 2 === 0) {
      e.flutter(this.out, time, 0.1)
      if (bar % 4 === 0) { e.coo(this.out, time + 0.5, 0.06); e.emit(this.key, 'doves', null, time) }
    }
    if (c.walking_tree && s % 4 === 0 && Math.random() < 0.3) {
      e.chirp(this.out, time, 0.05)
      if (Math.random() < 0.3) e.emit(this.key, 'forest', null, time)
    }
    if (c.paper_whale && s === 0 && bar % 4 === 0) { e.whale(this.out, time, 0.14); e.emit(this.key, 'whale', null, time) }
    if (c.carried_house && s % 8 === 0) {
      e.knock(this.out, time, 0.2)
      e.knock(this.out, time + 0.14, 0.14)
      if (s === 0 && bar % 4 === 0) e.emit(this.key, 'knock', null, time)
    }
    if (c.color_smoke && s === 0 && bar % 8 === 3) e.emit(this.key, 'hiss', null, time)
  }

  dispose() {
    const t = this.engine.ctx.currentTime
    this.gain.gain.setTargetAtTime(0, t, 0.3)
    setTimeout(() => {
      for (const n of this.loops) { try { n.stop() } catch {} }
      this.gain.disconnect()
      this.send.disconnect()
    }, 1600)
  }
}

export class MarchAudio {
  constructor() {
    this.ctx = null
    this.voices = new Map()
    this.listeners = new Set()
    this.step = 0
    this.volume = 0.8
  }

  get running() { return this.ctx?.state === 'running' }

  async start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      this.ctx = ctx
      this.pink = noiseBuffer(ctx, 4, 'pink')
      this.white = noiseBuffer(ctx, 2, 'white')
      this.brown = noiseBuffer(ctx, 4, 'brown')
      this.master = ctx.createGain()
      this.master.gain.value = this.volume
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -16
      comp.ratio.value = 4
      this.master.connect(comp).connect(ctx.destination)
      this.bus = ctx.createGain()
      this.bus.connect(this.master)
      this.reverb = ctx.createConvolver()
      this.reverb.buffer = impulse(ctx, 2.4)
      const wet = ctx.createGain()
      wet.gain.value = 0.35
      this.reverb.connect(wet).connect(this.master)
      this.ambience = this.ambientBed()
      this.nextTime = ctx.currentTime + 0.1
      this.timer = setInterval(() => this.tick(), 25)
    }
    await this.ctx.resume()
  }

  async suspend() { await this.ctx?.suspend() }

  setVolume(v) {
    this.volume = v
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1)
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }

  emit(key, kind, text, time) {
    const delay = Math.max(0, (time - this.ctx.currentTime) * 1000)
    setTimeout(() => this.listeners.forEach(fn => fn({ key, kind, text })), delay)
  }

  ambientBed() {
    const ctx = this.ctx
    const make = (buffer, type, freq, level) => {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = level
      src.connect(f).connect(g).connect(this.master)
      src.start()
      return g
    }
    return { rumble: make(this.brown, 'lowpass', 260, 0.05), chatter: make(this.pink, 'bandpass', 750, 0.02) }
  }

  setCrowd(people) {
    if (!this.ambience) return
    const level = Math.min(1, Math.log10(people + 1) / 4)
    const t = this.ctx.currentTime
    this.ambience.rumble.gain.setTargetAtTime(0.03 + level * 0.1, t, 0.8)
    this.ambience.chatter.gain.setTargetAtTime(0.01 + level * 0.05, t, 0.8)
  }

  setListener(camera) {
    if (!this.ctx) return
    const l = this.ctx.listener
    const p = camera.position
    const f = camera.getWorldDirection(this._dir ??= camera.position.clone())
    const t = this.ctx.currentTime
    if (l.positionX) {
      l.positionX.setTargetAtTime(p.x, t, 0.05); l.positionY.setTargetAtTime(p.y, t, 0.05); l.positionZ.setTargetAtTime(p.z, t, 0.05)
      l.forwardX.setTargetAtTime(f.x, t, 0.05); l.forwardY.setTargetAtTime(f.y, t, 0.05); l.forwardZ.setTargetAtTime(f.z, t, 0.05)
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0
    } else {
      l.setPosition(p.x, p.y, p.z)
      l.setOrientation(f.x, f.y, f.z, 0, 1, 0)
    }
  }

  updateEmitters(emitters) {
    if (!this.ctx) return
    const chosen = emitters.slice(0, MAX_VOICES)
    const keys = new Set(chosen.map(e => e.key))
    for (const [key, voice] of this.voices) {
      if (!keys.has(key)) { voice.dispose(); this.voices.delete(key) }
    }
    for (const e of chosen) {
      const v = this.voices.get(e.key)
      if (v) v.setPosition(e.position)
      else this.voices.set(e.key, new Voice(this, e))
    }
  }

  tick() {
    if (!this.running) return
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      for (const v of this.voices.values()) v.schedule(this.step, this.nextTime)
      this.nextTime += STEP
      this.step++
    }
  }

  env(g, t, attack, peak, decay) {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  }

  noiseHit(out, t, type, freq, q, level, decay, buffer = this.white) {
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = this.ctx.createGain()
    this.env(g, t, 0.003, level, decay)
    src.connect(f).connect(g).connect(out)
    src.start(t, Math.random())
    src.stop(t + decay + 0.05)
  }

  tone(out, t, type, freq, level, attack, decay, glideTo) {
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + attack + decay)
    const g = this.ctx.createGain()
    this.env(g, t, attack, level, decay)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + attack + decay + 0.05)
    return o
  }

  drum(out, t, freq, level, decay = 0.4) { this.tone(out, t, 'sine', freq * 2.2, level, 0.002, decay, freq) }
  snare(out, t, level, freq = 1800, decay = 0.07) { this.noiseHit(out, t, 'highpass', freq, 0.7, level, decay) }
  click(out, t, level) { this.noiseHit(out, t, 'bandpass', 2600, 4, level, 0.03) }
  knock(out, t, level) { this.noiseHit(out, t, 'bandpass', 900, 6, level, 0.05); this.tone(out, t, 'sine', 190, level * 0.6, 0.002, 0.06) }
  pluck(out, t, freq, level) { this.tone(out, t, 'sine', freq, level, 0.004, 1.4) }
  bell(out, t, level) { [0, 0.13].forEach(d => { this.tone(out, t + d, 'sine', 2350, level, 0.002, 0.7); this.tone(out, t + d, 'sine', 5230, level * 0.4, 0.002, 0.4) }) }

  whistle(out, t, level) {
    const o = this.tone(out, t, 'sine', 2900, level, 0.01, 0.16)
    const lfo = this.ctx.createOscillator()
    const depth = this.ctx.createGain()
    lfo.frequency.value = 34
    depth.gain.value = 140
    lfo.connect(depth).connect(o.frequency)
    lfo.start(t)
    lfo.stop(t + 0.2)
  }

  squeal(out, t) { this.tone(out, t, 'sine', 1700, 0.03, 0.02, 0.22, 2600) }

  gong(out, t, level) { [110, 163, 219, 297, 412].forEach((f, i) => this.tone(out, t, 'sine', f, level / (i + 1.4), 0.01, 3.2 - i * 0.4)); this.noiseHit(out, t, 'highpass', 5000, 0.5, level * 0.4, 0.5) }

  coo(out, t, level) {
    const o = this.tone(out, t, 'sine', 430, level, 0.08, 0.5, 350)
    const lfo = this.ctx.createOscillator()
    const d = this.ctx.createGain()
    lfo.frequency.value = 7
    d.gain.value = 18
    lfo.connect(d).connect(o.frequency)
    lfo.start(t)
    lfo.stop(t + 0.7)
  }

  flutter(out, t, level) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.pink
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1100
    const g = this.ctx.createGain()
    g.gain.value = 0
    const am = this.ctx.createOscillator()
    const amg = this.ctx.createGain()
    am.frequency.value = 17
    amg.gain.value = level
    am.connect(amg).connect(g.gain)
    src.connect(f).connect(g).connect(out)
    src.start(t)
    am.start(t)
    src.stop(t + 0.5)
    am.stop(t + 0.5)
  }

  chirp(out, t, level) { for (let i = 0; i < 3; i++) this.tone(out, t + i * 0.11, 'sine', 3000 + Math.random() * 600, level, 0.005, 0.07, 4200) }

  whale(out, t, level) {
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(190, t)
    o.frequency.exponentialRampToValueAtTime(540, t + 1.2)
    o.frequency.exponentialRampToValueAtTime(260, t + 3)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 3.3)
  }

  brass(out, t, freq, level, dur) {
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(500, t)
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.05)
    f.frequency.exponentialRampToValueAtTime(900, t + dur)
    const g = this.ctx.createGain()
    this.env(g, t, 0.03, level, dur)
    f.connect(g).connect(out)
    for (const detune of [-8, 7]) {
      const o = this.ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq
      o.detune.value = detune
      o.connect(f)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
  }

  bass(out, t, freq, level, dur) {
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 420
    const g = this.ctx.createGain()
    this.env(g, t, 0.01, level, dur)
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = freq
    o.connect(f).connect(g).connect(out)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  choir(out, t, chord, singers, dur) {
    const vowels = ['a', 'o', 'e', 'u']
    const [f1, f2] = FORMANTS[vowels[Math.floor(Math.random() * 4)]]
    const b1 = this.ctx.createBiquadFilter()
    const b2 = this.ctx.createBiquadFilter()
    b1.type = b2.type = 'bandpass'
    b1.frequency.value = f1
    b2.frequency.value = f2
    b1.Q.value = b2.Q.value = 6
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.6)
    g.gain.setValueAtTime(0.09, t + dur - 0.8)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    b1.connect(g)
    b2.connect(g)
    g.connect(out)
    for (let i = 0; i < singers; i++) {
      const o = this.ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = chord[i % 3] * (i > 2 ? 2 : 1)
      o.detune.value = (Math.random() - 0.5) * 18
      o.connect(b1)
      o.connect(b2)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
  }

  phraseLength(text) {
    return syllabify(text).reduce((s, syl) => s + STEP * (syl.wordEnd ? 3 : 2), 0)
  }

  chant(out, t, text, voices, leader) {
    const syllables = syllabify(text)
    let time = t
    const base = leader ? 190 : 165
    syllables.forEach((syl, idx) => {
      const dur = STEP * (syl.wordEnd ? 3 : 2)
      const accent = idx === syllables.length - 1 || syl.wordEnd ? 1.12 : 1
      const [f1, f2] = FORMANTS[syl.vowel]
      const b1 = this.ctx.createBiquadFilter()
      const b2 = this.ctx.createBiquadFilter()
      b1.type = b2.type = 'bandpass'
      b1.frequency.value = f1
      b2.frequency.value = f2
      b1.Q.value = b2.Q.value = leader ? 5 : 7
      const g = this.ctx.createGain()
      const level = (leader ? 0.22 : 0.08 * Math.sqrt(voices)) * accent
      g.gain.setValueAtTime(0.0001, time)
      g.gain.exponentialRampToValueAtTime(level, time + 0.025)
      g.gain.exponentialRampToValueAtTime(level * 0.55, time + dur * 0.6)
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.95)
      let dest = g
      if (leader) {
        const shaper = this.ctx.createWaveShaper()
        const curve = new Float32Array(256)
        for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3) }
        shaper.curve = curve
        const hp = this.ctx.createBiquadFilter()
        hp.type = 'bandpass'
        hp.frequency.value = 1500
        hp.Q.value = 0.8
        g.connect(shaper).connect(hp).connect(out)
      } else g.connect(out)
      b1.connect(dest)
      b2.connect(dest)
      for (let v = 0; v < voices; v++) {
        const o = this.ctx.createOscillator()
        o.type = 'sawtooth'
        const pitch = base * (leader ? 1 : 0.75 + Math.random() * 0.7) * accent
        o.frequency.setValueAtTime(pitch, time)
        o.frequency.linearRampToValueAtTime(pitch * (syl.wordEnd ? 0.94 : 1.02), time + dur)
        o.connect(b1)
        o.connect(b2)
        o.start(time)
        o.stop(time + dur)
      }
      if (syl.consonant) this.noiseHit(dest, time, 'highpass', 2500, 0.8, level * 0.6, 0.04)
      time += dur
    })
  }

  speak(text) {
    if (!('speechSynthesis' in window) || !this.running) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'
    u.rate = 1.05
    u.pitch = 1.1
    u.volume = Math.min(1, this.volume)
    const voice = window.speechSynthesis.getVoices().find(v => v.lang?.startsWith('es'))
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
  }

  dispose() {
    clearInterval(this.timer)
    for (const v of this.voices.values()) v.dispose()
    this.voices.clear()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    this.ctx?.close()
    this.ctx = null
  }
}
