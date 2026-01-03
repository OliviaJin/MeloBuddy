'use client'

import { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ParsedNote } from '@/types'

interface JianpuDisplayProps {
  notes: ParsedNote[]
  currentIndex: number
  showFingering?: boolean
  notesPerRow?: number
}

// 音名到简谱数字的映射
const pitchToJianpu: Record<string, number> = {
  C: 1,
  D: 2,
  E: 3,
  F: 4,
  G: 5,
  A: 6,
  B: 7,
}

// 解析音符获取简谱信息
function parseNoteToJianpu(pitch: string): {
  number: number
  octaveDots: number // 正数表示高八度点数，负数表示低八度点数
  accidental: string // 升降号
} {
  // 解析格式: C4, C#4, Cb4, D5 等
  const match = pitch.match(/^([A-G])(#|b)?(\d+)$/)
  if (!match) {
    return { number: 0, octaveDots: 0, accidental: '' }
  }

  const [, noteName, accidental = '', octaveStr] = match
  const octave = parseInt(octaveStr, 10)
  const number = pitchToJianpu[noteName] || 0

  // 计算八度点数 (以第4八度为基准，即中央C所在八度)
  // 小提琴常用音域: G3-E7
  // 基准八度设为4 (C4 = 中央C = 1)
  const baseOctave = 4
  const octaveDots = octave - baseOctave

  return { number, octaveDots, accidental }
}

// 获取时值符号
function getDurationSymbol(duration: number): string {
  if (duration >= 4) return ' - - -' // 全音符
  if (duration >= 2) return ' -' // 二分音符
  if (duration >= 1) return '' // 四分音符
  if (duration >= 0.5) return '_' // 八分音符（下划线）
  return '__' // 十六分音符（双下划线）
}

// 单个简谱音符组件
function JianpuNote({
  note,
  isActive,
  showFingering,
}: {
  note: ParsedNote
  isActive: boolean
  showFingering: boolean
}) {
  const { number, octaveDots, accidental } = parseNoteToJianpu(note.pitch)
  const isRest = number === 0

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center min-w-[2rem] py-1 px-0.5 rounded-lg transition-all ${
        isActive
          ? 'bg-primary-100 ring-2 ring-primary-400'
          : 'hover:bg-gray-50'
      }`}
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* 高八度点 */}
      <div className="h-3 flex flex-col items-center justify-end">
        {octaveDots > 0 &&
          Array.from({ length: Math.min(octaveDots, 3) }).map((_, i) => (
            <span
              key={i}
              className={`block w-1 h-1 rounded-full ${
                isActive ? 'bg-primary-600' : 'bg-gray-700'
              }`}
              style={{ marginBottom: i < octaveDots - 1 ? '1px' : '0' }}
            />
          ))}
      </div>

      {/* 音符数字 + 升降号 */}
      <div className="relative">
        {/* 升降号 */}
        {accidental && (
          <span
            className={`absolute -left-2.5 top-0 text-xs ${
              isActive ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            {accidental === '#' ? '♯' : '♭'}
          </span>
        )}

        {/* 数字 */}
        <span
          className={`text-xl font-bold ${
            isActive
              ? 'text-primary-600'
              : isRest
                ? 'text-gray-400'
                : 'text-gray-800'
          }`}
        >
          {isRest ? '0' : number}
        </span>

        {/* 时值下划线 (八分音符及更短) */}
        {note.duration < 1 && (
          <div className="absolute -bottom-1 left-0 right-0 flex flex-col items-center">
            <div
              className={`w-full h-0.5 ${isActive ? 'bg-primary-600' : 'bg-gray-700'}`}
            />
            {note.duration < 0.5 && (
              <div
                className={`w-full h-0.5 mt-0.5 ${isActive ? 'bg-primary-600' : 'bg-gray-700'}`}
              />
            )}
          </div>
        )}
      </div>

      {/* 低八度点 */}
      <div className="h-3 flex flex-col items-center justify-start">
        {octaveDots < 0 &&
          Array.from({ length: Math.min(-octaveDots, 3) }).map((_, i) => (
            <span
              key={i}
              className={`block w-1 h-1 rounded-full ${
                isActive ? 'bg-primary-600' : 'bg-gray-700'
              }`}
              style={{ marginTop: i > 0 ? '1px' : '0' }}
            />
          ))}
      </div>

      {/* 附点 (时值延长) */}
      {note.duration === 1.5 || note.duration === 0.75 || note.duration === 3 ? (
        <span
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${
            isActive ? 'bg-primary-600' : 'bg-gray-700'
          }`}
        />
      ) : null}

      {/* 指法标记 */}
      {showFingering && note.finger !== undefined && (
        <div
          className={`mt-1 text-xs font-medium ${
            isActive ? 'text-primary-500' : 'text-gray-400'
          }`}
        >
          {note.finger}
        </div>
      )}
    </motion.div>
  )
}

// 小节线组件
function BarLine() {
  return <div className="w-px h-12 bg-gray-300 mx-1 self-center" />
}

// 延音线组件
function TieLine({
  duration,
  isActive,
}: {
  duration: number
  isActive: boolean
}) {
  const dashCount = Math.floor(duration) - 1
  if (dashCount <= 0) return null

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: dashCount }).map((_, i) => (
        <span
          key={i}
          className={`text-xl font-bold ${isActive ? 'text-primary-600' : 'text-gray-400'}`}
        >
          -
        </span>
      ))}
    </div>
  )
}

export function JianpuDisplay({
  notes,
  currentIndex,
  showFingering = true,
  notesPerRow = 8,
}: JianpuDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeNoteRef = useRef<HTMLDivElement>(null)

  // 按小节分组
  const groupedNotes = useMemo(() => {
    const groups: ParsedNote[][] = []
    let currentMeasure = -1
    let currentGroup: ParsedNote[] = []

    notes.forEach((note) => {
      if (note.measureNumber !== currentMeasure) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [note]
        currentMeasure = note.measureNumber
      } else {
        currentGroup.push(note)
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }, [notes])

  // 自动滚动到当前音符
  useEffect(() => {
    if (activeNoteRef.current && containerRef.current) {
      const container = containerRef.current
      const activeNote = activeNoteRef.current
      const containerRect = container.getBoundingClientRect()
      const noteRect = activeNote.getBoundingClientRect()

      // 检查音符是否在可视区域外
      if (
        noteRect.left < containerRect.left ||
        noteRect.right > containerRect.right
      ) {
        activeNote.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }
  }, [currentIndex])

  // 计算当前音符在哪个小节
  const currentMeasure = notes[currentIndex]?.measureNumber ?? -1

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl p-4 shadow-cute border border-gray-100 overflow-x-auto"
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">简谱</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>1=C</span>
          <span>4/4</span>
        </div>
      </div>

      {/* 简谱内容 */}
      <div className="flex flex-wrap gap-y-4">
        {groupedNotes.map((measure, measureIndex) => (
          <div key={measureIndex} className="flex items-start">
            {/* 小节内的音符 */}
            <div className="flex items-start gap-0.5">
              {measure.map((note) => {
                const isActive = note.index === currentIndex
                return (
                  <div
                    key={note.index}
                    ref={isActive ? activeNoteRef : null}
                    className="flex items-start"
                  >
                    <JianpuNote
                      note={note}
                      isActive={isActive}
                      showFingering={showFingering}
                    />
                    {/* 延音线 */}
                    {note.duration >= 2 && (
                      <TieLine duration={note.duration} isActive={isActive} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 小节线 */}
            {measureIndex < groupedNotes.length - 1 && <BarLine />}
          </div>
        ))}

        {/* 结束双线 */}
        <div className="flex items-center self-center ml-1">
          <div className="w-px h-12 bg-gray-400" />
          <div className="w-1 h-12 bg-gray-600 ml-0.5" />
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="font-mono">1-7</span>
            <span>= Do-Si</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex flex-col items-center">
              <span className="w-1 h-1 bg-gray-500 rounded-full" />
              <span className="font-mono">5</span>
            </span>
            <span>= 高八度</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex flex-col items-center">
              <span className="font-mono">5</span>
              <span className="w-1 h-1 bg-gray-500 rounded-full" />
            </span>
            <span>= 低八度</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono">0</span>
            <span>= 休止符</span>
          </div>
          {showFingering && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">0-4</span>
              <span>= 指法</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JianpuDisplay
