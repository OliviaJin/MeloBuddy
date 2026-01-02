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

export interface PitchDetectionResult {
  isListening: boolean
  currentPitch: string | null
  frequency: number | null
  confidence: number
  cents: number // 相对于检测音符的偏差
  centsDiff: number // 相对于目标音符的偏差
  isCorrect: boolean
  error: string | null
  startListening: () => Promise<void>
  stopListening: () => void
  setTargetNote: (note: string) => void
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
  const [targetNote, setTargetNote] = useState<string>('')

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null)

  // 清理函数
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
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
  }, [cleanup])

  // 开始监听
  const startListening = useCallback(async () => {
    try {
      setError(null)

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })

      streamRef.current = stream

      // 创建音频上下文
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // 创建分析器
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 4096 // 更大的 FFT 可以获得更好的低频分辨率
      analyserRef.current = analyser

      // 连接麦克风到分析器
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source
      source.connect(analyser)

      // 创建音高检测器
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize)

      setIsListening(true)

      // 音高检测循环
      const detectPitch = () => {
        if (!analyserRef.current || !detectorRef.current || !audioContextRef.current) {
          return
        }

        const buffer = new Float32Array(analyserRef.current.fftSize)
        analyserRef.current.getFloatTimeDomainData(buffer)

        const [pitch, clarity] = detectorRef.current.findPitch(
          buffer,
          audioContextRef.current.sampleRate
        )

        // 只在有足够置信度时更新
        if (clarity > 0.85 && pitch > 150 && pitch < 2000) {
          const { note, cents: detectedCents } = frequencyToNote(pitch)

          setFrequency(Math.round(pitch * 10) / 10)
          setCurrentPitch(note)
          setConfidence(Math.round(clarity * 100) / 100)
          setCents(detectedCents)

          // 如果有目标音符，计算差距
          if (targetNote) {
            const diff = getCentsDifference(pitch, targetNote)
            setCentsDiff(diff)

            // 判断是否正确 (±30 cents 容差)
            const isMatch = notesMatch(note, targetNote) && Math.abs(detectedCents) <= 30
            setIsCorrect(isMatch)
          }
        } else {
          // 信号太弱或不可靠
          setFrequency(null)
          setCurrentPitch(null)
          setConfidence(clarity)
          setCents(0)
          setCentsDiff(0)
          setIsCorrect(false)
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
          setError('麦克风初始化失败')
        }
      }
      cleanup()
    }
  }, [cleanup, targetNote])

  // 更新目标音符时重新计算
  useEffect(() => {
    if (frequency && targetNote) {
      const diff = getCentsDifference(frequency, targetNote)
      setCentsDiff(diff)

      if (currentPitch) {
        const isMatch = notesMatch(currentPitch, targetNote) && Math.abs(cents) <= 30
        setIsCorrect(isMatch)
      }
    }
  }, [targetNote, frequency, currentPitch, cents])

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
    startListening,
    stopListening,
    setTargetNote,
  }
}
