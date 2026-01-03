'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Play,
  Square,
  RotateCcw,
  Mic,
  MessageCircle,
  X,
  Timer,
  Target,
  Music,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { initAudio } from '@/lib/audio'
import { usePitchDetection } from '@/hooks'
import { SheetMusicDisplay } from '@/components/sheet'
import { loadMusicXML, addDefaultFingerings } from '@/lib/musicxml-parser'
import AIChatPage from '@/app/ai-chat/page'
import type { AssessModeProps } from '@/types'
import type { ParsedNote, ParsedSong } from '@/types'

// 评测状态
type AssessState = 'ready' | 'recording' | 'finished'

// 错误类型
interface NoteError {
  noteIndex: number
  expected: string
  actual: string
  type: 'pitch' | 'rhythm' | 'missed'
  timestamp: number
}

// 评测维度得分
interface AssessmentDimensions {
  pitch: number      // 音准得分
  rhythm: number     // 节奏得分
  tempo: number      // 速度稳定性
  fluency: number    // 流畅度
  completeness: number // 完整性
}

// 评测详细数据
interface AssessmentData {
  songId: string
  duration: number
  score: number
  dimensions: AssessmentDimensions
  errors: NoteError[]
  timestamp: Date
  totalNotes: number
  correctNotes: number
  maxCombo: number
}

// 格式化时间
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 计算维度得分
function calculateDimensions(
  correctNotes: number,
  totalNotes: number,
  errors: NoteError[],
  duration: number,
  expectedDuration: number,
  maxCombo: number
): AssessmentDimensions {
  // 音准得分：正确音符 / 总音符
  const pitchErrors = errors.filter(e => e.type === 'pitch').length
  const pitch = Math.max(0, Math.round(((totalNotes - pitchErrors) / totalNotes) * 100))

  // 节奏得分：基于节奏错误
  const rhythmErrors = errors.filter(e => e.type === 'rhythm').length
  const rhythm = Math.max(0, Math.round(((totalNotes - rhythmErrors) / totalNotes) * 100))

  // 速度稳定性：实际时长与预期时长的接近程度
  const tempoRatio = duration / (expectedDuration * 1000)
  const tempo = Math.max(0, Math.round((1 - Math.abs(1 - tempoRatio)) * 100))

  // 流畅度：基于最大连击和跳过次数
  const missedErrors = errors.filter(e => e.type === 'missed').length
  const fluency = Math.max(0, Math.round((maxCombo / totalNotes) * 50 + ((totalNotes - missedErrors) / totalNotes) * 50))

  // 完整性：完成的音符比例
  const completeness = Math.round((correctNotes / totalNotes) * 100)

  return { pitch, rhythm, tempo, fluency, completeness }
}

export function AssessMode({ song, onComplete, onBack }: AssessModeProps) {
  const { language } = useLanguageStore()

  // 解析后的音符和歌曲信息
  const [parsedSong, setParsedSong] = useState<ParsedSong | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 评测状态
  const [assessState, setAssessState] = useState<AssessState>('ready')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set())
  const [correctNotes, setCorrectNotes] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [currentCombo, setCurrentCombo] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [errors, setErrors] = useState<NoteError[]>([])

  // 节奏检测
  const [noteStartTime, setNoteStartTime] = useState<number | null>(null)
  const lastNoteTimeRef = useRef<number>(0)

  // AI 聊天弹窗状态
  const [showAIChat, setShowAIChat] = useState(false)

  // 音高检测
  const {
    isListening,
    currentPitch,
    frequency,
    confidence,
    centsDiff,
    isCorrect,
    error: micError,
    startListening,
    stopListening,
    setTargetNote,
  } = usePitchDetection()

  // 计时器和检测定时器
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const correctTimerRef = useRef<NodeJS.Timeout | null>(null)
  const REQUIRED_CORRECT_TIME = 300 // 需要持续正确的时间（毫秒）

  // 初始化音频
  useEffect(() => {
    initAudio()
  }, [])

  // 加载 MusicXML
  useEffect(() => {
    const musicXmlUrl = (song as { musicXmlUrl?: string }).musicXmlUrl
    if (!musicXmlUrl) {
      // 如果没有 MusicXML，使用旧数据
      setIsLoading(false)
      return
    }

    const loadSong = async () => {
      try {
        setIsLoading(true)
        const parsed = await loadMusicXML(musicXmlUrl)
        const withFingerings = addDefaultFingerings(parsed)
        setParsedSong(withFingerings)
        setLoadError(null)
      } catch (err) {
        console.error('Load MusicXML error:', err)
        setLoadError(err instanceof Error ? err.message : '加载乐谱失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadSong()
  }, [song])

  // 获取当前使用的音符数组
  const notes = useMemo(() => {
    if (parsedSong) return parsedSong.notes
    if (song.notes) return song.notes
    return []
  }, [parsedSong, song.notes])

  const totalNotes = notes.length

  // 更新目标音符
  useEffect(() => {
    if (currentIndex < notes.length) {
      const note = notes[currentIndex]
      setTargetNote(note.pitch)
      setNoteStartTime(Date.now())
    }
  }, [currentIndex, notes, setTargetNote])

  // 计时
  useEffect(() => {
    if (assessState === 'recording' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [assessState, startTime])

  // 处理音符完成
  const handleNoteComplete = useCallback((correct: boolean) => {
    if (currentIndex >= notes.length) return

    const now = Date.now()
    const currentNote = notes[currentIndex]

    if (correct) {
      // 正确音符
      setCompletedIndices(prev => new Set(prev).add(currentIndex))
      setCorrectNotes(prev => prev + 1)

      // 检查节奏（是否在合理时间内）
      const timeSinceLastNote = now - lastNoteTimeRef.current
      const expectedDuration = currentNote.duration * (60 / (parsedSong?.tempo || 120)) * 1000
      const rhythmTolerance = expectedDuration * 0.5 // 50% 容差

      if (lastNoteTimeRef.current > 0 && Math.abs(timeSinceLastNote - expectedDuration) > rhythmTolerance) {
        // 节奏错误
        setErrors(prev => [...prev, {
          noteIndex: currentIndex,
          expected: currentNote.pitch,
          actual: currentPitch || '',
          type: 'rhythm',
          timestamp: now,
        }])
      }

      // 更新连击
      const newCombo = currentCombo + 1
      setCurrentCombo(newCombo)
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo)
      }
    } else {
      // 错误/跳过
      setErrorIndices(prev => new Set(prev).add(currentIndex))
      setCurrentCombo(0)

      setErrors(prev => [...prev, {
        noteIndex: currentIndex,
        expected: currentNote.pitch,
        actual: currentPitch || 'missed',
        type: currentPitch ? 'pitch' : 'missed',
        timestamp: now,
      }])
    }

    lastNoteTimeRef.current = now

    // 下一个音符或完成
    if (currentIndex < notes.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      finishAssessment()
    }
  }, [currentIndex, notes, currentPitch, currentCombo, maxCombo, parsedSong])

  // 音高正确时自动确认
  useEffect(() => {
    if (isListening && isCorrect && assessState === 'recording') {
      if (!correctTimerRef.current) {
        const startTimeRef = Date.now()
        const checkTimer = () => {
          const elapsed = Date.now() - startTimeRef
          if (elapsed >= REQUIRED_CORRECT_TIME) {
            handleNoteComplete(true)
            correctTimerRef.current = null
          } else {
            correctTimerRef.current = setTimeout(checkTimer, 50)
          }
        }
        correctTimerRef.current = setTimeout(checkTimer, 50)
      }
    } else {
      if (correctTimerRef.current) {
        clearTimeout(correctTimerRef.current)
        correctTimerRef.current = null
      }
    }

    return () => {
      if (correctTimerRef.current) {
        clearTimeout(correctTimerRef.current)
      }
    }
  }, [isListening, isCorrect, assessState, handleNoteComplete])

  // 开始评测
  const startAssessment = useCallback(async () => {
    setAssessState('recording')
    setStartTime(Date.now())
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setErrorIndices(new Set())
    setCorrectNotes(0)
    setCurrentCombo(0)
    setMaxCombo(0)
    setElapsedTime(0)
    setErrors([])
    lastNoteTimeRef.current = 0
    await startListening()
  }, [startListening])

  // 结束评测
  const finishAssessment = useCallback(() => {
    stopListening()
    setAssessState('finished')

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const duration = startTime ? Date.now() - startTime : 0
    const expectedDuration = song.duration || 60

    // 计算维度得分
    const dimensions = calculateDimensions(
      correctNotes,
      totalNotes,
      errors,
      duration,
      expectedDuration,
      maxCombo
    )

    // 综合得分（各维度加权平均）
    const score = Math.round(
      dimensions.pitch * 0.35 +
      dimensions.rhythm * 0.25 +
      dimensions.tempo * 0.15 +
      dimensions.fluency * 0.15 +
      dimensions.completeness * 0.1
    )

    let stars = 0
    if (score >= 95) stars = 3
    else if (score >= 80) stars = 2
    else if (score >= 60) stars = 1

    // 评测模式给更多XP
    const xpEarned = Math.round(score * 0.8) + (stars * 20) + (maxCombo >= 10 ? 15 : maxCombo >= 5 ? 10 : 0)

    // 保存评测数据
    const assessmentData: AssessmentData = {
      songId: song.id,
      duration,
      score,
      dimensions,
      errors,
      timestamp: new Date(),
      totalNotes,
      correctNotes,
      maxCombo,
    }

    // 可以保存到 localStorage 或发送到服务器
    console.log('Assessment data:', assessmentData)

    onComplete({
      score,
      stars,
      xpEarned,
      totalNotes,
      completedNotes: correctNotes,
      skippedNotes: totalNotes - correctNotes,
      maxCombo,
      duration,
      accuracy: dimensions.pitch,
    })
  }, [song, correctNotes, totalNotes, maxCombo, startTime, errors, stopListening, onComplete])

  // 跳过当前音符
  const skipNote = useCallback(() => {
    handleNoteComplete(false)
  }, [handleNoteComplete])

  // 重新开始
  const handleRestart = useCallback(() => {
    stopListening()
    if (timerRef.current) clearInterval(timerRef.current)
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current)
    setAssessState('ready')
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setErrorIndices(new Set())
    setCorrectNotes(0)
    setCurrentCombo(0)
    setMaxCombo(0)
    setStartTime(null)
    setElapsedTime(0)
    setErrors([])
  }, [stopListening])

  // 当前音符
  const currentNote = notes[currentIndex]

  // 计算进度百分比
  const progress = totalNotes > 0 ? (currentIndex / totalNotes) * 100 : 0

  // 实时准确率
  const liveAccuracy = currentIndex > 0 ? Math.round((correctNotes / currentIndex) * 100) : 0

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <Loader2 className="w-12 h-12 text-primary-500" />
          </motion.div>
          <p className="mt-4 text-gray-500">{t('practice.loadingSheet', language)}</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium mb-2">{t('practice.loadFailed', language)}</p>
          <p className="text-gray-500 text-sm">{loadError}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium"
          >
            {t('common.back', language)}
          </button>
        </div>
      </div>
    )
  }

  const musicXmlUrl = (song as { musicXmlUrl?: string }).musicXmlUrl

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <h1 className="font-medium text-gray-800">{t('practice.mode.assess', language)}</h1>

          <div className="flex items-center gap-2">
            {assessState === 'recording' ? (
              <motion.div
                className="flex items-center gap-1 text-red-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <Timer className="w-4 h-4" />
                <span className="text-sm font-mono font-medium">{formatTime(elapsedTime)}</span>
              </motion.div>
            ) : (
              <span className="text-sm text-gray-400">{t('practice.waitingStart', language)}</span>
            )}
          </div>
        </div>
      </header>

      <main className="pb-48">
        {/* 准备状态 */}
        {assessState === 'ready' && (
          <section className="px-4 py-6">
            <motion.div
              className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-8 text-white text-center shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-xl font-bold mb-2">{t('practice.mode.assess', language)}</h2>
              <p className="text-white/80 text-sm mb-6">
                {t('practice.mode.assess.desc', language)}
              </p>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-white/70 text-xs mb-2">{totalNotes} {t('practice.notes', language)}</p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${star <= song.difficulty ? 'opacity-100' : 'opacity-30'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <motion.button
                onClick={startAssessment}
                className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mic className="w-6 h-6" />
                {t('practice.startMode', language)}
              </motion.button>
            </motion.div>
          </section>
        )}

        {/* 录制状态 */}
        {assessState === 'recording' && (
          <>
            {/* 进度条 */}
            <section className="px-4 py-3 bg-white border-b border-gray-100">
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{currentIndex + 1} / {totalNotes}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </section>

            {/* 乐谱显示 */}
            <section className="px-4 py-4">
              {musicXmlUrl ? (
                <SheetMusicDisplay
                  musicXmlUrl={musicXmlUrl}
                  currentNoteIndex={currentIndex}
                  showCursor={true}
                  zoom={1.0}
                  highlightColor={isCorrect ? '#22C55E' : errorIndices.has(currentIndex) ? '#EF4444' : '#8B5CF6'}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-cute p-6 text-center text-gray-500">
                  <Music className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{t('practice.noSheetMusic', language)}</p>
                </div>
              )}
            </section>

            {/* 实时检测显示 */}
            <section className="px-4 py-2">
              <motion.div
                className="bg-white rounded-xl shadow-cute p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {t('practice.detecting', language)}
                    </span>
                  </div>
                  {micError && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {micError}
                    </span>
                  )}
                </div>

                {/* 检测结果 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{t('practice.detected', language) || '检测到'}</p>
                    <p className={`text-2xl font-bold ${currentPitch ? (isCorrect ? 'text-green-600' : 'text-red-500') : 'text-gray-300'}`}>
                      {currentPitch || '--'}
                    </p>
                    {frequency && (
                      <p className="text-xs text-gray-400 mt-1">{frequency} Hz</p>
                    )}
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{t('practice.target', language) || '目标'}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {currentNote?.pitch || '--'}
                    </p>
                    {isCorrect && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-1"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 音准偏差指示器 */}
                {currentPitch && (
                  <div className="mt-3">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span>{t('practice.tooLow', language)}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
                        <motion.div
                          className={`absolute top-0 h-full w-3 rounded-full ${
                            Math.abs(centsDiff) <= 35 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            left: `${Math.max(0, Math.min(100, 50 + centsDiff / 2))}%`,
                            transform: 'translateX(-50%)',
                          }}
                        />
                        {/* 中心标记 */}
                        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400 transform -translate-x-1/2" />
                      </div>
                      <span>{t('practice.tooHigh', language)}</span>
                    </div>
                  </div>
                )}

                {/* 实时统计 */}
                <div className="mt-4 flex justify-around text-center">
                  <div>
                    <p className="text-xs text-gray-500">{t('practice.accuracy', language)}</p>
                    <p className={`text-lg font-bold ${liveAccuracy >= 80 ? 'text-green-600' : liveAccuracy >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {liveAccuracy}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('practice.combo', language)}</p>
                    <p className="text-lg font-bold text-orange-500">x{currentCombo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('practice.notes', language)}</p>
                    <p className="text-lg font-bold text-purple-600">
                      {correctNotes}/{currentIndex}
                    </p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* 当前音符详情 */}
            {currentNote && (
              <section className="px-4 py-2">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="text-4xl font-bold"
                        animate={isCorrect ? { scale: [1, 1.1, 1] } : {}}
                      >
                        {currentNote.pitch}
                      </motion.div>
                      <div className="text-sm opacity-80">
                        <p>{t('practice.string', language)}: {currentNote.string || '-'}</p>
                        <p>{t('practice.finger', language)}: {currentNote.finger ?? '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCorrect ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 bg-green-500 rounded-full px-3 py-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{t('practice.great', language)}</span>
                        </motion.div>
                      ) : currentPitch ? (
                        <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">{currentPitch}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-60">
                          <Mic className="w-4 h-4" />
                          <span className="text-sm">{t('practice.waitingNote', language)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </section>
            )}
          </>
        )}
      </main>

      {/* 底部控制栏 */}
      {assessState === 'recording' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-safe z-40">
          <div className="flex gap-3">
            <motion.button
              onClick={skipNote}
              className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {t('practice.skip', language)}
            </motion.button>

            <motion.button
              onClick={finishAssessment}
              className="flex-[2] py-4 bg-red-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              <Square className="w-5 h-5" fill="white" />
              {t('assess.endAssessment', language) || '结束评测'}
            </motion.button>

            <motion.button
              onClick={handleRestart}
              className="py-4 px-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center"
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </div>
        </footer>
      )}

      {/* 问喵Do 悬浮按钮 */}
      <motion.button
        onClick={() => setShowAIChat(true)}
        className="fixed right-4 bottom-36 w-14 h-14 bg-gradient-primary rounded-full shadow-lg flex items-center justify-center text-white z-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 text-xs">😸</span>
        </div>
      </motion.button>

      {/* AI 聊天弹窗 */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAIChat(false)}
          >
            <motion.div
              className="bg-white w-full max-w-[430px] rounded-t-3xl overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowAIChat(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <AIChatPage
                isModal={true}
                context={{
                  songName: song.name,
                  composer: song.composer,
                  difficulty: song.difficulty,
                  category: song.category,
                }}
                onClose={() => setShowAIChat(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
