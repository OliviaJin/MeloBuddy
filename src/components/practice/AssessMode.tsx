'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, RotateCcw, Mic, MessageCircle, X, Timer } from 'lucide-react'
import { Song } from '@/data'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { PracticeResult, NotationMode } from '@/types/practice'
import { initAudio } from '@/lib/audio'
import { usePitchDetection } from '@/hooks'
import AIChatPage from '@/app/ai-chat/page'
import {
  PracticeHeader,
  StaffDisplay,
  NumberedDisplay,
  ViolinFingerboard,
  NotationSwitcher,
  stringNames,
  getFingerLabel,
} from './shared'

interface AssessModeProps {
  song: Song
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

type AssessState = 'ready' | 'recording' | 'finished'

export function AssessMode({ song, onComplete, onBack }: AssessModeProps) {
  const { language } = useLanguageStore()

  // 评测状态
  const [assessState, setAssessState] = useState<AssessState>('ready')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [correctNotes, setCorrectNotes] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [currentCombo, setCurrentCombo] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // 乐谱显示模式
  const [notationMode, setNotationMode] = useState<NotationMode>('staff')

  // AI 聊天弹窗状态
  const [showAIChat, setShowAIChat] = useState(false)

  // 音高检测
  const {
    isListening,
    currentPitch,
    isCorrect,
    startListening,
    stopListening,
    setTargetNote,
  } = usePitchDetection()

  // 计时器
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const correctTimerRef = useRef<NodeJS.Timeout | null>(null)
  const REQUIRED_CORRECT_TIME = 400

  // 初始化音频
  useEffect(() => {
    initAudio()
  }, [])

  // 更新目标音符
  useEffect(() => {
    if (currentIndex < song.notes.length) {
      setTargetNote(song.notes[currentIndex].pitch)
    }
  }, [currentIndex, song, setTargetNote])

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

  // 自动进入下一个音符
  const handleNoteComplete = useCallback(() => {
    if (currentIndex >= song.notes.length) return

    // 记录正确
    setCompletedIndices(prev => new Set(prev).add(currentIndex))
    setCorrectNotes(prev => prev + 1)

    // 更新连击
    const newCombo = currentCombo + 1
    setCurrentCombo(newCombo)
    if (newCombo > maxCombo) {
      setMaxCombo(newCombo)
    }

    // 下一个音符或完成
    if (currentIndex < song.notes.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      finishAssessment()
    }
  }, [currentIndex, song, currentCombo, maxCombo])

  // 音高正确时自动确认
  useEffect(() => {
    if (isListening && isCorrect && assessState === 'recording') {
      if (!correctTimerRef.current) {
        const startTimeRef = Date.now()
        const checkTimer = () => {
          const elapsed = Date.now() - startTimeRef
          if (elapsed >= REQUIRED_CORRECT_TIME) {
            handleNoteComplete()
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
  const startAssessment = useCallback(() => {
    setAssessState('recording')
    setStartTime(Date.now())
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setCorrectNotes(0)
    setCurrentCombo(0)
    setMaxCombo(0)
    setElapsedTime(0)
    startListening()
  }, [startListening])

  // 结束评测
  const finishAssessment = useCallback(() => {
    stopListening()
    setAssessState('finished')

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const totalNotes = song.notes.length
    const score = Math.round((correctNotes / totalNotes) * 100)

    let stars = 0
    if (score >= 95) stars = 3
    else if (score >= 80) stars = 2
    else if (score >= 60) stars = 1

    const duration = startTime ? Date.now() - startTime : 0

    // 评测模式给更多XP
    const xpEarned = Math.round(score * 0.8) + (stars * 20) + (maxCombo >= 5 ? 10 : 0)

    onComplete({
      score,
      stars,
      xpEarned,
      totalNotes,
      completedNotes: correctNotes,
      skippedNotes: totalNotes - correctNotes,
      maxCombo,
      duration,
      accuracy: score,
    })
  }, [song, correctNotes, maxCombo, startTime, stopListening, onComplete])

  // 跳过当前音符
  const skipNote = useCallback(() => {
    if (currentIndex >= song.notes.length) return

    setCurrentCombo(0)

    if (currentIndex < song.notes.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      finishAssessment()
    }
  }, [currentIndex, song, finishAssessment])

  // 重新开始
  const handleRestart = useCallback(() => {
    stopListening()
    if (timerRef.current) clearInterval(timerRef.current)
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current)
    setAssessState('ready')
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setCorrectNotes(0)
    setCurrentCombo(0)
    setMaxCombo(0)
    setStartTime(null)
    setElapsedTime(0)
  }, [stopListening])

  // 格式化时间
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const currentNote = song.notes[currentIndex] || song.notes[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <PracticeHeader
        song={song}
        currentIndex={currentIndex}
        onBack={onBack}
        language={language}
      />

      {/* 主内容 */}
      <div className="p-4 space-y-4 pb-44">
        {/* 准备状态 */}
        {assessState === 'ready' && (
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
              <p className="text-white/70 text-xs mb-2">{song.notes.length} {t('practice.notes', language)}</p>
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
              className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mic className="w-6 h-6 inline-block mr-2" />
              {t('practice.startMode', language)}
            </motion.button>
          </motion.div>
        )}

        {/* 录制状态 */}
        {assessState === 'recording' && (
          <>
            {/* 录制状态指示 */}
            <motion.div
              className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white text-center shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <p className="text-white/80 text-sm">{t('practice.assessRecording', language)}</p>
              </div>

              {/* 计时器 */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Timer className="w-5 h-5" />
                <span className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</span>
              </div>

              {/* 当前音符 */}
              <motion.div
                key={currentIndex}
                className="text-5xl font-bold mb-2"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
              >
                {currentNote.pitch}
              </motion.div>
              <div className="flex justify-center gap-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {stringNames[currentNote.string]}{t('practice.string', language)}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {getFingerLabel(currentNote.finger, language)}
                </span>
              </div>

              {/* 检测状态 */}
              <div className="mt-4">
                {currentPitch && (
                  <motion.div
                    className={`inline-block px-4 py-2 rounded-full ${
                      isCorrect ? 'bg-green-500' : 'bg-white/20'
                    }`}
                    animate={isCorrect ? { scale: [1, 1.1, 1] } : {}}
                  >
                    {currentPitch}
                    {isCorrect && ' ✓'}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* 进度统计 */}
            <div className="bg-white rounded-2xl p-4 shadow-cute">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('practice.accuracy', language)}</p>
                  <p className="text-xl font-bold text-primary-600">
                    {currentIndex > 0 ? Math.round((correctNotes / currentIndex) * 100) : 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('practice.notes', language)}</p>
                  <p className="text-xl font-bold text-gray-800">
                    {currentIndex + 1} / {song.notes.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('practice.combo', language)}</p>
                  <p className="text-xl font-bold text-orange-500">x{currentCombo}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 乐谱显示切换 */}
        <NotationSwitcher
          mode={notationMode}
          onModeChange={setNotationMode}
          language={language}
        />

        {/* 乐谱显示 */}
        {notationMode === 'staff' ? (
          <StaffDisplay
            notes={song.notes}
            currentIndex={currentIndex}
            completedIndices={completedIndices}
          />
        ) : (
          <NumberedDisplay
            notes={song.notes}
            currentIndex={currentIndex}
            completedIndices={completedIndices}
          />
        )}

        {/* 指板显示 */}
        <ViolinFingerboard currentNote={currentNote} language={language} />
      </div>

      {/* 底部控制区 */}
      {assessState === 'recording' && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40">
          <div className="max-w-[430px] mx-auto">
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
                className="flex-1 py-4 bg-red-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
              >
                <Square className="w-5 h-5" />
                {t('practice.assessComplete', language)}
              </motion.button>

              <motion.button
                onClick={handleRestart}
                className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* 问喵Do 悬浮按钮 */}
      <motion.button
        onClick={() => setShowAIChat(true)}
        className="fixed right-4 bottom-28 w-14 h-14 bg-gradient-primary rounded-full shadow-lg flex items-center justify-center text-white z-30"
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
