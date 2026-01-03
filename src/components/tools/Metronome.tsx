'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Minus, Plus, ChevronDown } from 'lucide-react'

// ===================
// 类型定义
// ===================

type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8'

interface MetronomeProps {
  /** 初始 BPM */
  initialBpm?: number
  /** 初始拍号 */
  initialTimeSignature?: TimeSignature
  /** 是否显示为紧凑模式（嵌入练习页面时） */
  compact?: boolean
  /** BPM 变化回调 */
  onBpmChange?: (bpm: number) => void
  /** 播放状态变化回调 */
  onPlayingChange?: (playing: boolean) => void
}

// ===================
// 常量
// ===================

const MIN_BPM = 40
const MAX_BPM = 208

const TIME_SIGNATURES: { value: TimeSignature; beats: number; label: string }[] = [
  { value: '2/4', beats: 2, label: '2/4' },
  { value: '3/4', beats: 3, label: '3/4' },
  { value: '4/4', beats: 4, label: '4/4' },
  { value: '6/8', beats: 6, label: '6/8' },
]

// 速度术语映射
function getTempoTerm(bpm: number): string {
  if (bpm < 50) return 'Grave'
  if (bpm < 60) return 'Largo'
  if (bpm < 66) return 'Larghetto'
  if (bpm < 76) return 'Adagio'
  if (bpm < 92) return 'Andante'
  if (bpm < 108) return 'Moderato'
  if (bpm < 120) return 'Allegretto'
  if (bpm < 156) return 'Allegro'
  if (bpm < 176) return 'Vivace'
  if (bpm < 200) return 'Presto'
  return 'Prestissimo'
}

// ===================
// 节拍器组件
// ===================

export default function Metronome({
  initialBpm = 80,
  initialTimeSignature = '4/4',
  compact = false,
  onBpmChange,
  onPlayingChange,
}: MetronomeProps) {
  // 状态
  const [bpm, setBpm] = useState(initialBpm)
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(initialTimeSignature)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [showTimeSignatureMenu, setShowTimeSignatureMenu] = useState(false)

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const nextBeatTimeRef = useRef(0)
  const timerIdRef = useRef<number | null>(null)
  const currentBeatRef = useRef(0)

  // 获取当前拍号的拍数
  const beatsPerMeasure = TIME_SIGNATURES.find(ts => ts.value === timeSignature)?.beats || 4

  // ===================
  // Web Audio API 音频生成
  // ===================

  const createClick = useCallback((time: number, isAccent: boolean) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current

    // 创建振荡器
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // 重拍: 高音 (1000Hz), 弱拍: 低音 (800Hz)
    osc.frequency.value = isAccent ? 1000 : 800
    osc.type = 'sine'

    // 音量包络
    gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    // 连接并播放
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.05)
  }, [])

  // ===================
  // 调度器 - 使用 lookahead 实现精确计时
  // ===================

  const scheduleBeats = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return

    const ctx = audioContextRef.current
    const secondsPerBeat = 60.0 / bpm
    const lookahead = 0.1 // 提前调度 100ms

    // 调度接下来的节拍
    while (nextBeatTimeRef.current < ctx.currentTime + lookahead) {
      const beatInMeasure = currentBeatRef.current % beatsPerMeasure
      const isAccent = beatInMeasure === 0

      // 调度音频
      createClick(nextBeatTimeRef.current, isAccent)

      // 更新视觉反馈（使用 setTimeout 同步）
      const timeUntilBeat = (nextBeatTimeRef.current - ctx.currentTime) * 1000
      setTimeout(() => {
        setCurrentBeat(currentBeatRef.current % beatsPerMeasure)
        currentBeatRef.current++
      }, Math.max(0, timeUntilBeat))

      // 下一拍时间
      nextBeatTimeRef.current += secondsPerBeat
    }

    // 继续调度
    timerIdRef.current = requestAnimationFrame(scheduleBeats)
  }, [bpm, beatsPerMeasure, isPlaying, createClick])

  // ===================
  // 播放控制
  // ===================

  const start = useCallback(() => {
    // 创建或恢复 AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    // 重置状态
    currentBeatRef.current = 0
    setCurrentBeat(0)
    nextBeatTimeRef.current = audioContextRef.current.currentTime + 0.05

    setIsPlaying(true)
    onPlayingChange?.(true)
  }, [onPlayingChange])

  const stop = useCallback(() => {
    if (timerIdRef.current) {
      cancelAnimationFrame(timerIdRef.current)
      timerIdRef.current = null
    }

    setIsPlaying(false)
    setCurrentBeat(0)
    currentBeatRef.current = 0
    onPlayingChange?.(false)
  }, [onPlayingChange])

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop()
    } else {
      start()
    }
  }, [isPlaying, start, stop])

  // 播放时启动调度器
  useEffect(() => {
    if (isPlaying) {
      scheduleBeats()
    }

    return () => {
      if (timerIdRef.current) {
        cancelAnimationFrame(timerIdRef.current)
      }
    }
  }, [isPlaying, scheduleBeats])

  // 清理 AudioContext
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // ===================
  // BPM 控制
  // ===================

  const adjustBpm = useCallback((delta: number) => {
    setBpm(prev => {
      const newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, prev + delta))
      onBpmChange?.(newBpm)
      return newBpm
    })
  }, [onBpmChange])

  const handleBpmSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10)
    setBpm(newBpm)
    onBpmChange?.(newBpm)
  }, [onBpmChange])

  // ===================
  // 渲染
  // ===================

  // 紧凑模式（嵌入练习页面）
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-xl px-4 py-2 shadow-sm">
        {/* BPM 显示 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustBpm(-5)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-bold text-gray-800 w-12 text-center">
            {bpm}
          </span>
          <button
            onClick={() => adjustBpm(5)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 节拍指示 */}
        <div className="flex gap-1">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${
                isPlaying && currentBeat === i
                  ? i === 0
                    ? 'bg-primary-500'
                    : 'bg-secondary-400'
                  : 'bg-gray-200'
              }`}
              animate={
                isPlaying && currentBeat === i
                  ? { scale: [1, 1.5, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>

        {/* 播放按钮 */}
        <button
          onClick={toggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-primary-500 hover:bg-primary-600'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" fill="white" />
          ) : (
            <Play className="w-4 h-4 text-white" fill="white" />
          )}
        </button>
      </div>
    )
  }

  // 完整模式（独立使用）
  return (
    <div className="bg-white rounded-2xl shadow-cute p-6 max-w-sm mx-auto">
      {/* 标题 */}
      <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
        节拍器
      </h2>

      {/* BPM 显示 */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl">♩</span>
          <span className="text-4xl font-bold text-gray-800">= {bpm}</span>
        </div>
        <span className="text-sm text-gray-500">{getTempoTerm(bpm)}</span>
      </div>

      {/* BPM 滑块 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => adjustBpm(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors btn-press"
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 relative">
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={handleBpmSliderChange}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-primary-500
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110"
          />
        </div>

        <button
          onClick={() => adjustBpm(1)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors btn-press"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 节拍可视化 */}
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              isPlaying && currentBeat === i
                ? i === 0
                  ? 'bg-primary-500 shadow-lg shadow-primary-500/50'
                  : 'bg-secondary-400 shadow-lg shadow-secondary-400/50'
                : 'bg-gray-200'
            }`}
            animate={
              isPlaying && currentBeat === i
                ? { scale: [1, 1.4, 1], opacity: [1, 1, 0.7] }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      {/* 拍号选择 */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-sm text-gray-600">拍号:</span>
        <div className="relative">
          <button
            onClick={() => setShowTimeSignatureMenu(!showTimeSignatureMenu)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="font-bold text-gray-800">{timeSignature}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showTimeSignatureMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showTimeSignatureMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
              >
                {TIME_SIGNATURES.map(ts => (
                  <button
                    key={ts.value}
                    onClick={() => {
                      setTimeSignature(ts.value)
                      setShowTimeSignatureMenu(false)
                      if (isPlaying) {
                        stop()
                        setTimeout(start, 100)
                      }
                    }}
                    className={`block w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                      timeSignature === ts.value
                        ? 'bg-primary-50 text-primary-600 font-bold'
                        : 'text-gray-700'
                    }`}
                  >
                    {ts.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 播放按钮 */}
      <button
        onClick={toggle}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all btn-press ${
          isPlaying
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-primary hover:shadow-lg'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" fill="white" />
              停止
            </>
          ) : (
            <>
              <Play className="w-5 h-5" fill="white" />
              开始
            </>
          )}
        </span>
      </button>

      {/* 快捷 BPM 按钮 */}
      <div className="flex justify-center gap-2 mt-4">
        {[60, 80, 100, 120].map(preset => (
          <button
            key={preset}
            onClick={() => {
              setBpm(preset)
              onBpmChange?.(preset)
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              bpm === preset
                ? 'bg-primary-100 text-primary-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  )
}

// 导出类型
export type { MetronomeProps, TimeSignature }
