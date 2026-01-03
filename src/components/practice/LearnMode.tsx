'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SkipForward,
  Volume2,
  Mic,
  MicOff,
  Check,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Star,
} from 'lucide-react'
import { Song } from '@/data'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { PracticeResult, NotationMode } from '@/types/practice'
import { ParsedNote, ParsedSong } from '@/types'
import { playNote, playSuccess, playCombo, playSkip, initAudio } from '@/lib/audio'
import { usePitchDetection } from '@/hooks'
import { SheetMusicDisplay } from '@/components/sheet'
import { loadMusicXML } from '@/lib/musicxml-parser'
import AIChatPage from '@/app/ai-chat/page'
import {
  StaffDisplay,
  NumberedDisplay,
  ViolinFingerboard,
  FeedbackMessage,
  NotationSwitcher,
  stringNames,
  getFingerLabel,
} from './shared'

interface LearnModeProps {
  song: Song & { musicXmlUrl?: string }
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

export function LearnMode({ song, onComplete, onBack }: LearnModeProps) {
  const { language } = useLanguageStore()

  // 是否使用 MusicXML
  const useMusicXML = !!song.musicXmlUrl

  // 练习状态
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [comboCount, setComboCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'skip' | 'combo'; combo?: number } | null>(null)
  const [startTime] = useState(Date.now())

  // MusicXML 解析后的数据
  const [parsedSong, setParsedSong] = useState<ParsedSong | null>(null)
  const [parsedNotes, setParsedNotes] = useState<ParsedNote[]>([])
  const [isLoading, setIsLoading] = useState(useMusicXML)

  // 乐谱显示模式（仅用于非MusicXML模式）
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

  // 加载 MusicXML
  useEffect(() => {
    if (useMusicXML && song.musicXmlUrl) {
      setIsLoading(true)
      loadMusicXML(song.musicXmlUrl)
        .then((result) => {
          setParsedSong(result)
          setParsedNotes(result.notes)
          if (result.notes.length > 0) {
            setTargetNote(result.notes[0].pitch)
          }
        })
        .catch((error) => {
          console.error('Failed to load MusicXML:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [useMusicXML, song.musicXmlUrl, setTargetNote])

  // 获取当前音符（支持两种数据源）
  const getCurrentNote = useCallback(() => {
    if (useMusicXML && parsedNotes.length > 0) {
      return parsedNotes[currentIndex]
    }
    return song.notes[currentIndex]
  }, [useMusicXML, parsedNotes, song.notes, currentIndex])

  // 获取总音符数
  const getTotalNotes = useCallback(() => {
    if (useMusicXML && parsedNotes.length > 0) {
      return parsedNotes.length
    }
    return song.notes.length
  }, [useMusicXML, parsedNotes, song.notes])

  // 更新目标音符
  useEffect(() => {
    const totalNotes = getTotalNotes()
    if (currentIndex < totalNotes) {
      const note = getCurrentNote()
      if (note) {
        setTargetNote(note.pitch)
      }
    }
  }, [currentIndex, getCurrentNote, getTotalNotes, setTargetNote])

  // SheetMusicDisplay ready 回调
  const handleSheetReady = useCallback((notes: ParsedNote[]) => {
    // 如果已经从 loadMusicXML 加载了，可以忽略
    if (parsedNotes.length === 0) {
      setParsedNotes(notes)
      if (notes.length > 0) {
        setTargetNote(notes[0].pitch)
      }
    }
  }, [parsedNotes.length, setTargetNote])

  // 完成练习
  const finishPractice = useCallback(() => {
    const totalNotes = getTotalNotes()
    const score = Math.round((correctCount / totalNotes) * 100)

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
      completedNotes: correctCount,
      skippedNotes: skippedCount,
      maxCombo,
      duration,
      accuracy: score,
    })
  }, [getTotalNotes, correctCount, skippedCount, maxCombo, startTime, onComplete])

  // 自动完成（音高检测成功）
  const handleAutoComplete = useCallback(() => {
    const totalNotes = getTotalNotes()
    if (currentIndex >= totalNotes) return

    // 清除计时器
    if (correctTimerRef.current) {
      clearTimeout(correctTimerRef.current)
      correctTimerRef.current = null
    }
    setCorrectDuration(0)

    // 更新统计
    setCorrectCount((prev) => prev + 1)

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
    if (currentIndex < totalNotes - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      stopListening()
      setTimeout(finishPractice, 500)
    }
  }, [getTotalNotes, currentIndex, comboCount, maxCombo, finishPractice, stopListening])

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

  // 手动完成当前音符
  const handleManualComplete = useCallback(() => {
    const totalNotes = getTotalNotes()
    if (currentIndex >= totalNotes) return

    // 更新统计
    setCorrectCount((prev) => prev + 1)

    // 更新连击
    const newCombo = comboCount + 1
    setComboCount(newCombo)
    if (newCombo > maxCombo) {
      setMaxCombo(newCombo)
    }

    // 显示反馈
    setFeedback({ type: 'success' })
    playSuccess()

    // 进入下一个或完成
    if (currentIndex < totalNotes - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setTimeout(finishPractice, 500)
    }
  }, [getTotalNotes, currentIndex, comboCount, maxCombo, finishPractice])

  // 跳过当前音符
  const handleSkip = useCallback(() => {
    const totalNotes = getTotalNotes()
    if (currentIndex >= totalNotes) return

    setSkippedCount((prev) => prev + 1)
    setComboCount(0)
    setFeedback({ type: 'skip' })
    playSkip()

    if (currentIndex < totalNotes - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setTimeout(finishPractice, 500)
    }
  }, [getTotalNotes, currentIndex, finishPractice])

  // 播放当前音符示范
  const handlePlayDemo = useCallback(() => {
    const note = getCurrentNote()
    if (note) {
      playNote(note.pitch, note.duration || 0.5)
    }
  }, [getCurrentNote])

  // 点击乐谱音符
  const handleNoteClick = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const currentNote = getCurrentNote()
  const totalNotes = getTotalNotes()

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载乐谱中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-center flex-1 mx-4">
            <h1 className="font-bold text-gray-800">{t('practice.mode.learn', language)}</h1>
            <p className="text-xs text-gray-500">{song.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {currentIndex + 1}/{totalNotes}
            </span>
            <span className="flex items-center gap-1 text-sm text-primary-600">
              <Star className="w-4 h-4 fill-primary-500" />
              +{song.xpReward}
            </span>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="p-4 space-y-4 pb-60">
        {/* 五线谱显示 - MusicXML模式 */}
        {useMusicXML && song.musicXmlUrl && (
          <SheetMusicDisplay
            musicXmlUrl={song.musicXmlUrl}
            currentNoteIndex={currentIndex}
            highlightColor="#8B5CF6"
            zoom={1.0}
            showCursor={true}
            onReady={handleSheetReady}
            onNoteClick={handleNoteClick}
          />
        )}

        {/* 乐谱显示 - 传统模式 */}
        {!useMusicXML && (
          <>
            <NotationSwitcher
              mode={notationMode}
              onModeChange={setNotationMode}
              language={language}
            />
            {notationMode === 'staff' ? (
              <StaffDisplay
                notes={song.notes}
                currentIndex={currentIndex}
                completedIndices={new Set()}
              />
            ) : (
              <NumberedDisplay
                notes={song.notes}
                currentIndex={currentIndex}
                completedIndices={new Set()}
              />
            )}
          </>
        )}

        {/* 当前音符信息卡片 */}
        {currentNote && (
          <motion.div
            className="bg-gradient-to-br from-primary-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentIndex}
          >
            <div className="flex items-center justify-center gap-6">
              {/* 音符图标和音名 */}
              <motion.div
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
              >
                <div className="text-2xl mb-1">🎵</div>
                <div className="text-5xl font-bold">{currentNote.pitch}</div>
              </motion.div>

              {/* 分隔线 */}
              <div className="w-px h-20 bg-white/30" />

              {/* 弦、指法、弓向 */}
              <div className="space-y-2 text-left">
                {'string' in currentNote && currentNote.string !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-3 py-1.5 rounded-full font-bold">
                      {stringNames[currentNote.string as number]}{t('practice.string', language)}
                    </span>
                    <span className="text-white/70">
                      {'finger' in currentNote && currentNote.finger !== undefined
                        ? getFingerLabel(currentNote.finger as number, language)
                        : ''}
                    </span>
                  </div>
                )}
                {'bowDirection' in currentNote && currentNote.bowDirection && (
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                      {currentNote.bowDirection === 'up' ? (
                        <>
                          <ArrowUp className="w-4 h-4" />
                          {t('practice.upBow', language)}
                        </>
                      ) : (
                        <>
                          <ArrowDown className="w-4 h-4" />
                          {t('practice.downBow', language)}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 音高检测正确指示 */}
            {isCorrect && (
              <motion.div
                className="mt-4 bg-white/20 rounded-full px-4 py-2 text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="w-5 h-5 inline-block mr-2" />
                {t('practice.great', language)}
                <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${(correctDuration / REQUIRED_CORRECT_TIME) * 100}%` }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 小提琴指板 */}
        {currentNote && 'string' in currentNote && 'finger' in currentNote && (
          <ViolinFingerboard
            currentNote={currentNote as { pitch: string; string: number; finger: number; duration: number }}
            language={language}
          />
        )}

        {/* 音高检测状态 */}
        {isListening && (
          <motion.div
            className="bg-white rounded-2xl p-4 shadow-cute"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Mic className="w-3 h-3 text-green-500" />
                {t('practice.detecting', language)}
              </p>
              {frequency && (
                <span className="text-xs text-gray-400">{Math.round(frequency)} Hz</span>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {/* 音高偏移指示 */}
              {currentPitch && centsDiff !== 0 && !isCorrect && (
                <div className={`flex items-center gap-1 ${centsDiff > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {centsDiff > 0 ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      <span className="text-sm">{t('practice.tooHigh', language)}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      <span className="text-sm">{t('practice.tooLow', language)}</span>
                    </>
                  )}
                </div>
              )}

              {/* 检测到的音高 */}
              <div className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center ${
                isCorrect
                  ? 'bg-green-100 border-2 border-green-400'
                  : currentPitch
                  ? 'bg-gray-100 border-2 border-gray-200'
                  : 'bg-gray-50 border-2 border-dashed border-gray-200'
              }`}>
                {currentPitch ? (
                  <span className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-gray-700'}`}>
                    {currentPitch}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">{t('practice.waitingNote', language)}</span>
                )}
              </div>
            </div>

            {pitchError && (
              <p className="text-red-500 text-xs text-center mt-2">{pitchError}</p>
            )}
          </motion.div>
        )}

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
        <div className="max-w-[430px] mx-auto space-y-3">
          {/* 听示范 + 跳过 */}
          <div className="flex gap-3">
            <button
              onClick={handlePlayDemo}
              className="flex-1 py-3 bg-blue-50 rounded-2xl font-medium text-blue-600 flex items-center justify-center gap-2"
            >
              <Volume2 className="w-5 h-5" />
              {t('practice.replay', language)}
            </button>

            <button
              onClick={handleSkip}
              className="flex-1 py-3 bg-gray-100 rounded-2xl font-medium text-gray-600 flex items-center justify-center gap-2"
            >
              <SkipForward className="w-5 h-5" />
              {t('practice.skip', language)}
            </button>
          </div>

          {/* 麦克风检测按钮 */}
          {isListening ? (
            <motion.button
              onClick={stopListening}
              className="w-full py-4 bg-red-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              <MicOff className="w-5 h-5" />
              {t('practice.stopDetection', language)}
            </motion.button>
          ) : (
            <motion.button
              onClick={startListening}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
              whileTap={{ scale: 0.98 }}
            >
              <Mic className="w-5 h-5" />
              {t('practice.startDetection', language)}
            </motion.button>
          )}

          {/* 手动完成按钮 */}
          <motion.button
            onClick={handleManualComplete}
            className="w-full py-4 bg-green-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
            whileTap={{ scale: 0.98 }}
          >
            <Check className="w-6 h-6" />
            完成这个音
          </motion.button>
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
        className="fixed right-4 bottom-72 w-12 h-12 bg-gradient-primary rounded-full shadow-lg flex items-center justify-center text-white z-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 text-[10px]">😸</span>
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
              className="bg-white w-full max-w-[430px] rounded-t-3xl overflow-hidden max-h-[80vh]"
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
