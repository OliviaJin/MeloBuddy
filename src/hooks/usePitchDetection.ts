'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { PitchDetector } from 'pitchy'

// 音符频率表 (A4 = 440Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  // 低音区 (小提琴最低音)
  G3: 196.00,
  'G#3': 207.65, Ab3: 207.65,
  A3: 220.00,
  'A#3': 233.08, Bb3: 233.08,
  B3: 246.94,
  // 中音区
  C4: 261.63,
  'C#4': 277.18, Db4: 277.18,
  D4: 293.66,
  'D#4': 311.13, Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  'F#4': 369.99, Gb4: 369.99,
  G4: 392.00,
  'G#4': 415.30, Ab4: 415.30,
  A4: 440.00,
  'A#4': 466.16, Bb4: 466.16,
  B4: 493.88,
  // 高音区
  C5: 523.25,
  'C#5': 554.37, Db5: 554.37,
  D5: 587.33,
  'D#5': 622.25, Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  'F#5': 739.99, Gb5: 739.99,
  G5: 783.99,
  'G#5': 830.61, Ab5: 830.61,
  A5: 880.00,
  'A#5': 932.33, Bb5: 932.33,
  B5: 987.77,
  // 超高音区
  C6: 1046.50,
  'C#6': 1108.73, Db6: 1108.73,
  D6: 1174.66,
  'D#6': 1244.51, Eb6: 1244.51,
  E6: 1318.51,
  F6: 1396.91,
  'F#6': 1479.98, Gb6: 1479.98,
  G6: 1567.98,
}

// 音符名称列表 (用于查找最近音符)
const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
]

// 频率转换为音符名称
function frequencyToNote(frequency: number): { note: string; cents: number } {
  // 计算相对于 A4 (440Hz) 的半音数
  const semitonesFromA4 = 12 * Math.log2(frequency / 440)
  const roundedSemitones = Math.round(semitonesFromA4)
  const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100)

  // 计算音符名称和八度
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12 // A = 9
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4

  const noteName = NOTE_NAMES[noteIndex]
  return {
    note: `${noteName}${octave}`,
    cents
  }
}

// 比较两个音符是否匹配（考虑升降号等价）
function notesMatch(detected: string, target: string): boolean {
  // 直接匹配
  if (detected === target) return true

  // 处理等音 (enharmonic equivalents)
  const enharmonics: Record<string, string> = {
    'C#': 'Db', 'Db': 'C#',
    'D#': 'Eb', 'Eb': 'D#',
    'F#': 'Gb', 'Gb': 'F#',
    'G#': 'Ab', 'Ab': 'G#',
    'A#': 'Bb', 'Bb': 'A#',
  }

  const detectedBase = detected.slice(0, -1)
  const targetBase = target.slice(0, -1)
  const detectedOctave = detected.slice(-1)
  const targetOctave = target.slice(-1)

  if (detectedOctave !== targetOctave) return false

  return enharmonics[detectedBase] === targetBase
}

// 计算音分差距
function getCentsDifference(detectedFreq: number, targetNote: string): number {
  const targetFreq = NOTE_FREQUENCIES[targetNote]
  if (!targetFreq) return 0

  // 音分 = 1200 * log2(f1/f2)
  return Math.round(1200 * Math.log2(detectedFreq / targetFreq))
}

// 中值滤波器 - 去除异常值
function medianFilter(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// 指数移动平均
function exponentialMovingAverage(current: number, previous: number, alpha: number): number {
  return alpha * current + (1 - alpha) * previous
}

export interface PitchDetectionResult {
  isListening: boolean
  currentPitch: string | null
  frequency: number | null
  confidence: number
  cents: number // 相对于检测音符的偏差
  centsDiff: number // 相对于目标音符的偏差
  isCorrect: boolean
  error: string | null
  volume: number // 音量级别 0-1
  startListening: () => Promise<void>
  stopListening: () => void
  setTargetNote: (note: string) => void
}

// 配置参数
const CONFIG = {
  FFT_SIZE: 8192,              // 更大的 FFT 获得更好的低频分辨率
  MIN_CLARITY: 0.85,           // 置信度阈值 - pitchy的clarity范围是0-1
  MIN_VOLUME: 0.005,           // 最小音量阈值 (降低以检测更轻的声音)
  MIN_FREQUENCY: 180,          // 最小频率 (略低于G3=196Hz)
  MAX_FREQUENCY: 2000,         // 最大频率 (小提琴高把位)
  STABILITY_FRAMES: 3,         // 需要连续稳定的帧数
  STABILITY_TOLERANCE: 15,     // 稳定性容差（音分）
  SMOOTHING_ALPHA: 0.3,        // 平滑系数 (0-1, 越小越平滑)
  HISTORY_SIZE: 5,             // 历史记录大小（用于中值滤波）
}

export function usePitchDetection(): PitchDetectionResult {
  const [isListening, setIsListening] = useState(false)
  const [currentPitch, setCurrentPitch] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<number | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [cents, setCents] = useState(0)
  const [centsDiff, setCentsDiff] = useState(0)
  const [isCorrect, setIsCorrect] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)

  // 使用 ref 存储目标音符，避免闭包问题
  const targetNoteRef = useRef<string>('')

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null)
  const isListeningRef = useRef(false)

  // 高通滤波器 - 去除低频噪音
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null)

  // 音高稳定性检测
  const pitchHistoryRef = useRef<number[]>([])
  const stableCountRef = useRef(0)
  const lastStablePitchRef = useRef<number | null>(null)
  const smoothedFrequencyRef = useRef<number | null>(null)

  // 设置目标音符
  const setTargetNote = useCallback((note: string) => {
    targetNoteRef.current = note
  }, [])

  // 清理函数
  const cleanup = useCallback(() => {
    isListeningRef.current = false

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (highPassFilterRef.current) {
      highPassFilterRef.current.disconnect()
      highPassFilterRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    detectorRef.current = null
    pitchHistoryRef.current = []
    stableCountRef.current = 0
    lastStablePitchRef.current = null
    smoothedFrequencyRef.current = null
  }, [])

  // 停止监听
  const stopListening = useCallback(() => {
    cleanup()
    setIsListening(false)
    setCurrentPitch(null)
    setFrequency(null)
    setConfidence(0)
    setCents(0)
    setCentsDiff(0)
    setIsCorrect(false)
    setVolume(0)
  }, [cleanup])

  // 开始监听
  const startListening = useCallback(async () => {
    try {
      setError(null)

      // 如果已经在监听，先停止
      if (isListeningRef.current) {
        cleanup()
      }

      // 请求麦克风权限 - 优化音频输入设置
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,  // 关闭回声消除以获得原始信号
          noiseSuppression: false,  // 关闭噪音抑制
          autoGainControl: false,   // 关闭自动增益以保持一致的音量
          channelCount: 1,          // 单声道
          sampleRate: 48000,        // 高采样率
        }
      })

      streamRef.current = stream

      // 创建音频上下文
      const audioContext = new AudioContext({ sampleRate: 48000 })
      audioContextRef.current = audioContext

      // 确保音频上下文在运行状态
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // 创建高通滤波器 - 去除 150Hz 以下的低频噪音
      const highPassFilter = audioContext.createBiquadFilter()
      highPassFilter.type = 'highpass'
      highPassFilter.frequency.value = 150
      highPassFilter.Q.value = 0.7
      highPassFilterRef.current = highPassFilter

      // 创建分析器
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = CONFIG.FFT_SIZE
      analyser.smoothingTimeConstant = 0.0 // 关闭内置平滑，我们自己做
      analyserRef.current = analyser

      // 连接：麦克风 -> 高通滤波器 -> 分析器
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source
      source.connect(highPassFilter)
      highPassFilter.connect(analyser)

      // 创建音高检测器
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize)

      setIsListening(true)
      isListeningRef.current = true

      // 音高检测循环
      const detectPitch = () => {
        if (!analyserRef.current || !detectorRef.current || !audioContextRef.current || !isListeningRef.current) {
          return
        }

        const buffer = new Float32Array(analyserRef.current.fftSize)
        analyserRef.current.getFloatTimeDomainData(buffer)

        // 计算 RMS 音量
        let sumSquares = 0
        for (let i = 0; i < buffer.length; i++) {
          sumSquares += buffer[i] * buffer[i]
        }
        const rms = Math.sqrt(sumSquares / buffer.length)
        setVolume(Math.min(1, rms * 10)) // 归一化音量显示

        // 使用 pitchy 检测音高
        const [pitch, clarity] = detectorRef.current.findPitch(
          buffer,
          audioContextRef.current.sampleRate
        )

        // 检查是否有有效信号
        const hasValidSignal =
          rms > CONFIG.MIN_VOLUME &&
          clarity > CONFIG.MIN_CLARITY &&
          pitch > CONFIG.MIN_FREQUENCY &&
          pitch < CONFIG.MAX_FREQUENCY

        if (hasValidSignal) {
          // 添加到历史记录
          pitchHistoryRef.current.push(pitch)
          if (pitchHistoryRef.current.length > CONFIG.HISTORY_SIZE) {
            pitchHistoryRef.current.shift()
          }

          // 使用中值滤波去除异常值
          const filteredPitch = medianFilter(pitchHistoryRef.current)

          // 检查音高稳定性
          if (lastStablePitchRef.current !== null) {
            const centsDiff = Math.abs(1200 * Math.log2(filteredPitch / lastStablePitchRef.current))
            if (centsDiff < CONFIG.STABILITY_TOLERANCE) {
              stableCountRef.current++
            } else {
              stableCountRef.current = 1
              lastStablePitchRef.current = filteredPitch
            }
          } else {
            stableCountRef.current = 1
            lastStablePitchRef.current = filteredPitch
          }

          // 只有当音高稳定时才更新显示
          if (stableCountRef.current >= CONFIG.STABILITY_FRAMES) {
            // 应用指数移动平均平滑
            if (smoothedFrequencyRef.current === null) {
              smoothedFrequencyRef.current = filteredPitch
            } else {
              smoothedFrequencyRef.current = exponentialMovingAverage(
                filteredPitch,
                smoothedFrequencyRef.current,
                CONFIG.SMOOTHING_ALPHA
              )
            }

            const smoothedPitch = smoothedFrequencyRef.current
            const { note, cents: detectedCents } = frequencyToNote(smoothedPitch)

            setFrequency(Math.round(smoothedPitch * 10) / 10)
            setCurrentPitch(note)
            setConfidence(Math.round(clarity * 100) / 100)
            setCents(detectedCents)

            // 使用 ref 获取最新的目标音符
            const currentTargetNote = targetNoteRef.current
            if (currentTargetNote) {
              const diff = getCentsDifference(smoothedPitch, currentTargetNote)
              setCentsDiff(diff)

              // 判断是否正确 (±40 cents 容差)
              const isMatch = notesMatch(note, currentTargetNote) && Math.abs(detectedCents) <= 40
              setIsCorrect(isMatch)
            }
          }
        } else {
          // 信号太弱或不可靠 - 重置稳定性计数器但不立即清除显示
          if (rms < CONFIG.MIN_VOLUME * 0.5) {
            // 音量非常低时才清除
            setFrequency(null)
            setCurrentPitch(null)
            setCents(0)
            setCentsDiff(0)
            setIsCorrect(false)
            pitchHistoryRef.current = []
            stableCountRef.current = 0
            lastStablePitchRef.current = null
            smoothedFrequencyRef.current = null
          }
          setConfidence(Math.round(clarity * 100) / 100)
        }

        animationFrameRef.current = requestAnimationFrame(detectPitch)
      }

      detectPitch()

    } catch (err) {
      console.error('Pitch detection error:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('请允许麦克风访问权限')
        } else if (err.name === 'NotFoundError') {
          setError('未找到麦克风设备')
        } else {
          setError(`麦克风初始化失败: ${err.message}`)
        }
      }
      cleanup()
    }
  }, [cleanup])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isListening,
    currentPitch,
    frequency,
    confidence,
    cents,
    centsDiff,
    isCorrect,
    error,
    volume,
    startListening,
    stopListening,
    setTargetNote,
  }
}
