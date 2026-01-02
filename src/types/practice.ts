import { Note, Song } from '@/data'

// 练习模式类型
export type PracticeMode = 'learn' | 'follow' | 'assess'

// 练习状态
export interface PracticeState {
  mode: PracticeMode
  currentIndex: number
  completedIndices: Set<number>
  skippedCount: number
  comboCount: number
  isComplete: boolean
  startTime: number | null
  endTime: number | null
}

// 练习结果
export interface PracticeResult {
  mode: PracticeMode
  songId: string
  score: number
  stars: number
  xpEarned: number
  totalNotes: number
  completedNotes: number
  skippedNotes: number
  maxCombo: number
  duration: number // 练习时长（毫秒）
  accuracy: number // 准确率百分比
}

// 反馈类型
export type FeedbackType = 'success' | 'skip' | 'combo' | 'perfect' | 'good' | 'miss'

// 反馈消息
export interface FeedbackMessage {
  type: FeedbackType
  combo?: number
  message?: string
}

// 音高检测结果
export interface PitchDetectionResult {
  isCorrect: boolean
  detectedNote: string | null
  targetNote: string
  centsDiff: number
  confidence: number
}

// 共享组件 Props
export interface NotationDisplayProps {
  notes: Note[]
  currentIndex: number
  completedIndices: Set<number>
}

export interface FingerboardProps {
  currentNote: Note
}

export interface PracticeCompleteProps {
  song: Song
  result: PracticeResult
  onReplay: () => void
  onHome: () => void
  onSelectMode: () => void
}

// 模式特定 Props
export interface LearnModeProps {
  song: Song
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

export interface FollowModeProps {
  song: Song
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

export interface AssessModeProps {
  song: Song
  onComplete: (result: Omit<PracticeResult, 'mode' | 'songId'>) => void
  onBack: () => void
}

// 模式选择器 Props
export interface ModeSelectorProps {
  song: Song
  onSelectMode: (mode: PracticeMode) => void
  onBack: () => void
}

// 乐谱显示模式
export type NotationMode = 'staff' | 'numbered'
