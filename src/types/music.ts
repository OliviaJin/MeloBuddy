// 曲目元数据
export interface SongMeta {
  id: string
  title: string
  titleEn?: string
  composer?: string
  difficulty: 1 | 2 | 3 | 4 | 5 // 难度星级
  duration: number // 预计时长(秒)
  category: 'scale' | 'etude' | 'piece' | 'exam'
  tags: string[]
  grade?: string // 考级级别
  xpReward: number
  musicXmlUrl: string // MusicXML文件路径
  audioUrl?: string // 示范音频
  thumbnailUrl?: string
}

// 解析后的音符
export interface ParsedNote {
  index: number
  pitch: string // "G4", "A4", "B4" 等
  frequency: number // Hz
  duration: number // 拍数
  startBeat: number // 开始位置
  measureNumber: number // 小节号

  // 小提琴专属
  string?: 1 | 2 | 3 | 4 // 弦 (1=E, 2=A, 3=D, 4=G)
  finger?: 0 | 1 | 2 | 3 | 4 // 指法
  bowDirection?: 'up' | 'down' // 弓向
}

// 解析后的完整曲目
export interface ParsedSong {
  title: string
  composer: string
  notes: ParsedNote[]
  tempo: number
  timeSignature: [number, number]
  keySignature: string
  totalBeats: number
}
