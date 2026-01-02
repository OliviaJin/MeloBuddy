'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SkipForward, Volume2, Mic, MicOff, Check, ChevronUp, ChevronDown, MessageCircle, X } from 'lucide-react'
import { Song } from '@/data'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { PracticeResult, NotationMode } from '@/types/practice'
import { playNote, playSuccess, playCombo, playSkip, initAudio } from '@/lib/audio'
import { usePitchDetection } from '@/hooks'
import AIChatPage from '@/app/ai-chat/page'
import {
  PracticeHeader,
  StaffDisplay,
  NumberedDisplay,
  ViolinFingerboard,
  FeedbackMessage,
  NotationSwitcher,
  CurrentNoteDisplay,
} from './shared'

interface LearnModeProps {
  song: Song
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

export function LearnMode({ song, onComplete, onBack }: LearnModeProps) {
  const { language } = useLanguageStore()

  // 练习状态
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [skippedCount, setSkippedCount] = useState(0)
  const [comboCount, setComboCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'skip' | 'combo'; combo?: number } | null>(null)
  const [startTime] = useState(Date.now())

  // 乐谱显示模式
  const [notationMode, setNotationMode] = useState<NotationMode>('staff')

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
    error: pitchError,
    startListening,
    stopListening,
    setTargetNote,
  } = usePitchDetection()

  // 音高检测确认计时器
  const correctTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [correctDuration, setCorrectDuration] = useState(0)
  const REQUIRED_CORRECT_TIME = 500

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

  // 完成练习
  const finishPractice = useCallback(() => {
    const totalNotes = song.notes.length
    const completedCount = completedIndices.size
    const score = Math.round((completedCount / totalNotes) * 100)

    let stars = 0
    if (score >= 100) stars = 3
    else if (score >= 80) stars = 2
    else if (score >= 60) stars = 1

    const duration = Date.now() - startTime

    onComplete({
      score,
      stars,
      xpEarned: Math.round(score * 0.5) + (stars * 10),
      totalNotes,
      completedNotes: completedCount,
      skippedNotes: skippedCount,
      maxCombo,
      duration,
      accuracy: score,
    })
  }, [song, completedIndices, skippedCount, maxCombo, startTime, onComplete])

  // 自动完成（音高检测成功）
  const handleAutoComplete = useCallback(() => {
    if (currentIndex >= song.notes.length) return

    // 清除计时器
    if (correctTimerRef.current) {
      clearTimeout(correctTimerRef.current)
      correctTimerRef.current = null
    }
    setCorrectDuration(0)

    // 更新完成状态
    setCompletedIndices((prev) => new Set(prev).add(currentIndex))

    // 更新连击
    const newCombo = comboCount + 1
    setComboCount(newCombo)
    if (newCombo > maxCombo) {
      setMaxCombo(newCombo)
    }

    // 显示反馈和播放音效
    if (newCombo > 0 && newCombo % 5 === 0) {
      setFeedback({ type: 'combo', combo: newCombo })
      playCombo()
    } else {
      setFeedback({ type: 'success' })
      playSuccess()
    }

    // 进入下一个或完成
    if (currentIndex < song.notes.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      stopListening()
      setTimeout(finishPractice, 500)
    }
  }, [song, currentIndex, comboCount, maxCombo, finishPractice, stopListening])

  // 音高正确时的自动确认逻辑
  useEffect(() => {
    if (isListening && isCorrect) {
      if (!correctTimerRef.current) {
        const startTimeRef = Date.now()
        const checkTimer = () => {
          const elapsed = Date.now() - startTimeRef
          setCorrectDuration(elapsed)

          if (elapsed >= REQUIRED_CORRECT_TIME) {
            handleAutoComplete()
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
      setCorrectDuration(0)
    }

    return () => {
      if (correctTimerRef.current) {
        clearTimeout(correctTimerRef.current)
      }
    }
  }, [isListening, isCorrect, handleAutoComplete])

  // 跳过当前音符
  const handleSkip = useCallback(() => {
    if (currentIndex >= song.notes.length) return

    setSkippedCount((prev) => prev + 1)
    setComboCount(0)
    setFeedback({ type: 'skip' })
    playSkip()

    if (currentIndex < song.notes.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setTimeout(finishPractice, 500)
    }
  }, [song, currentIndex, finishPractice])

  // 重听示范
  const handleReplay = useCallback(() => {
    const note = song.notes[currentIndex]
    playNote(note.pitch, note.duration)
  }, [song, currentIndex])

  const currentNote = song.notes[currentIndex]

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
        {/* 当前音符大显示 */}
        <CurrentNoteDisplay
          note={currentNote}
          currentIndex={currentIndex}
          language={language}
        />

        {/* 音高检测显示 */}
        {isListening && (
          <motion.div
            className="bg-white rounded-2xl p-4 shadow-cute"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Mic className="w-3 h-3 text-green-500" />
                {t('practice.detecting', language)}
              </p>
              <div className="flex items-center gap-2">
                {frequency && (
                  <span className="text-xs text-gray-400">
                    {frequency} Hz
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  confidence > 0.9 ? 'bg-green-100 text-green-700' :
                  confidence > 0.8 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                {currentPitch && centsDiff !== 0 && !isCorrect && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center gap-1 ${
                      centsDiff > 0 ? 'text-red-500' : 'text-blue-500'
                    }`}
                  >
                    {centsDiff > 0 ? (
                      <>
                        <ChevronUp className="w-6 h-6" />
                        <span className="text-sm font-medium">{t('practice.tooHigh', language)} {centsDiff}¢</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-6 h-6" />
                        <span className="text-sm font-medium">{t('practice.tooLow', language)} {Math.abs(centsDiff)}¢</span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              <motion.div
                className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center ${
                  isCorrect
                    ? 'bg-green-100 border-2 border-green-400'
                    : currentPitch
                    ? 'bg-gray-100 border-2 border-gray-200'
                    : 'bg-gray-50 border-2 border-dashed border-gray-200'
                }`}
                animate={isCorrect ? {
                  scale: [1, 1.05, 1],
                  borderColor: ['#4ade80', '#22c55e', '#4ade80']
                } : {}}
                transition={{ duration: 0.5, repeat: isCorrect ? Infinity : 0 }}
              >
                {currentPitch ? (
                  <>
                    <span className={`text-3xl font-bold ${
                      isCorrect ? 'text-green-600' : 'text-gray-700'
                    }`}>
                      {currentPitch}
                    </span>
                    {isCorrect && (
                      <Check className="w-5 h-5 text-green-500 mt-1" />
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">{t('practice.waitingNote', language)}</span>
                )}
              </motion.div>

              <div className="flex flex-col items-center">
                {isCorrect && (
                  <motion.div
                    className="w-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(correctDuration / REQUIRED_CORRECT_TIME) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-600 text-center mt-1">
                      {t('practice.holding', language)}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {pitchError && (
              <p className="text-red-500 text-sm text-center mt-2">{pitchError}</p>
            )}
          </motion.div>
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

        {/* 连击显示 */}
        {comboCount >= 3 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="text-sm font-bold text-primary-600">
              🔥 {t('practice.combo', language)} x{comboCount}
            </span>
          </motion.div>
        )}
      </div>

      {/* 底部控制区 */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40">
        <div className="max-w-[430px] mx-auto">
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2"
            >
              <SkipForward className="w-5 h-5" />
              {t('practice.skip', language)}
            </button>

            {isListening ? (
              <motion.button
                onClick={stopListening}
                className="flex-[2] py-4 bg-red-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                whileTap={{ scale: 0.98 }}
              >
                <MicOff className="w-6 h-6" />
                {t('practice.stopDetection', language)}
              </motion.button>
            ) : (
              <motion.button
                onClick={startListening}
                className="flex-[2] py-4 bg-gradient-primary rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                whileTap={{ scale: 0.98 }}
              >
                <Mic className="w-6 h-6" />
                {t('practice.startDetection', language)}
              </motion.button>
            )}

            <button
              onClick={handleReplay}
              className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2"
            >
              <Volume2 className="w-5 h-5" />
              {t('practice.replay', language)}
            </button>
          </div>
        </div>
      </div>

      {/* 反馈消息 */}
      <AnimatePresence>
        {feedback && (
          <FeedbackMessage
            type={feedback.type}
            combo={feedback.combo}
            onComplete={() => setFeedback(null)}
            language={language}
          />
        )}
      </AnimatePresence>

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
