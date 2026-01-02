'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSongById, Note, Song } from '@/data'
import { useGameStore } from '@/stores'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { Language, t } from '@/i18n/translations'
import {
  ArrowLeft,
  Check,
  SkipForward,
  Volume2,
  Star,
  Trophy,
  Home,
  RotateCcw,
  Sparkles,
  Music,
  Hash,
  MessageCircle,
  X,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import AIChatPage from '@/app/ai-chat/page'
import { playNote, playSuccess, playCombo, playSkip, playComplete, initAudio } from '@/lib/audio'
import { usePitchDetection } from '@/hooks'

// 弦名映射
const stringNames = ['', 'E', 'A', 'D', 'G']

// 指法名称 - 使用翻译
const getFingerLabel = (finger: number, lang: Language) => {
  if (finger === 0) return t('practice.openString', lang)
  return `${finger}${t('practice.finger', lang)}`
}

// 简谱音符映射
const pitchToSolfege: Record<string, string> = {
  C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7',
}

// 五线谱位置映射 (从下往上，0=下加一线C4)
const pitchToStaffPosition: Record<string, number> = {
  // 低音区
  G3: -4, A3: -3, B3: -2,
  C4: -1, D4: 0, E4: 1, F4: 2, G4: 3, A4: 4, B4: 5,
  C5: 6, D5: 7, E5: 8, F5: 9, G5: 10, A5: 11, B5: 12,
  C6: 13,
}

function getPitchName(pitch: string): string {
  const note = pitch.replace(/[0-9#b]/g, '')
  const hasSharp = pitch.includes('#')
  const hasFlat = pitch.includes('b')
  const base = pitchToSolfege[note] || note
  if (hasSharp) return base + '#'
  if (hasFlat) return base + 'b'
  return base
}

function getBasePitch(pitch: string): string {
  return pitch.replace(/#|b/g, '').replace(/[0-9]/g, '') + pitch.match(/[0-9]/)?.[0]
}

// 五线谱显示组件
function StaffDisplay({
  notes,
  currentIndex,
  completedIndices,
}: {
  notes: Note[]
  currentIndex: number
  completedIndices: Set<number>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const currentEl = scrollRef.current.querySelector(`[data-index="${currentIndex}"]`)
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentIndex])

  // 五线谱线位置 (从下到上: E4, G4, B4, D5, F5)
  const staffLines = [1, 3, 5, 7, 9] // E4=1, G4=3, B4=5, D5=7, F5=9

  return (
    <div className="bg-white rounded-2xl p-4 shadow-cute overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">五线谱</p>
        <span className="text-xs text-gray-400">G谱号</span>
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-x-auto pb-2"
        style={{ height: '120px' }}
      >
        {/* 五线谱线 */}
        <div className="absolute left-0 right-0" style={{ minWidth: `${notes.length * 48 + 60}px` }}>
          {staffLines.map((line, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-gray-300"
              style={{ bottom: `${20 + line * 8}px` }}
            />
          ))}

          {/* 高音谱号 */}
          <div className="absolute left-2 text-3xl text-gray-600" style={{ bottom: '30px' }}>
            𝄞
          </div>

          {/* 音符 */}
          <div className="flex gap-2 pl-12">
            {notes.map((note, index) => {
              const isCompleted = completedIndices.has(index)
              const isCurrent = index === currentIndex
              const basePitch = getBasePitch(note.pitch)
              const position = pitchToStaffPosition[basePitch] ?? 0
              const hasSharp = note.pitch.includes('#')
              const hasFlat = note.pitch.includes('b')

              // 计算音符垂直位置
              const bottomPosition = 20 + position * 8

              // 是否需要加线
              const needLedgerBelow = position < 1 // C4及以下
              const needLedgerAbove = position > 9 // G5及以上

              return (
                <motion.div
                  key={index}
                  data-index={index}
                  className="relative flex-shrink-0 w-10"
                  style={{ height: '100px' }}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
                >
                  {/* 加线 (下加线) */}
                  {needLedgerBelow && position <= -1 && (
                    <div
                      className="absolute left-1 right-1 h-px bg-gray-400"
                      style={{ bottom: `${20 + (-1) * 8}px` }}
                    />
                  )}

                  {/* 加线 (上加线) */}
                  {needLedgerAbove && position >= 11 && (
                    <div
                      className="absolute left-1 right-1 h-px bg-gray-400"
                      style={{ bottom: `${20 + 11 * 8}px` }}
                    />
                  )}

                  {/* 升降号 */}
                  {(hasSharp || hasFlat) && (
                    <span
                      className={`absolute text-xs font-bold ${
                        isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-500' : 'text-gray-500'
                      }`}
                      style={{ bottom: `${bottomPosition - 2}px`, left: '-2px' }}
                    >
                      {hasSharp ? '♯' : '♭'}
                    </span>
                  )}

                  {/* 音符头 */}
                  <motion.div
                    className={`absolute left-1/2 -translate-x-1/2 w-5 h-4 rounded-full border-2 ${
                      isCurrent
                        ? 'bg-primary-500 border-primary-600'
                        : isCompleted
                        ? 'bg-green-400 border-green-500'
                        : 'bg-gray-800 border-gray-800'
                    }`}
                    style={{
                      bottom: `${bottomPosition - 2}px`,
                      transform: 'translateX(-50%) rotate(-15deg)',
                    }}
                  />

                  {/* 符干 */}
                  <div
                    className={`absolute w-0.5 ${
                      isCurrent
                        ? 'bg-primary-600'
                        : isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-800'
                    }`}
                    style={{
                      bottom: `${bottomPosition + 2}px`,
                      left: position < 5 ? 'calc(50% + 8px)' : 'calc(50% - 10px)',
                      height: '28px',
                    }}
                  />

                  {/* 指法提示 */}
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 text-[10px] font-medium ${
                      isCurrent ? 'text-primary-600' : 'text-gray-400'
                    }`}
                    style={{ bottom: '2px' }}
                  >
                    {note.finger}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// 简谱显示组件
function NumberedDisplay({
  notes,
  currentIndex,
  completedIndices,
}: {
  notes: Note[]
  currentIndex: number
  completedIndices: Set<number>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const currentEl = scrollRef.current.querySelector(`[data-index="${currentIndex}"]`)
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentIndex])

  return (
    <div className="bg-white rounded-2xl p-4 shadow-cute">
      <p className="text-xs text-gray-500 mb-2">简谱</p>
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide"
      >
        {notes.map((note, index) => {
          const isCompleted = completedIndices.has(index)
          const isCurrent = index === currentIndex

          return (
            <motion.div
              key={index}
              data-index={index}
              className={`flex-shrink-0 w-10 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-bold transition-all ${
                isCurrent
                  ? 'bg-primary-500 text-white scale-110 shadow-lg'
                  : isCompleted
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
              animate={isCurrent ? { scale: [1.1, 1.15, 1.1] } : {}}
              transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
            >
              <span className="text-base">{getPitchName(note.pitch)}</span>
              <span className="text-[10px] opacity-70">{note.finger}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// 小提琴指板组件 - 真实小提琴风格
function ViolinFingerboard({ currentNote, language }: { currentNote: Note; language: Language }) {
  // 弦的粗细 (G最粗, E最细)
  const stringThickness = {
    4: 'h-1.5', // G弦
    3: 'h-1',   // D弦
    2: 'h-0.5', // A弦
    1: 'h-[2px]', // E弦
  }

  // 弦的颜色
  const stringColors = {
    4: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600', // G弦 - 银色包裹
    3: 'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400',    // D弦 - 铝包裹
    2: 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300',    // A弦 - 铝包裹
    1: 'bg-gradient-to-r from-gray-200 via-white to-gray-200',       // E弦 - 钢弦
  }

  const strings = [4, 3, 2, 1] // G, D, A, E (从上到下)
  const positions = [0, 1, 2, 3, 4] // 空弦, 1指, 2指, 3指, 4指

  // 计算手指在指板上的水平位置 (百分比)
  const fingerPositions: Record<number, number> = {
    0: 5,   // 空弦 - 琴头位置
    1: 25,  // 1指
    2: 40,  // 2指
    3: 55,  // 3指
    4: 70,  // 4指
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-cute">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{t('practice.fingerboard', language)}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
            {stringNames[currentNote.string]}{t('practice.string', language)}
          </span>
          <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full font-medium">
            {getFingerLabel(currentNote.finger, language)}
          </span>
        </div>
      </div>

      {/* 小提琴指板 */}
      <div className="relative">
        {/* 指板背景 - 木纹效果 */}
        <div className="relative h-32 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #2d1810 0%, #4a2c1f 10%, #3d2317 50%, #4a2c1f 90%, #2d1810 100%)',
          }}
        >
          {/* 木纹纹理 */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.1) 2px,
                rgba(0,0,0,0.1) 4px
              )`,
            }}
          />

          {/* 琴枕 (nut) */}
          <div className="absolute left-3 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-sm shadow-md" />

          {/* 把位标记 */}
          <div className="absolute left-[25%] top-1 bottom-1 w-px bg-amber-900/30" />
          <div className="absolute left-[40%] top-1 bottom-1 w-px bg-amber-900/30" />
          <div className="absolute left-[55%] top-1 bottom-1 w-px bg-amber-900/30" />
          <div className="absolute left-[70%] top-1 bottom-1 w-px bg-amber-900/30" />

          {/* 弦 */}
          {strings.map((stringNum, index) => {
            const isActiveString = currentNote.string === stringNum
            const topPosition = 12 + index * 28 // 计算每根弦的垂直位置

            return (
              <div
                key={stringNum}
                className="absolute left-0 right-0"
                style={{ top: `${topPosition}px` }}
              >
                {/* 弦本体 */}
                <div
                  className={`${stringThickness[stringNum as keyof typeof stringThickness]} ${stringColors[stringNum as keyof typeof stringColors]} ${
                    isActiveString ? 'shadow-lg' : ''
                  }`}
                  style={{
                    boxShadow: isActiveString ? '0 0 8px rgba(139, 92, 246, 0.6)' : 'none',
                  }}
                />

                {/* 弦名标签 */}
                <span className={`absolute -left-1 -top-2 text-[10px] font-bold ${
                  isActiveString ? 'text-primary-300' : 'text-amber-200/60'
                }`}>
                  {stringNames[stringNum]}
                </span>
              </div>
            )
          })}

          {/* 手指按压位置指示 */}
          {currentNote.finger > 0 && (
            <motion.div
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${fingerPositions[currentNote.finger]}%`,
                top: `${12 + (4 - currentNote.string) * 28}px`,
              }}
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {/* 发光效果 */}
              <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-60" />
              {/* 手指圆点 */}
              <div className="absolute inset-1 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{currentNote.finger}</span>
              </div>
            </motion.div>
          )}

          {/* 空弦指示 */}
          {currentNote.finger === 0 && (
            <motion.div
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${fingerPositions[0]}%`,
                top: `${12 + (4 - currentNote.string) * 28}px`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-full h-full border-2 border-primary-400 rounded-full bg-primary-500/30" />
            </motion.div>
          )}
        </div>

        {/* 把位数字标签 */}
        <div className="flex justify-between px-2 mt-2">
          <span className="text-[10px] text-gray-400 w-8 text-center">{t('practice.openString', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">1{t('practice.finger', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">2{t('practice.finger', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">3{t('practice.finger', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">4{t('practice.finger', language)}</span>
        </div>
      </div>

      {/* 提示文字 */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          {currentNote.finger === 0
            ? t('practice.playOpenString', language, { string: stringNames[currentNote.string] })
            : t('practice.pressString', language, { finger: currentNote.finger, string: stringNames[currentNote.string] })
          }
        </p>
      </div>
    </div>
  )
}

// 反馈消息组件
function FeedbackMessage({
  type,
  combo,
  onComplete,
  language,
}: {
  type: 'success' | 'skip' | 'combo'
  combo?: number
  onComplete: () => void
  language: Language
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200)
    return () => clearTimeout(timer)
  }, [onComplete])

  const messages = {
    success: { text: t('practice.great', language), color: 'bg-green-500', icon: '✨' },
    skip: { text: t('practice.keepGoing', language), color: 'bg-amber-500', icon: '💪' },
    combo: { text: t('practice.amazing', language, { combo: combo || 0 }), color: 'bg-primary-500', icon: '🔥' },
  }

  const msg = messages[type]

  return (
    <motion.div
      className={`fixed top-1/3 left-1/2 -translate-x-1/2 ${msg.color} text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 z-50`}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
    >
      <span className="text-2xl">{msg.icon}</span>
      <span className="font-bold">{msg.text}</span>
    </motion.div>
  )
}

// 练习完成弹窗
function PracticeComplete({
  song,
  score,
  stars,
  xpEarned,
  onReplay,
  onHome,
  language,
}: {
  song: Song
  score: number
  stars: number
  xpEarned: number
  onReplay: () => void
  onHome: () => void
  language: Language
}) {
  useEffect(() => {
    playComplete()
  }, [])

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-3xl p-6 w-full max-w-sm text-center overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
      >
        <motion.div
          className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-gray-800 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t('practice.complete', language)}
        </motion.h2>
        <motion.p
          className="text-gray-500 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {song.name}
        </motion.p>

        <motion.div
          className="flex justify-center gap-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[1, 2, 3].map((s, index) => (
            <motion.div
              key={s}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6 + index * 0.15, type: 'spring' }}
            >
              <Star
                className={`w-10 h-10 ${
                  s <= stars
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-lg text-gray-600 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {t('practice.score', language)} <span className="font-bold text-gray-800">{score}%</span>
        </motion.p>

        <motion.div
          className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-primary-700">{t('practice.xpEarned', language)}</span>
          </div>
          <motion.p
            className="text-3xl font-bold text-gradient mt-1"
            initial={{ scale: 0.5 }}
            animate={{ scale: [0.5, 1.2, 1] }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            +{xpEarned} XP
          </motion.p>
        </motion.div>

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={onReplay}
            className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('practice.playAgain', language)}
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 bg-gradient-primary rounded-xl font-bold text-white flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t('practice.backHome', language)}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.songId as string
  const song = getSongById(songId)

  const { completePractice } = useGameStore()
  const { language } = useLanguageStore()

  // 练习状态
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set())
  const [skippedCount, setSkippedCount] = useState(0)
  const [comboCount, setComboCount] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'skip' | 'combo'; combo?: number } | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [practiceResult, setPracticeResult] = useState<{
    score: number
    stars: number
    xpEarned: number
  } | null>(null)

  // 乐谱显示模式: 'staff' = 五线谱, 'numbered' = 简谱
  const [notationMode, setNotationMode] = useState<'staff' | 'numbered'>('staff')

  // AI 聊天弹窗状态
  const [showAIChat, setShowAIChat] = useState(false)

  // 音高检测
  const {
    isListening,
    currentPitch,
    frequency,
    confidence,
    cents,
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
  const REQUIRED_CORRECT_TIME = 500 // 需要保持正确0.5秒

  // 初始化音频
  useEffect(() => {
    initAudio()
  }, [])

  // 更新目标音符
  useEffect(() => {
    if (song && currentIndex < song.notes.length) {
      setTargetNote(song.notes[currentIndex].pitch)
    }
  }, [currentIndex, song, setTargetNote])

  // 完成练习
  const finishPractice = useCallback(() => {
    if (!song) return

    const totalNotes = song.notes.length
    const completedCount = completedIndices.size
    const score = Math.round((completedCount / totalNotes) * 100)

    let stars = 0
    if (score >= 100) stars = 3
    else if (score >= 80) stars = 2
    else if (score >= 60) stars = 1

    const result = completePractice(songId, score)

    setPracticeResult({ score, stars, xpEarned: result.xpEarned })
    setShowComplete(true)
  }, [song, completedIndices, songId, completePractice])

  // 自动完成（音高检测成功）
  const handleAutoComplete = useCallback(() => {
    if (!song || currentIndex >= song.notes.length) return

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
  }, [song, currentIndex, comboCount, finishPractice, stopListening])

  // 音高正确时的自动确认逻辑
  useEffect(() => {
    if (isListening && isCorrect) {
      // 开始计时
      if (!correctTimerRef.current) {
        const startTime = Date.now()
        const checkTimer = () => {
          const elapsed = Date.now() - startTime
          setCorrectDuration(elapsed)

          if (elapsed >= REQUIRED_CORRECT_TIME) {
            // 达到要求时间，自动确认
            handleAutoComplete()
          } else {
            correctTimerRef.current = setTimeout(checkTimer, 50)
          }
        }
        correctTimerRef.current = setTimeout(checkTimer, 50)
      }
    } else {
      // 不正确，重置计时
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

  // 完成当前音符
  const handleComplete = useCallback(() => {
    if (!song || currentIndex >= song.notes.length) return

    const note = song.notes[currentIndex]

    // 播放音符
    playNote(note.pitch, note.duration * 0.8)

    // 更新完成状态
    setCompletedIndices((prev) => new Set(prev).add(currentIndex))

    // 更新连击
    const newCombo = comboCount + 1
    setComboCount(newCombo)

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
      setTimeout(finishPractice, 500)
    }
  }, [song, currentIndex, comboCount, finishPractice])

  // 跳过当前音符
  const handleSkip = useCallback(() => {
    if (!song || currentIndex >= song.notes.length) return

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
    if (!song) return
    const note = song.notes[currentIndex]
    playNote(note.pitch, note.duration)
  }, [song, currentIndex])

  // 重新练习
  const handleRestartPractice = useCallback(() => {
    stopListening()
    setCurrentIndex(0)
    setCompletedIndices(new Set())
    setSkippedCount(0)
    setComboCount(0)
    setShowComplete(false)
    setPracticeResult(null)
    setCorrectDuration(0)
  }, [stopListening])

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">曲目不存在</p>
      </div>
    )
  }

  const currentNote = song.notes[currentIndex]
  const progress = Math.round(((currentIndex + 1) / song.notes.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="text-center flex-1 mx-4">
            <h1 className="font-bold text-gray-800 truncate">{song.name}</h1>
            <p className="text-xs text-gray-500">
              {currentIndex + 1} / {song.notes.length} {t('practice.notes', language)}
            </p>
          </div>

          <div className="w-10" />
        </div>

        {/* 进度条 */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 主内容 */}
      <div className="p-4 space-y-4 pb-44">
        {/* 当前音符大显示 */}
        <motion.div
          className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-6 text-white text-center shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-white/70 text-sm mb-2">{t('practice.currentNote', language)}</p>
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
        </motion.div>

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
              {/* 音高偏差指示 */}
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

              {/* 检测到的音符 */}
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

              {/* 正确进度条 */}
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

            {/* 错误提示 */}
            {pitchError && (
              <p className="text-red-500 text-sm text-center mt-2">{pitchError}</p>
            )}
          </motion.div>
        )}

        {/* 乐谱显示切换 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{t('practice.notationMode', language)}</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setNotationMode('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                notationMode === 'staff'
                  ? 'bg-white shadow-sm text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              <Music className="w-4 h-4" />
              {t('practice.staff', language)}
            </button>
            <button
              onClick={() => setNotationMode('numbered')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                notationMode === 'numbered'
                  ? 'bg-white shadow-sm text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              <Hash className="w-4 h-4" />
              {t('practice.numbered', language)}
            </button>
          </div>
        </div>

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

      {/* 练习完成弹窗 */}
      <AnimatePresence>
        {showComplete && practiceResult && (
          <PracticeComplete
            song={song}
            score={practiceResult.score}
            stars={practiceResult.stars}
            xpEarned={practiceResult.xpEarned}
            onReplay={handleRestartPractice}
            onHome={() => router.push('/')}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* 问喵Do 悬浮按钮 */}
      {!showComplete && (
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
      )}

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
              {/* 关闭按钮 */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowAIChat(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* AI 聊天组件 */}
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
