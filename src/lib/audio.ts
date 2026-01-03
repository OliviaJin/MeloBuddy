import * as Tone from 'tone'

// ===================
// 小提琴音色合成器
// ===================
// 使用加法合成模拟小提琴的丰富泛音结构
// 包含：泛音叠加 + 揉弦(vibrato) + 弓噪声 + 琴身共鸣

// 小提琴泛音相对强度 (基于真实小提琴频谱分析)
const HARMONIC_AMPLITUDES = [
  1.0,    // 1st - 基频
  0.5,    // 2nd - 八度
  0.35,   // 3rd
  0.25,   // 4th
  0.18,   // 5th
  0.12,   // 6th
  0.08,   // 7th
  0.05,   // 8th
]

class ViolinVoice {
  private partials: Tone.Oscillator[] = []
  private gains: Tone.Gain[] = []
  private masterGain: Tone.Gain
  private bodyFilter: Tone.Filter
  private bodyFilter2: Tone.Filter
  private highCut: Tone.Filter
  private bowNoise: Tone.Noise | null = null
  private noiseFilter: Tone.Filter
  private noiseGain: Tone.Gain
  private vibratoLFO: Tone.LFO | null = null
  private releaseTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(private destination: Tone.ToneAudioNode) {
    // 主增益
    this.masterGain = new Tone.Gain(0)

    // 琴身共鸣滤波器
    this.bodyFilter = new Tone.Filter({
      type: 'peaking',
      frequency: 1000,
      Q: 2,
      gain: 4,
    })

    this.bodyFilter2 = new Tone.Filter({
      type: 'peaking',
      frequency: 2800,
      Q: 1.5,
      gain: 2,
    })

    // 高频衰减
    this.highCut = new Tone.Filter({
      type: 'lowpass',
      frequency: 7000,
      Q: 0.5,
    })

    // 弓噪声
    this.noiseFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 2500,
      Q: 3,
    })
    this.noiseGain = new Tone.Gain(0)

    // 信号链
    this.bodyFilter.connect(this.bodyFilter2)
    this.bodyFilter2.connect(this.highCut)
    this.highCut.connect(this.masterGain)
    this.noiseFilter.connect(this.noiseGain)
    this.noiseGain.connect(this.masterGain)
    this.masterGain.connect(destination)
  }

  play(frequency: number, duration: number) {
    // 清理之前的音符
    this.cleanup()

    const now = Tone.now()

    // 创建泛音振荡器
    HARMONIC_AMPLITUDES.forEach((amp, i) => {
      const osc = new Tone.Oscillator({
        type: i === 0 ? 'sawtooth' : 'sine',
        frequency: frequency * (i + 1),
      })

      const gain = new Tone.Gain(0)
      osc.connect(gain)
      gain.connect(this.bodyFilter)

      // 启动
      osc.start(now)

      // Attack - 模拟弓接触弦
      const targetGain = amp * 0.12
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.06)

      this.partials.push(osc)
      this.gains.push(gain)
    })

    // 弓噪声
    this.bowNoise = new Tone.Noise('pink')
    this.bowNoise.connect(this.noiseFilter)
    this.bowNoise.start(now)

    this.noiseFilter.frequency.setValueAtTime(Math.min(frequency * 3, 4000), now)
    this.noiseGain.gain.setValueAtTime(0, now)
    this.noiseGain.gain.linearRampToValueAtTime(0.008, now + 0.04)

    // 主增益
    this.masterGain.gain.setValueAtTime(0, now)
    this.masterGain.gain.linearRampToValueAtTime(0.7, now + 0.05)

    // 揉弦 (长音符才加)
    if (duration > 0.4) {
      this.vibratoLFO = new Tone.LFO({
        frequency: 5.5,
        min: -0.015,
        max: 0.015,
      })
      this.vibratoLFO.start(now + 0.2)

      // 揉弦调制各泛音频率
      this.partials.forEach((osc, i) => {
        const baseFreq = frequency * (i + 1)
        // 用 LFO 调制频率
        const modulation = new Tone.Multiply(baseFreq)
        const addNode = new Tone.Add(baseFreq)
        this.vibratoLFO!.connect(modulation)
        modulation.connect(addNode)
        addNode.connect(osc.frequency)
      })
    }

    // 设置释放
    const releaseStart = now + duration
    const releaseTime = 0.3

    // Release
    this.gains.forEach(gain => {
      gain.gain.setValueAtTime(gain.gain.value, releaseStart)
      gain.gain.linearRampToValueAtTime(0, releaseStart + releaseTime)
    })

    this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, releaseStart)
    this.noiseGain.gain.linearRampToValueAtTime(0, releaseStart + releaseTime)

    this.masterGain.gain.setValueAtTime(0.7, releaseStart)
    this.masterGain.gain.linearRampToValueAtTime(0, releaseStart + releaseTime)

    // 停止振荡器
    const stopTime = releaseStart + releaseTime + 0.05
    this.partials.forEach(osc => osc.stop(stopTime))
    this.bowNoise?.stop(stopTime)
    this.vibratoLFO?.stop(stopTime)

    // 清理定时器
    this.releaseTimeout = setTimeout(() => {
      this.cleanup()
    }, (duration + releaseTime + 0.1) * 1000)
  }

  stop() {
    const now = Tone.now()
    const releaseTime = 0.2

    this.gains.forEach(gain => {
      gain.gain.linearRampToValueAtTime(0, now + releaseTime)
    })
    this.noiseGain.gain.linearRampToValueAtTime(0, now + releaseTime)
    this.masterGain.gain.linearRampToValueAtTime(0, now + releaseTime)

    setTimeout(() => this.cleanup(), releaseTime * 1000 + 50)
  }

  private cleanup() {
    if (this.releaseTimeout) {
      clearTimeout(this.releaseTimeout)
      this.releaseTimeout = null
    }

    this.partials.forEach(osc => {
      try { osc.stop() } catch {}
      osc.dispose()
    })
    this.partials = []

    this.gains.forEach(g => g.dispose())
    this.gains = []

    if (this.bowNoise) {
      try { this.bowNoise.stop() } catch {}
      this.bowNoise.dispose()
      this.bowNoise = null
    }

    if (this.vibratoLFO) {
      try { this.vibratoLFO.stop() } catch {}
      this.vibratoLFO.dispose()
      this.vibratoLFO = null
    }
  }

  dispose() {
    this.cleanup()
    this.masterGain.dispose()
    this.bodyFilter.dispose()
    this.bodyFilter2.dispose()
    this.highCut.dispose()
    this.noiseFilter.dispose()
    this.noiseGain.dispose()
  }
}

// ===================
// 音频管理器
// ===================

class AudioManager {
  private violinVoice: ViolinVoice | null = null
  private successSynth: Tone.PolySynth | null = null
  private initialized = false

  // 音名到频率的映射
  private static NOTE_FREQUENCIES: Record<string, number> = {
    'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
    'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65,
    'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
    'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
    'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
    'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61,
    'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'Db6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'Eb6': 1244.51,
    'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'Gb6': 1479.98, 'G6': 1567.98,
  }

  async init() {
    if (this.initialized) return

    await Tone.start()

    // 创建小提琴声音
    this.violinVoice = new ViolinVoice(Tone.getDestination())

    // 成功音效
    this.successSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.1,
        release: 0.3,
      },
    }).toDestination()
    this.successSynth.volume.value = -8

    this.initialized = true
  }

  private async ensureInit() {
    if (!this.initialized) {
      await this.init()
    }
  }

  private getFrequency(pitch: string): number {
    const normalized = pitch.replace('♯', '#').replace('♭', 'b')
    return AudioManager.NOTE_FREQUENCIES[normalized] || 440
  }

  async playNote(pitch: string, duration: number = 0.5) {
    await this.ensureInit()
    if (!this.violinVoice) return

    const freq = this.getFrequency(pitch)
    this.violinVoice.play(freq, duration)
  }

  async playSuccess() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    this.successSynth.triggerAttackRelease('C5', '16n', now)
    this.successSynth.triggerAttackRelease('E5', '16n', now + 0.05)
    this.successSynth.triggerAttackRelease('G5', '16n', now + 0.1)
  }

  async playCombo() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    this.successSynth.triggerAttackRelease('C5', '16n', now)
    this.successSynth.triggerAttackRelease('E5', '16n', now + 0.04)
    this.successSynth.triggerAttackRelease('G5', '16n', now + 0.08)
    this.successSynth.triggerAttackRelease('C6', '8n', now + 0.12)
  }

  async playSkip() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    this.successSynth.triggerAttackRelease('E4', '16n', now)
    this.successSynth.triggerAttackRelease('C4', '16n', now + 0.1)
  }

  async playComplete() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6']
    notes.forEach((note, i) => {
      this.successSynth!.triggerAttackRelease(note, '8n', now + i * 0.08)
    })
  }

  stopAll() {
    this.violinVoice?.stop()
  }

  setVolume(volume: number) {
    if (this.successSynth) {
      this.successSynth.volume.value = Tone.gainToDb(volume) - 8
    }
  }
}

// 导出单例
export const audioManager = new AudioManager()

export const playNote = (pitch: string, duration?: number) =>
  audioManager.playNote(pitch, duration)

export const playSuccess = () => audioManager.playSuccess()
export const playCombo = () => audioManager.playCombo()
export const playSkip = () => audioManager.playSkip()
export const playComplete = () => audioManager.playComplete()
export const initAudio = () => audioManager.init()
