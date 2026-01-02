import * as Tone from 'tone'

// 音频管理器单例
class AudioManager {
  private synth: Tone.Synth | null = null
  private successSynth: Tone.PolySynth | null = null
  private initialized = false

  // 初始化音频（需要用户交互后调用）
  async init() {
    if (this.initialized) return

    await Tone.start()

    // 主音色 - 模拟小提琴的正弦波 + 包络
    this.synth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.4,
        release: 0.8,
      },
    }).toDestination()

    // 成功音效 - 和弦
    this.successSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.1,
        release: 0.3,
      },
    }).toDestination()

    this.initialized = true
  }

  // 确保已初始化
  private async ensureInit() {
    if (!this.initialized) {
      await this.init()
    }
  }

  // 播放单个音符
  async playNote(pitch: string, duration: number = 0.5) {
    await this.ensureInit()
    if (!this.synth) return

    // 将音名转换为 Tone.js 格式 (如 C4, D#4)
    const tonePitch = this.convertPitch(pitch)
    this.synth.triggerAttackRelease(tonePitch, duration)
  }

  // 播放成功音效（上行和弦）
  async playSuccess() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    this.successSynth.triggerAttackRelease('C5', '16n', now)
    this.successSynth.triggerAttackRelease('E5', '16n', now + 0.05)
    this.successSynth.triggerAttackRelease('G5', '16n', now + 0.1)
  }

  // 播放连击音效（更华丽的上行）
  async playCombo() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    this.successSynth.triggerAttackRelease('C5', '16n', now)
    this.successSynth.triggerAttackRelease('E5', '16n', now + 0.04)
    this.successSynth.triggerAttackRelease('G5', '16n', now + 0.08)
    this.successSynth.triggerAttackRelease('C6', '8n', now + 0.12)
  }

  // 播放跳过/错误音效（下行）
  async playSkip() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    this.successSynth.triggerAttackRelease('E4', '16n', now)
    this.successSynth.triggerAttackRelease('C4', '16n', now + 0.1)
  }

  // 播放完成音效（庆祝）
  async playComplete() {
    await this.ensureInit()
    if (!this.successSynth) return

    const now = Tone.now()
    // 上行琶音
    const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6']
    notes.forEach((note, i) => {
      this.successSynth!.triggerAttackRelease(note, '8n', now + i * 0.08)
    })
  }

  // 转换音高格式
  private convertPitch(pitch: string): string {
    // 已经是正确格式（如 C4, D#4, Bb4）
    return pitch
  }

  // 停止所有声音
  stopAll() {
    if (this.synth) {
      this.synth.triggerRelease()
    }
  }

  // 设置音量 (0-1)
  setVolume(volume: number) {
    if (this.synth) {
      this.synth.volume.value = Tone.gainToDb(volume)
    }
    if (this.successSynth) {
      this.successSynth.volume.value = Tone.gainToDb(volume)
    }
  }
}

// 导出单例
export const audioManager = new AudioManager()

// 便捷函数
export const playNote = (pitch: string, duration?: number) =>
  audioManager.playNote(pitch, duration)

export const playSuccess = () => audioManager.playSuccess()

export const playCombo = () => audioManager.playCombo()

export const playSkip = () => audioManager.playSkip()

export const playComplete = () => audioManager.playComplete()

export const initAudio = () => audioManager.init()
