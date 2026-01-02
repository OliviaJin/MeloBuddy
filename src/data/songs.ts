// ===================
// 类型定义
// ===================

export interface Note {
  pitch: string      // 音名：C4, D4, E4... (科学音高记号)
  duration: number   // 时值：1=全音符, 0.5=二分, 0.25=四分, 0.125=八分
  finger: number     // 指法：0=空弦, 1=食指, 2=中指, 3=无名指, 4=小指
  string: number     // 弦：1=E弦, 2=A弦, 3=D弦, 4=G弦
}

export interface Song {
  id: string
  name: string           // 曲目名
  nameEn?: string        // 英文名
  composer: string       // 作曲家
  difficulty: 1 | 2 | 3 | 4 | 5  // 难度星级
  duration: number       // 预计时长(秒)
  xpReward: number       // 完成奖励XP
  category: '音阶' | '练习曲' | '乐曲'
  description?: string   // 曲目描述
  tips?: string[]        // 练习提示
  bpm?: number           // 建议速度
  timeSignature?: string // 拍号
  notes: Note[]          // 音符序列
  requiredLevel: number  // 解锁所需等级
  tempo?: number         // 别名：建议速度
}

// ===================
// 小提琴指法参考
// ===================
// G弦 (4弦): G3(0), A3(1), B3(2), C4(3), D4(4)
// D弦 (3弦): D4(0), E4(1), F#4/F4(2), G4(3), A4(4)
// A弦 (2弦): A4(0), B4(1), C#5/C5(2), D5(3), E5(4)
// E弦 (1弦): E5(0), F#5/F5(1), G#5/G5(2), A5(3), B5(4)

// ===================
// 曲目数据
// ===================

export const songs: Song[] = [
  // ===================
  // 1. G大调音阶 (一个八度)
  // ===================
  {
    id: 'g-major-scale',
    name: 'G大调音阶',
    nameEn: 'G Major Scale',
    composer: '基础练习',
    difficulty: 1,
    duration: 30,
    xpReward: 15,
    category: '音阶',
    description: '小提琴入门必练的第一个音阶，全部在G弦和D弦上演奏。',
    tips: [
      '保持弓速均匀',
      '注意换弦时的平稳过渡',
      '每个音都要拉满时值',
    ],
    bpm: 60,
    tempo: 60,
    timeSignature: '4/4',
    requiredLevel: 1,
    notes: [
      // 上行
      { pitch: 'G3', duration: 0.5, finger: 0, string: 4 },  // G弦空弦
      { pitch: 'A3', duration: 0.5, finger: 1, string: 4 },  // G弦1指
      { pitch: 'B3', duration: 0.5, finger: 2, string: 4 },  // G弦2指
      { pitch: 'C4', duration: 0.5, finger: 3, string: 4 },  // G弦3指
      { pitch: 'D4', duration: 0.5, finger: 0, string: 3 },  // D弦空弦
      { pitch: 'E4', duration: 0.5, finger: 1, string: 3 },  // D弦1指
      { pitch: 'F#4', duration: 0.5, finger: 2, string: 3 }, // D弦2指 (高)
      { pitch: 'G4', duration: 0.5, finger: 3, string: 3 },  // D弦3指
      // 下行
      { pitch: 'G4', duration: 0.5, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.5, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.5, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.5, finger: 0, string: 3 },
      { pitch: 'C4', duration: 0.5, finger: 3, string: 4 },
      { pitch: 'B3', duration: 0.5, finger: 2, string: 4 },
      { pitch: 'A3', duration: 0.5, finger: 1, string: 4 },
      { pitch: 'G3', duration: 1, finger: 0, string: 4 },    // 结尾长音
    ],
  },

  // ===================
  // 2. D大调音阶 (一个八度)
  // ===================
  {
    id: 'd-major-scale',
    name: 'D大调音阶',
    nameEn: 'D Major Scale',
    composer: '基础练习',
    difficulty: 1,
    duration: 30,
    xpReward: 15,
    category: '音阶',
    description: '在D弦和A弦上演奏的音阶，是小星星等曲目的基础。',
    tips: [
      '2指要保持高位（F#和C#）',
      '换弦时手臂要提前准备',
      '下行时注意音准',
    ],
    bpm: 60,
    tempo: 60,
    timeSignature: '4/4',
    requiredLevel: 1,
    notes: [
      // 上行
      { pitch: 'D4', duration: 0.5, finger: 0, string: 3 },  // D弦空弦
      { pitch: 'E4', duration: 0.5, finger: 1, string: 3 },  // D弦1指
      { pitch: 'F#4', duration: 0.5, finger: 2, string: 3 }, // D弦2指
      { pitch: 'G4', duration: 0.5, finger: 3, string: 3 },  // D弦3指
      { pitch: 'A4', duration: 0.5, finger: 0, string: 2 },  // A弦空弦
      { pitch: 'B4', duration: 0.5, finger: 1, string: 2 },  // A弦1指
      { pitch: 'C#5', duration: 0.5, finger: 2, string: 2 }, // A弦2指 (高)
      { pitch: 'D5', duration: 0.5, finger: 3, string: 2 },  // A弦3指
      // 下行
      { pitch: 'D5', duration: 0.5, finger: 3, string: 2 },
      { pitch: 'C#5', duration: 0.5, finger: 2, string: 2 },
      { pitch: 'B4', duration: 0.5, finger: 1, string: 2 },
      { pitch: 'A4', duration: 0.5, finger: 0, string: 2 },
      { pitch: 'G4', duration: 0.5, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.5, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.5, finger: 1, string: 3 },
      { pitch: 'D4', duration: 1, finger: 0, string: 3 },
    ],
  },

  // ===================
  // 3. 小星星 (Twinkle Twinkle Little Star)
  // ===================
  {
    id: 'twinkle-star',
    name: '小星星',
    nameEn: 'Twinkle Twinkle Little Star',
    composer: '莫扎特 (改编)',
    difficulty: 1,
    duration: 45,
    xpReward: 25,
    category: '乐曲',
    description: '铃木教材第一首曲目，使用A弦和E弦演奏。',
    tips: [
      '开始前先唱一遍旋律',
      '注意重复音的弓法变化',
      '保持节奏稳定',
    ],
    bpm: 80,
    tempo: 80,
    timeSignature: '4/4',
    requiredLevel: 1,
    notes: [
      // 一闪一闪亮晶晶 (A A E E F# F# E)
      { pitch: 'A4', duration: 0.25, finger: 0, string: 2 },
      { pitch: 'A4', duration: 0.25, finger: 0, string: 2 },
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'F#5', duration: 0.25, finger: 1, string: 1 },
      { pitch: 'F#5', duration: 0.25, finger: 1, string: 1 },
      { pitch: 'E5', duration: 0.5, finger: 0, string: 1 },

      // 满天都是小星星 (D D C# C# B B A)
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'B4', duration: 0.25, finger: 1, string: 2 },
      { pitch: 'B4', duration: 0.25, finger: 1, string: 2 },
      { pitch: 'A4', duration: 0.5, finger: 0, string: 2 },

      // 挂在天上放光明 (E E D D C# C# B)
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'B4', duration: 0.5, finger: 1, string: 2 },

      // 好像许多小眼睛 (E E D D C# C# B)
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'B4', duration: 0.5, finger: 1, string: 2 },

      // 一闪一闪亮晶晶 (A A E E F# F# E)
      { pitch: 'A4', duration: 0.25, finger: 0, string: 2 },
      { pitch: 'A4', duration: 0.25, finger: 0, string: 2 },
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'E5', duration: 0.25, finger: 0, string: 1 },
      { pitch: 'F#5', duration: 0.25, finger: 1, string: 1 },
      { pitch: 'F#5', duration: 0.25, finger: 1, string: 1 },
      { pitch: 'E5', duration: 0.5, finger: 0, string: 1 },

      // 满天都是小星星 (D D C# C# B B A)
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'D5', duration: 0.25, finger: 3, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'C#5', duration: 0.25, finger: 2, string: 2 },
      { pitch: 'B4', duration: 0.25, finger: 1, string: 2 },
      { pitch: 'B4', duration: 0.25, finger: 1, string: 2 },
      { pitch: 'A4', duration: 1, finger: 0, string: 2 },
    ],
  },

  // ===================
  // 4. 欢乐颂 (简化版)
  // ===================
  {
    id: 'ode-to-joy',
    name: '欢乐颂',
    nameEn: 'Ode to Joy',
    composer: '贝多芬',
    difficulty: 2,
    duration: 50,
    xpReward: 30,
    category: '乐曲',
    description: '贝多芬第九交响曲主题，简化版适合初学者。',
    tips: [
      '注意3指和4指的准确性',
      '保持歌唱性的连弓',
      '渐强渐弱要自然',
    ],
    bpm: 72,
    tempo: 72,
    timeSignature: '4/4',
    requiredLevel: 2,
    notes: [
      // 第一乐句：E E F G | G F E D
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },

      // C C D E | E D D
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'E4', duration: 0.375, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.125, finger: 0, string: 3 },
      { pitch: 'D4', duration: 0.5, finger: 0, string: 3 },

      // 第二乐句：E E F G | G F E D
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },

      // C C D E | D C C
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.375, finger: 0, string: 3 },
      { pitch: 'C4', duration: 0.125, finger: 3, string: 4 },
      { pitch: 'C4', duration: 0.5, finger: 3, string: 4 },

      // 第三乐句：D D E C | D E F E C
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.125, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.125, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },

      // D E F E D | C D G
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.125, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.125, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'G3', duration: 0.5, finger: 0, string: 4 },

      // 第四乐句（再现）：E E F G | G F E D
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },

      // C C D E | D C C
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'C4', duration: 0.25, finger: 3, string: 4 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'D4', duration: 0.375, finger: 0, string: 3 },
      { pitch: 'C4', duration: 0.125, finger: 3, string: 4 },
      { pitch: 'C4', duration: 1, finger: 3, string: 4 },
    ],
  },

  // ===================
  // 5. 两只老虎
  // ===================
  {
    id: 'two-tigers',
    name: '两只老虎',
    nameEn: 'Two Tigers (Frère Jacques)',
    composer: '法国民谣',
    difficulty: 1,
    duration: 35,
    xpReward: 20,
    category: '乐曲',
    description: '经典儿歌，适合练习基本音阶和节奏。',
    tips: [
      '四句旋律各唱两遍',
      '注意节奏的稳定性',
      '轻快活泼的弓法',
    ],
    bpm: 100,
    tempo: 100,
    timeSignature: '4/4',
    requiredLevel: 1,
    notes: [
      // 两只老虎 (D E F# D) x2
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'E4', duration: 0.25, finger: 1, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },

      // 跑得快 (F# G A) x2
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'A4', duration: 0.5, finger: 0, string: 2 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'G4', duration: 0.25, finger: 3, string: 3 },
      { pitch: 'A4', duration: 0.5, finger: 0, string: 2 },

      // 一只没有眼睛 (A B A G F# D) x2
      { pitch: 'A4', duration: 0.125, finger: 0, string: 2 },
      { pitch: 'B4', duration: 0.125, finger: 1, string: 2 },
      { pitch: 'A4', duration: 0.125, finger: 0, string: 2 },
      { pitch: 'G4', duration: 0.125, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'A4', duration: 0.125, finger: 0, string: 2 },
      { pitch: 'B4', duration: 0.125, finger: 1, string: 2 },
      { pitch: 'A4', duration: 0.125, finger: 0, string: 2 },
      { pitch: 'G4', duration: 0.125, finger: 3, string: 3 },
      { pitch: 'F#4', duration: 0.25, finger: 2, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },

      // 真奇怪 (D A D) x2
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'A3', duration: 0.25, finger: 1, string: 4 },
      { pitch: 'D4', duration: 0.5, finger: 0, string: 3 },
      { pitch: 'D4', duration: 0.25, finger: 0, string: 3 },
      { pitch: 'A3', duration: 0.25, finger: 1, string: 4 },
      { pitch: 'D4', duration: 0.5, finger: 0, string: 3 },
    ],
  },
]

// ===================
// 工具函数
// ===================

/**
 * 根据ID获取曲目
 */
export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id)
}

/**
 * 根据难度筛选曲目
 */
export function getSongsByDifficulty(difficulty: number): Song[] {
  return songs.filter((song) => song.difficulty === difficulty)
}

/**
 * 根据分类筛选曲目
 */
export function getSongsByCategory(category: Song['category']): Song[] {
  return songs.filter((song) => song.category === category)
}

/**
 * 获取弦名
 */
export function getStringName(stringNumber: number): string {
  const names = ['', 'E弦', 'A弦', 'D弦', 'G弦']
  return names[stringNumber] || ''
}

/**
 * 获取指法名称
 */
export function getFingerName(finger: number): string {
  const names = ['空弦', '1指', '2指', '3指', '4指']
  return names[finger] || ''
}

/**
 * 计算曲目总时长（根据音符）
 */
export function calculateSongDuration(notes: Note[], bpm: number = 60): number {
  const totalBeats = notes.reduce((sum, note) => sum + note.duration, 0)
  return (totalBeats / (bpm / 60)) * 4 // 假设4/4拍
}

/**
 * 获取曲目中使用的所有弦
 */
export function getUsedStrings(notes: Note[]): number[] {
  const strings = new Set(notes.map((note) => note.string))
  return Array.from(strings).sort()
}

/**
 * 获取曲目中使用的所有指法
 */
export function getUsedFingers(notes: Note[]): number[] {
  const fingers = new Set(notes.map((note) => note.finger))
  return Array.from(fingers).sort()
}

// ===================
// 默认导出
// ===================

export default songs
