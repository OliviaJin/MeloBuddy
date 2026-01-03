'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trophy, Sparkles, RotateCcw, Home, ArrowLeft } from 'lucide-react'
import { Note, Song } from '@/data'
import { Language, t } from '@/i18n/translations'
import { playComplete } from '@/lib/audio'
import { PracticeResult, NotationMode } from '@/types/practice'

// 弦名映射
export const stringNames = ['', 'E', 'A', 'D', 'G']

// 指法名称
export const getFingerLabel = (finger: number, lang: Language) => {
  if (finger === 0) return t('practice.openString', lang)
  return `${finger}${t('practice.finger', lang)}`
}

// 简谱音符映射
const pitchToSolfege: Record<string, string> = {
  C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7',
}

// 五线谱位置映射
const pitchToStaffPosition: Record<string, number> = {
  G3: -4, A3: -3, B3: -2,
  C4: -1, D4: 0, E4: 1, F4: 2, G4: 3, A4: 4, B4: 5,
  C5: 6, D5: 7, E5: 8, F5: 9, G5: 10, A5: 11, B5: 12,
  C6: 13,
}

export function getPitchName(pitch: string): string {
  const note = pitch.replace(/[0-9#b]/g, '')
  const hasSharp = pitch.includes('#')
  const hasFlat = pitch.includes('b')
  const base = pitchToSolfege[note] || note
  if (hasSharp) return base + '#'
  if (hasFlat) return base + 'b'
  return base
}

export function getBasePitch(pitch: string): string {
  return pitch.replace(/#|b/g, '').replace(/[0-9]/g, '') + pitch.match(/[0-9]/)?.[0]
}

// 顶部进度栏
interface PracticeHeaderProps {
  song: Song
  currentIndex: number
  totalNotes: number
  onBack: () => void
  language: Language
}

export function PracticeHeader({ song, currentIndex, totalNotes, onBack, language }: PracticeHeaderProps) {
  const progress = totalNotes > 0 ? Math.round(((currentIndex + 1) / totalNotes) * 100) : 0

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        <div className="text-center flex-1 mx-4">
          <h1 className="font-bold text-gray-800 truncate">{song.title}</h1>
          <p className="text-xs text-gray-500">
            {currentIndex + 1} / {totalNotes} {t('practice.notes', language)}
          </p>
        </div>

        <div className="w-10" />
      </div>

      <div className="h-1 bg-gray-100">
        <motion.div
          className="h-full bg-gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// 五线谱显示组件
interface StaffDisplayProps {
  notes: Note[]
  currentIndex: number
  completedIndices: Set<number>
}

export function StaffDisplay({ notes, currentIndex, completedIndices }: StaffDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const currentEl = scrollRef.current.querySelector(`[data-index="${currentIndex}"]`)
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentIndex])

  const staffLines = [1, 3, 5, 7, 9]

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
        <div className="absolute left-0 right-0" style={{ minWidth: `${notes.length * 48 + 60}px` }}>
          {staffLines.map((line, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-gray-300"
              style={{ bottom: `${20 + line * 8}px` }}
            />
          ))}

          <div className="absolute left-2 text-3xl text-gray-600" style={{ bottom: '30px' }}>
            𝄞
          </div>

          <div className="flex gap-2 pl-12">
            {notes.map((note, index) => {
              const isCompleted = completedIndices.has(index)
              const isCurrent = index === currentIndex
              const basePitch = getBasePitch(note.pitch)
              const position = pitchToStaffPosition[basePitch] ?? 0
              const hasSharp = note.pitch.includes('#')
              const hasFlat = note.pitch.includes('b')
              const bottomPosition = 20 + position * 8
              const needLedgerBelow = position < 1
              const needLedgerAbove = position > 9

              return (
                <motion.div
                  key={index}
                  data-index={index}
                  className="relative flex-shrink-0 w-10"
                  style={{ height: '100px' }}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
                >
                  {needLedgerBelow && position <= -1 && (
                    <div
                      className="absolute left-1 right-1 h-px bg-gray-400"
                      style={{ bottom: `${20 + (-1) * 8}px` }}
                    />
                  )}

                  {needLedgerAbove && position >= 11 && (
                    <div
                      className="absolute left-1 right-1 h-px bg-gray-400"
                      style={{ bottom: `${20 + 11 * 8}px` }}
                    />
                  )}

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
interface NumberedDisplayProps {
  notes: Note[]
  currentIndex: number
  completedIndices: Set<number>
}

export function NumberedDisplay({ notes, currentIndex, completedIndices }: NumberedDisplayProps) {
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

// 小提琴指板组件
interface ViolinFingerboardProps {
  currentNote: Note
  language: Language
}

export function ViolinFingerboard({ currentNote, language }: ViolinFingerboardProps) {
  const stringThickness = {
    4: 'h-1.5',
    3: 'h-1',
    2: 'h-0.5',
    1: 'h-[2px]',
  }

  const stringColors = {
    4: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600',
    3: 'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400',
    2: 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300',
    1: 'bg-gradient-to-r from-gray-200 via-white to-gray-200',
  }

  const strings = [4, 3, 2, 1]

  const fingerPositions: Record<number, number> = {
    0: 5,
    1: 25,
    2: 40,
    3: 55,
    4: 70,
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

      <div className="relative">
        <div className="relative h-32 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #2d1810 0%, #4a2c1f 10%, #3d2317 50%, #4a2c1f 90%, #2d1810 100%)',
          }}
        >
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

          <div className="absolute left-3 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-sm shadow-md" />

          <div className="absolute left-[25%] top-1 bottom-1 w-px bg-amber-900/30" />
          <div className="absolute left-[40%] top-1 bottom-1 w-px bg-amber-900/30" />
          <div className="absolute left-[55%] top-1 bottom-1 w-px bg-amber-900/30" />
          <div className="absolute left-[70%] top-1 bottom-1 w-px bg-amber-900/30" />

          {strings.map((stringNum, index) => {
            const isActiveString = currentNote.string === stringNum
            const topPosition = 12 + index * 28

            return (
              <div
                key={stringNum}
                className="absolute left-0 right-0"
                style={{ top: `${topPosition}px` }}
              >
                <div
                  className={`${stringThickness[stringNum as keyof typeof stringThickness]} ${stringColors[stringNum as keyof typeof stringColors]} ${
                    isActiveString ? 'shadow-lg' : ''
                  }`}
                  style={{
                    boxShadow: isActiveString ? '0 0 8px rgba(139, 92, 246, 0.6)' : 'none',
                  }}
                />

                <span className={`absolute -left-1 -top-2 text-[10px] font-bold ${
                  isActiveString ? 'text-primary-300' : 'text-amber-200/60'
                }`}>
                  {stringNames[stringNum]}
                </span>
              </div>
            )
          })}

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
              <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-60" />
              <div className="absolute inset-1 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{currentNote.finger}</span>
              </div>
            </motion.div>
          )}

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

        <div className="flex justify-between px-2 mt-2">
          <span className="text-[10px] text-gray-400 w-8 text-center">{t('practice.openString', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">1{t('practice.finger', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">2{t('practice.finger', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">3{t('practice.finger', language)}</span>
          <span className="text-[10px] text-gray-400 w-8 text-center">4{t('practice.finger', language)}</span>
        </div>
      </div>

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
interface FeedbackMessageProps {
  type: 'success' | 'skip' | 'combo'
  combo?: number
  onComplete: () => void
  language: Language
}

export function FeedbackMessage({ type, combo, onComplete, language }: FeedbackMessageProps) {
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
interface PracticeCompleteProps {
  song: Song
  result: PracticeResult
  onReplay: () => void
  onHome: () => void
  onSelectMode: () => void
  language: Language
}

export function PracticeComplete({
  song,
  result,
  onReplay,
  onHome,
  onSelectMode,
  language,
}: PracticeCompleteProps) {
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
          {song.title}
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
                  s <= result.stars
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
          {t('practice.score', language)} <span className="font-bold text-gray-800">{result.score}%</span>
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
            +{result.xpEarned} XP
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex gap-3">
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
          </div>
          <button
            onClick={onSelectMode}
            className="w-full py-2 text-primary-600 font-medium text-sm"
          >
            {t('practice.backToModes', language)}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// 乐谱模式切换器
interface NotationSwitcherProps {
  mode: NotationMode
  onModeChange: (mode: NotationMode) => void
  language: Language
}

export function NotationSwitcher({ mode, onModeChange, language }: NotationSwitcherProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{t('practice.notationMode', language)}</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onModeChange('staff')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === 'staff'
              ? 'bg-white shadow-sm text-primary-600'
              : 'text-gray-500'
          }`}
        >
          {t('practice.staff', language)}
        </button>
        <button
          onClick={() => onModeChange('numbered')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === 'numbered'
              ? 'bg-white shadow-sm text-primary-600'
              : 'text-gray-500'
          }`}
        >
          {t('practice.numbered', language)}
        </button>
      </div>
    </div>
  )
}

// 当前音符大显示
interface CurrentNoteDisplayProps {
  note: Note
  currentIndex: number
  language: Language
}

export function CurrentNoteDisplay({ note, currentIndex, language }: CurrentNoteDisplayProps) {
  return (
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
        {note.pitch}
      </motion.div>
      <div className="flex justify-center gap-3">
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
          {stringNames[note.string]}{t('practice.string', language)}
        </span>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
          {getFingerLabel(note.finger, language)}
        </span>
      </div>
    </motion.div>
  )
}
