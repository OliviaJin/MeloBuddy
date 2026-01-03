'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { usePitchDetection } from '@/hooks/usePitchDetection'

// ===================
// 小提琴弦的标准音高
// ===================

interface ViolinString {
  name: string
  note: string
  frequency: number
  color: string
}

const VIOLIN_STRINGS: ViolinString[] = [
  { name: 'G', note: 'G3', frequency: 196.00, color: 'from-yellow-400 to-yellow-500' },
  { name: 'D', note: 'D4', frequency: 293.66, color: 'from-green-400 to-green-500' },
  { name: 'A', note: 'A4', frequency: 440.00, color: 'from-blue-400 to-blue-500' },
  { name: 'E', note: 'E5', frequency: 659.25, color: 'from-pink-400 to-pink-500' },
]

// 找到最接近的弦
function findNearestString(frequency: number): ViolinString {
  let nearest = VIOLIN_STRINGS[0]
  let minDiff = Infinity

  for (const string of VIOLIN_STRINGS) {
    // 使用音分差来比较，而不是绝对频率差
    const cents = Math.abs(1200 * Math.log2(frequency / string.frequency))
    if (cents < minDiff) {
      minDiff = cents
      nearest = string
    }
  }

  return nearest
}

// 计算音分偏差
function getCentsFromTarget(detected: number, target: number): number {
  return Math.round(1200 * Math.log2(detected / target))
}

// 获取偏差状态文本
function getDeviationText(cents: number): { text: string; color: string } {
  const absCents = Math.abs(cents)

  if (absCents <= 5) {
    return { text: '准', color: 'text-green-500' }
  } else if (absCents <= 15) {
    return { text: cents > 0 ? '略高' : '略低', color: 'text-yellow-500' }
  } else if (absCents <= 30) {
    return { text: cents > 0 ? '偏高' : '偏低', color: 'text-orange-500' }
  } else {
    return { text: cents > 0 ? '太高' : '太低', color: 'text-red-500' }
  }
}

// ===================
// 调音器组件
// ===================

interface TunerProps {
  /** 是否显示为紧凑模式 */
  compact?: boolean
}

export default function Tuner({ compact = false }: TunerProps) {
  // 音高检测
  const {
    isListening,
    frequency,
    confidence,
    error,
    volume,
    startListening,
    stopListening,
  } = usePitchDetection()

  // 当前选中的弦（用于播放参考音）
  const [selectedString, setSelectedString] = useState<ViolinString | null>(null)
  const [isPlayingRef, setIsPlayingRef] = useState(false)

  // 音频相关
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // 计算当前状态
  const nearestString = frequency ? findNearestString(frequency) : null
  const cents = frequency && nearestString
    ? getCentsFromTarget(frequency, nearestString.frequency)
    : 0
  const deviation = getDeviationText(cents)

  // ===================
  // 播放参考音
  // ===================

  const playReferenceNote = useCallback((string: ViolinString) => {
    // 停止之前的音
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current = null
    }

    // 创建或复用 AudioContext
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
    }

    const ctx = audioContextRef.current

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // 创建振荡器（锯齿波更接近弦乐）
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = string.frequency

    // 创建增益节点
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 1.5)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2)

    // 连接
    osc.connect(gain)
    gain.connect(ctx.destination)

    oscillatorRef.current = osc
    gainRef.current = gain

    // 播放
    osc.start()
    osc.stop(ctx.currentTime + 2)

    setSelectedString(string)
    setIsPlayingRef(true)

    // 播放结束后重置状态
    setTimeout(() => {
      setIsPlayingRef(false)
      setSelectedString(null)
    }, 2000)
  }, [])

  // 停止参考音
  const stopReferenceNote = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current = null
    }
    setIsPlayingRef(false)
    setSelectedString(null)
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // 切换检测状态
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // ===================
  // 渲染
  // ===================

  // 紧凑模式
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-xl px-4 py-2 shadow-sm">
        {/* 检测状态指示 */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4 text-white" />
            )}
          </button>

          {/* 当前检测音高 */}
          {isListening && nearestString && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">{nearestString.name}</span>
              <span className={`text-sm font-medium ${deviation.color}`}>
                {deviation.text}
              </span>
            </div>
          )}
        </div>

        {/* 弦按钮 */}
        <div className="flex gap-1">
          {VIOLIN_STRINGS.map(string => (
            <button
              key={string.name}
              onClick={() => playReferenceNote(string)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                selectedString?.name === string.name
                  ? `bg-gradient-to-br ${string.color} text-white scale-110`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {string.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 完整模式
  return (
    <div className="bg-white rounded-2xl shadow-cute p-6 max-w-sm mx-auto">
      {/* 标题 */}
      <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
        调音器
      </h2>

      {/* 音量指示器 */}
      {isListening && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">音量</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                volume > 0.5 ? 'bg-green-500' : volume > 0.2 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              animate={{ width: `${Math.min(100, volume * 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          {volume < 0.1 && (
            <p className="text-xs text-orange-500 mt-1">音量太低，请靠近麦克风</p>
          )}
        </div>
      )}

      {/* 偏差指示器 */}
      <div className="mb-6">
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
          {/* 刻度 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-full bg-green-400" />
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <span className="text-xs text-gray-400">低</span>
            <span className="text-xs text-gray-400">高</span>
          </div>

          {/* 指示器 */}
          {isListening && frequency && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full shadow-lg"
              animate={{
                left: `calc(50% + ${Math.max(-45, Math.min(45, cents))}%)`,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </div>

        {/* 偏差状态 */}
        <div className="text-center mt-3">
          {isListening ? (
            frequency ? (
              <motion.span
                key={deviation.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-2xl font-bold ${deviation.color}`}
              >
                {deviation.text}
              </motion.span>
            ) : (
              <span className="text-gray-400">等待声音...</span>
            )
          ) : (
            <span className="text-gray-400">点击下方开始检测</span>
          )}
        </div>
      </div>

      {/* 检测到的弦 */}
      <div className="text-center mb-6">
        <AnimatePresence mode="wait">
          {isListening && nearestString ? (
            <motion.div
              key={nearestString.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${nearestString.color} shadow-lg mb-2`}
              >
                <span className="text-4xl font-bold text-white">
                  {nearestString.name}
                </span>
              </div>
              <div className="text-lg font-medium text-gray-600">
                {frequency?.toFixed(1)} Hz
              </div>
              {confidence > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  置信度: {Math.round(confidence * 100)}%
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <Mic className="w-8 h-8 text-gray-300" />
              </div>
              <div className="text-gray-400">-</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
          {error}
        </div>
      )}

      {/* 弦选择按钮 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {VIOLIN_STRINGS.map(string => (
          <button
            key={string.name}
            onClick={() => playReferenceNote(string)}
            className={`relative flex flex-col items-center py-3 rounded-xl transition-all btn-press ${
              selectedString?.name === string.name
                ? `bg-gradient-to-br ${string.color} text-white shadow-lg scale-105`
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-xl font-bold">{string.name}</span>
            <span className={`text-xs ${
              selectedString?.name === string.name ? 'text-white/80' : 'text-gray-400'
            }`}>
              {Math.round(string.frequency)}
            </span>
            {selectedString?.name === string.name && isPlayingRef && (
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Volume2 className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </button>
        ))}
      </div>

      {/* 开始/停止检测按钮 */}
      <button
        onClick={toggleListening}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all btn-press ${
          isListening
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-primary hover:shadow-lg'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              停止检测
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              开始检测
            </>
          )}
        </span>
      </button>

      {/* 提示 */}
      <p className="text-xs text-gray-400 text-center mt-4">
        点击弦名播放标准音作为参考
      </p>
    </div>
  )
}

// 导出类型
export type { TunerProps }
