'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Music,
  Loader2,
  MessageCircle,
  X,
} from 'lucide-react'
import { SheetMusicDisplay } from '@/components/sheet'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { loadMusicXML, addDefaultFingerings } from '@/lib/musicxml-parser'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { playNote, initAudio } from '@/lib/audio'
import AIChatPage from '@/app/ai-chat/page'
import type { FollowModeProps } from '@/types'
import type { ParsedNote, ParsedSong } from '@/types'

// 速度选项
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25] as const

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 根据当前时间和 tempo 计算当前音符索引
function calculateCurrentNoteIndex(
  currentTime: number,
  notes: ParsedNote[],
  tempo: number
): number {
  if (notes.length === 0) return -1

  // 每拍的秒数
  const secondsPerBeat = 60 / tempo

  // 当前时间对应的拍数
  const currentBeat = currentTime / secondsPerBeat

  // 找到当前应该显示的音符
  for (let i = notes.length - 1; i >= 0; i--) {
    if (notes[i].startBeat <= currentBeat) {
      return i
    }
  }

  return 0
}

// 根据音符索引计算时间
function calculateTimeFromNoteIndex(
  noteIndex: number,
  notes: ParsedNote[],
  tempo: number
): number {
  if (noteIndex < 0 || noteIndex >= notes.length) return 0

  const secondsPerBeat = 60 / tempo
  return notes[noteIndex].startBeat * secondsPerBeat
}

export function FollowMode({ song, onComplete, onBack }: FollowModeProps) {
  const { language } = useLanguageStore()

  // 解析后的音符和歌曲信息
  const [parsedSong, setParsedSong] = useState<ParsedSong | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // A-B 循环状态
  const [loopMode, setLoopMode] = useState<'off' | 'setting-a' | 'setting-b' | 'active'>('off')
  const [loopA, setLoopA] = useState<number | null>(null)

  // 练习开始时间
  const [startTime] = useState(Date.now())

  // AI 聊天弹窗状态
  const [showAIChat, setShowAIChat] = useState(false)

  // 合成音频播放状态（无真实音频时使用）
  const [isSynthPlaying, setIsSynthPlaying] = useState(false)
  const [synthCurrentTime, setSynthCurrentTime] = useState(0)

  // 音频播放器
  const audioUrl = (song as { audioUrl?: string }).audioUrl || null
  const {
    isPlaying: isRealPlaying,
    isLoading: isAudioLoading,
    currentTime: realCurrentTime,
    duration: realDuration,
    playbackRate,
    error: audioError,
    play,
    pause,
    toggle,
    seek,
    setPlaybackRate,
    setLoop,
    clearLoop,
    loopRange,
  } = useAudioPlayer(audioUrl)

  // 统一的播放状态
  const isPlaying = audioUrl ? isRealPlaying : isSynthPlaying
  const currentTime = audioUrl ? realCurrentTime : synthCurrentTime

  // 计算总时长
  const duration = useMemo(() => {
    if (audioUrl && realDuration > 0) return realDuration
    if (parsedSong) {
      const secondsPerBeat = 60 / parsedSong.tempo
      return parsedSong.totalBeats * secondsPerBeat
    }
    return song.duration || 60
  }, [audioUrl, realDuration, parsedSong, song.duration])

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

  // 合成音频播放逻辑
  useEffect(() => {
    if (!isSynthPlaying || audioUrl || !parsedSong) return

    const secondsPerBeat = 60 / (parsedSong.tempo * playbackRate)
    let animationId: number
    let lastTime = performance.now()

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time

      setSynthCurrentTime((prev) => {
        const newTime = prev + delta
        if (newTime >= duration) {
          setIsSynthPlaying(false)
          return 0
        }

        // 检查循环
        if (loopRange && newTime >= loopRange.end) {
          return loopRange.start
        }

        return newTime
      })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isSynthPlaying, audioUrl, parsedSong, duration, loopRange, playbackRate])

  // 播放合成音符
  useEffect(() => {
    if (!isSynthPlaying || audioUrl || !parsedSong) return

    const currentIndex = calculateCurrentNoteIndex(synthCurrentTime, parsedSong.notes, parsedSong.tempo)
    if (currentIndex >= 0 && currentIndex < parsedSong.notes.length) {
      const note = parsedSong.notes[currentIndex]
      const secondsPerBeat = 60 / parsedSong.tempo
      const noteDuration = note.duration * secondsPerBeat * 0.9

      // 只在音符开始时播放
      const noteStartTime = note.startBeat * secondsPerBeat
      if (Math.abs(synthCurrentTime - noteStartTime) < 0.05) {
        playNote(note.pitch, noteDuration / playbackRate)
      }
    }
  }, [isSynthPlaying, audioUrl, parsedSong, synthCurrentTime, playbackRate])

  // 当前音符索引
  const currentNoteIndex = useMemo(() => {
    if (!parsedSong) return -1
    return calculateCurrentNoteIndex(
      currentTime,
      parsedSong.notes,
      parsedSong.tempo
    )
  }, [currentTime, parsedSong])

  // 处理播放/暂停
  const handleToggle = useCallback(() => {
    if (audioUrl) {
      toggle()
    } else {
      setIsSynthPlaying((prev) => !prev)
    }
  }, [audioUrl, toggle])

  // 处理进度条拖动
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value)
      if (audioUrl) {
        seek(newTime)
      } else {
        setSynthCurrentTime(newTime)
      }
    },
    [audioUrl, seek]
  )

  // 处理速度变更
  const handleRateChange = useCallback(
    (rate: number) => {
      setPlaybackRate(rate)
    },
    [setPlaybackRate]
  )

  // 跳到上一个/下一个音符
  const skipToNote = useCallback(
    (direction: 'prev' | 'next') => {
      if (!parsedSong) return

      const targetIndex =
        direction === 'prev'
          ? Math.max(0, currentNoteIndex - 1)
          : Math.min(parsedSong.notes.length - 1, currentNoteIndex + 1)

      const targetTime = calculateTimeFromNoteIndex(
        targetIndex,
        parsedSong.notes,
        parsedSong.tempo
      )

      if (audioUrl) {
        seek(targetTime)
      } else {
        setSynthCurrentTime(targetTime)
      }
    },
    [parsedSong, currentNoteIndex, audioUrl, seek]
  )

  // A-B 循环控制
  const handleLoopToggle = useCallback(() => {
    if (loopMode === 'off') {
      // 开始设置循环点 A
      setLoopMode('setting-a')
      setLoopA(currentTime)
    } else if (loopMode === 'setting-a') {
      // 设置循环点 A 并开始设置 B
      setLoopA(currentTime)
      setLoopMode('setting-b')
    } else if (loopMode === 'setting-b') {
      // 设置循环点 B 并激活循环
      if (loopA !== null) {
        const start = Math.min(loopA, currentTime)
        const end = Math.max(loopA, currentTime)
        setLoop(start, end)
      }
      setLoopMode('active')
    } else {
      // 取消循环
      clearLoop()
      setLoopA(null)
      setLoopMode('off')
    }
  }, [loopMode, currentTime, loopA, setLoop, clearLoop])

  // 获取循环按钮文字
  const loopButtonText = useMemo(() => {
    switch (loopMode) {
      case 'off':
        return t('practice.setLoop', language) || '设置循环'
      case 'setting-a':
        return t('practice.setPointA', language) || '设置A点'
      case 'setting-b':
        return t('practice.setPointB', language) || '设置B点'
      case 'active':
        return t('practice.cancelLoop', language) || '取消循环'
    }
  }, [loopMode, language])

  // 计算练习进度
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const totalNotes = parsedSong?.notes.length || song.notes?.length || 0
  const completedNotes = currentNoteIndex + 1

  // 完成练习
  const handleComplete = useCallback(() => {
    const practiceTime = Date.now() - startTime
    const accuracy = totalNotes > 0 ? (completedNotes / totalNotes) * 100 : 0

    onComplete({
      score: Math.round(accuracy),
      stars: accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0,
      xpEarned: Math.round(accuracy * 0.5),
      totalNotes,
      completedNotes,
      skippedNotes: 0,
      maxCombo: completedNotes,
      duration: practiceTime,
      accuracy,
    })
  }, [startTime, totalNotes, completedNotes, onComplete])

  // 监听播放结束
  useEffect(() => {
    if (duration > 0 && currentTime >= duration - 0.1 && !loopRange) {
      handleComplete()
    }
  }, [currentTime, duration, loopRange, handleComplete])

  // 当前音符信息
  const currentNote = useMemo(() => {
    if (parsedSong && currentNoteIndex >= 0) {
      return parsedSong.notes[currentNoteIndex]
    }
    if (song.notes && currentNoteIndex >= 0) {
      return song.notes[currentNoteIndex]
    }
    return null
  }, [parsedSong, song.notes, currentNoteIndex])

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
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <h1 className="font-medium text-gray-800">{t('practice.mode.follow', language)}</h1>

          <div className="flex items-center gap-2">
            {isPlaying ? (
              <motion.div
                className="flex items-center gap-1 text-primary-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Music className="w-4 h-4" />
                <span className="text-sm font-medium">{t('practice.playing', language)}</span>
              </motion.div>
            ) : (
              <span className="text-sm text-gray-400">{t('practice.paused', language)}</span>
            )}
          </div>
        </div>
      </header>

      <main className="pb-48">
        {/* 播放进度区域 */}
        <section className="px-4 py-4 bg-white border-b border-gray-100">
          {/* 进度条 */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:bg-primary-500
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8B5CF6 ${progress}%, #E5E7EB ${progress}%)`,
                }}
              />

              {/* 循环区间显示 */}
              {loopRange && duration > 0 && (
                <div
                  className="absolute top-0 h-2 bg-yellow-300/50 rounded-full pointer-events-none"
                  style={{
                    left: `${(loopRange.start / duration) * 100}%`,
                    width: `${((loopRange.end - loopRange.start) / duration) * 100}%`,
                  }}
                />
              )}
            </div>

            {/* 时间显示 */}
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 速度选择 */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-500 mr-2">{t('practice.speed', language)}:</span>
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  playbackRate === rate
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* 音频加载状态 */}
          {isAudioLoading && (
            <div className="mt-2 text-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 inline-block animate-spin mr-1" />
              {t('practice.loadingAudio', language)}
            </div>
          )}

          {audioError && (
            <div className="mt-2 text-center text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Volume2 className="w-4 h-4 inline-block mr-1" />
              {audioError}
              <p className="text-xs mt-1 text-amber-500">
                {t('practice.useSynthAudio', language)}
              </p>
            </div>
          )}

          {!audioUrl && (
            <div className="mt-2 text-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <Volume2 className="w-4 h-4 inline-block mr-1" />
              {t('practice.noAudioFile', language)}
            </div>
          )}
        </section>

        {/* 乐谱显示 */}
        <section className="px-4 py-4">
          {musicXmlUrl ? (
            <SheetMusicDisplay
              musicXmlUrl={musicXmlUrl}
              currentNoteIndex={currentNoteIndex}
              showCursor={true}
              zoom={1.0}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-cute p-6 text-center text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>{t('practice.noSheetMusic', language)}</p>
            </div>
          )}
        </section>

        {/* 当前音符信息 */}
        {currentNote && (
          <section className="px-4 py-2">
            <motion.div
              key={currentNoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-cute p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary-600">
                    {currentNote.pitch}
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>
                      {t('practice.string', language)}: {currentNote.string || '-'} |{' '}
                      {t('practice.finger', language)}: {currentNote.finger ?? '-'}
                    </p>
                    {'bowDirection' in currentNote && (
                      <p>
                        {t('practice.bow', language)}: {currentNote.bowDirection === 'down' ? '⬇ 下弓' : '⬆ 上弓'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  {currentNoteIndex + 1} / {totalNotes}
                </div>
              </div>
            </motion.div>
          </section>
        )}
      </main>

      {/* 底部控制栏 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-safe z-40">
        {/* 主控制按钮 */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* 上一个 */}
          <button
            onClick={() => skipToNote('prev')}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <SkipBack className="w-6 h-6 text-gray-600" />
          </button>

          {/* 播放/暂停 */}
          <motion.button
            onClick={handleToggle}
            className="p-5 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Pause className="w-8 h-8 text-white" fill="white" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Play className="w-8 h-8 text-white" fill="white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* 下一个 */}
          <button
            onClick={() => skipToNote('next')}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <SkipForward className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* 循环控制 */}
        <div className="flex justify-center">
          <button
            onClick={handleLoopToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              loopMode === 'active'
                ? 'bg-yellow-100 text-yellow-700'
                : loopMode !== 'off'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Repeat className="w-4 h-4" />
            {loopButtonText}
            {loopRange && (
              <span className="text-xs opacity-70">
                ({formatTime(loopRange.start)} - {formatTime(loopRange.end)})
              </span>
            )}
          </button>
        </div>
      </footer>

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
                  songName: song.title,
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
