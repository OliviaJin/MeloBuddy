'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Mic, MicOff, MessageCircle, X } from 'lucide-react'
import { Song } from '@/data'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { PracticeResult, NotationMode } from '@/types/practice'
import { playNote, initAudio } from '@/lib/audio'
import { usePitchDetection } from '@/hooks'
import AIChatPage from '@/app/ai-chat/page'
import {
  PracticeHeader,
  StaffDisplay,
  NumberedDisplay,
  ViolinFingerboard,
  NotationSwitcher,
  CurrentNoteDisplay,
  stringNames,
  getFingerLabel,
} from './shared'

interface FollowModeProps {
  song: Song
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

type FollowState = 'ready' | 'countdown' | 'playing' | 'finished'

export function FollowMode({ song, onComplete, onBack }: FollowModeProps) {
  const { language } = useLanguageStore()

  // 跟练状态
  const [followState, setFollowState] = useState<FollowState>('ready')
  const [countdown, setCountdown] = useState(3)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [correctNotes, setCorrectNotes] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // 乐谱显示模式
  const [notationMode, setNotationMode] = useState<NotationMode>('staff')

  // AI 聊天弹窗状态
  const [showAIChat, setShowAIChat] = useState(false)

  // 音高检测
  const {
    isListening,
    isCorrect,
    startListening,
    stopListening,
    setTargetNote,
  } = usePitchDetection()

  // 播放计时器
  const playTimerRef = useRef<NodeJS.Timeout | null>(null)
  const noteTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  // 检测正确音高时更新统计
  useEffect(() => {
    if (isListening && isCorrect && followState === 'playing') {
      if (!completedIndices.has(currentIndex)) {
        setCompletedIndices(prev => new Set(prev).add(currentIndex))
        setCorrectNotes(prev => prev + 1)
      }
    }
  }, [isListening, isCorrect, followState, currentIndex, completedIndices])

  // 开始倒计时
  const startCountdown = useCallback(() => {
    setFollowState('countdown')
    setCountdown(3)
    startListening()

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          startPlaying()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [startListening])

  // 开始播放
  const startPlaying = useCallback(() => {
    setFollowState('playing')
    setStartTime(Date.now())
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setCorrectNotes(0)

    // 播放每个音符
    let noteIndex = 0
    let elapsedTime = 0

    const playNextNote = () => {
      if (noteIndex >= song.notes.length) {
        // 完成
        setTimeout(() => {
          finishPractice()
        }, 500)
        return
      }

      const note = song.notes[noteIndex]
      setCurrentIndex(noteIndex)

      // 播放示范音
      playNote(note.pitch, note.duration * 0.9)

      // 计算下一个音符的延迟
      const noteDurationMs = note.duration * 1000 // 假设duration是秒
      noteIndex++
      elapsedTime += noteDurationMs

      noteTimerRef.current = setTimeout(playNextNote, noteDurationMs)
    }

    playNextNote()
  }, [song])

  // 完成练习
  const finishPractice = useCallback(() => {
    stopListening()
    setFollowState('finished')

    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current)
    }
    if (noteTimerRef.current) {
      clearTimeout(noteTimerRef.current)
    }

    const totalNotes = song.notes.length
    const score = Math.round((correctNotes / totalNotes) * 100)

    let stars = 0
    if (score >= 90) stars = 3
    else if (score >= 70) stars = 2
    else if (score >= 50) stars = 1

    const duration = startTime ? Date.now() - startTime : 0

    onComplete({
      score,
      stars,
      xpEarned: Math.round(score * 0.6) + (stars * 15),
      totalNotes,
      completedNotes: correctNotes,
      skippedNotes: totalNotes - correctNotes,
      maxCombo: 0,
      duration,
      accuracy: score,
    })
  }, [song, correctNotes, startTime, stopListening, onComplete])

  // 重新开始
  const handleRestart = useCallback(() => {
    stopListening()
    if (playTimerRef.current) clearTimeout(playTimerRef.current)
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    setFollowState('ready')
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setCorrectNotes(0)
    setStartTime(null)
  }, [stopListening])

  // 暂停/继续 - 简化版本，直接重置
  const handlePause = useCallback(() => {
    handleRestart()
  }, [handleRestart])

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
        {/* 状态显示 */}
        {followState === 'ready' && (
          <motion.div
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white text-center shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-xl font-bold mb-2">{t('practice.mode.follow', language)}</h2>
            <p className="text-white/80 text-sm mb-6">
              {t('practice.mode.follow.desc', language)}
            </p>
            <motion.button
              onClick={startCountdown}
              className="w-full py-4 bg-white text-green-600 rounded-2xl font-bold text-lg shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-6 h-6 inline-block mr-2" />
              {t('practice.startMode', language)}
            </motion.button>
          </motion.div>
        )}

        {followState === 'countdown' && (
          <motion.div
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white text-center shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-white/80 mb-2">{t('practice.followCountdown', language)}</p>
            <motion.div
              key={countdown}
              className="text-8xl font-bold"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
            >
              {countdown}
            </motion.div>
            <p className="text-white/60 mt-4 text-sm">
              {isListening ? '🎤 ' + t('practice.detecting', language) : ''}
            </p>
          </motion.div>
        )}

        {followState === 'playing' && (
          <>
            {/* 当前音符 */}
            <motion.div
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white text-center shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <p className="text-white/80 text-sm">{t('practice.yourTurn', language)}</p>
              </div>
              <motion.div
                key={currentIndex}
                className="text-6xl font-bold mb-2"
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

              {/* 正确指示 */}
              {isCorrect && (
                <motion.div
                  className="mt-3 bg-white/20 rounded-full px-4 py-1 inline-block"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓ {t('practice.great', language)}
                </motion.div>
              )}
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
                  <p className="text-xs text-gray-500">✓</p>
                  <p className="text-xl font-bold text-green-600">{correctNotes}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 乐谱显示切换 */}
        {(followState === 'playing' || followState === 'ready') && (
          <NotationSwitcher
            mode={notationMode}
            onModeChange={setNotationMode}
            language={language}
          />
        )}

        {/* 乐谱显示 */}
        {(followState === 'playing' || followState === 'ready') && (
          notationMode === 'staff' ? (
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
          )
        )}

        {/* 指板显示 */}
        {(followState === 'playing' || followState === 'ready') && (
          <ViolinFingerboard currentNote={currentNote} language={language} />
        )}
      </div>

      {/* 底部控制区 */}
      {followState === 'playing' && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40">
          <div className="max-w-[430px] mx-auto">
            <div className="flex gap-3">
              <motion.button
                onClick={handlePause}
                className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-5 h-5" />
                {t('practice.playAgain', language)}
              </motion.button>

              <div className="flex-[2] py-4 bg-green-100 rounded-2xl flex items-center justify-center gap-2">
                {isListening ? (
                  <>
                    <motion.div
                      className="w-3 h-3 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                    <span className="font-bold text-green-700">{t('practice.detecting', language)}</span>
                  </>
                ) : (
                  <span className="text-gray-500">{t('practice.waitingNote', language)}</span>
                )}
              </div>
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
