import { XMLParser } from 'fast-xml-parser'
import JSZip from 'jszip'
import { ParsedNote, ParsedSong } from '@/types'

// ===================
// 音高频率计算
// ===================

// A4 = 440Hz 为基准
const A4_FREQUENCY = 440
const A4_MIDI = 69 // A4 的 MIDI 音符号

// 音名到半音偏移（相对于 C）
const NOTE_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/**
 * 将音符名称转换为 MIDI 音符号
 * @param step 音名 (C, D, E, F, G, A, B)
 * @param octave 八度 (0-9)
 * @param alter 升降号 (-1=降, 0=还原, 1=升)
 */
function noteToMidi(step: string, octave: number, alter: number = 0): number {
  const semitone = NOTE_SEMITONES[step.toUpperCase()] ?? 0
  // MIDI: C4 = 60, 每个八度12个半音
  return (octave + 1) * 12 + semitone + alter
}

/**
 * 将 MIDI 音符号转换为频率 (Hz)
 * 公式: f = 440 * 2^((midi - 69) / 12)
 */
function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12)
}

/**
 * 将音符名称转换为频率
 */
function noteToFrequency(step: string, octave: number, alter: number = 0): number {
  const midi = noteToMidi(step, octave, alter)
  return Math.round(midiToFrequency(midi) * 100) / 100
}

/**
 * 生成音高名称字符串 (如 "G4", "A#4", "Bb4")
 */
function formatPitchName(step: string, octave: number, alter: number = 0): string {
  let accidental = ''
  if (alter === 1) accidental = '#'
  else if (alter === -1) accidental = 'b'
  else if (alter === 2) accidental = '##'
  else if (alter === -2) accidental = 'bb'
  return `${step}${accidental}${octave}`
}

// ===================
// MusicXML 解析
// ===================

// XML 解析器配置
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => {
    // 这些元素可能出现多次，需要总是作为数组处理
    const arrayElements = [
      'part',
      'measure',
      'note',
      'technical',
      'articulations',
      'direction',
      'sound',
      'credit',
      'work',
      'identification',
      'creator',
    ]
    return arrayElements.includes(name)
  },
})

/**
 * 安全获取嵌套对象的值
 */
function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue
    }
    current = (current as Record<string, unknown>)[key]
  }
  return (current as T) ?? defaultValue
}

/**
 * 确保值是数组
 */
function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * 从 MusicXML 提取调号名称
 */
function getKeySignatureName(fifths: number, mode: string = 'major'): string {
  const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
  const majorFlats = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']
  const minorKeys = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']
  const minorFlats = ['A', 'D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab']

  if (mode === 'minor') {
    if (fifths >= 0) return minorKeys[fifths] || 'A'
    return minorFlats[-fifths] || 'A'
  }

  if (fifths >= 0) return majorKeys[fifths] || 'C'
  return majorFlats[-fifths] || 'C'
}

/**
 * 将音符时值类型转换为拍数
 */
function getDurationInBeats(noteType: string, dots: number = 0, divisions: number = 1): number {
  const baseBeats: Record<string, number> = {
    maxima: 32,
    long: 16,
    breve: 8,
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    '16th': 0.25,
    '32nd': 0.125,
    '64th': 0.0625,
    '128th': 0.03125,
    '256th': 0.015625,
  }

  let duration = baseBeats[noteType] ?? 1

  // 处理附点
  let dotValue = duration / 2
  for (let i = 0; i < dots; i++) {
    duration += dotValue
    dotValue /= 2
  }

  return duration
}

/**
 * 解析小提琴技术标记
 */
interface TechnicalInfo {
  string?: 1 | 2 | 3 | 4
  finger?: 0 | 1 | 2 | 3 | 4
  bowDirection?: 'up' | 'down'
}

function parseTechnical(notations: unknown): TechnicalInfo {
  const result: TechnicalInfo = {}

  if (!notations || typeof notations !== 'object') return result

  const technical = safeGet<unknown[]>(notations, 'technical', [])
  const technicalArray = ensureArray(technical)

  for (const tech of technicalArray) {
    if (!tech || typeof tech !== 'object') continue
    const techObj = tech as Record<string, unknown>

    // 弦号 (1=E, 2=A, 3=D, 4=G)
    if (techObj.string !== undefined) {
      const stringNum = parseInt(String(techObj.string), 10)
      if (stringNum >= 1 && stringNum <= 4) {
        result.string = stringNum as 1 | 2 | 3 | 4
      }
    }

    // 指法 (0=空弦, 1-4=手指)
    if (techObj.fingering !== undefined) {
      const finger = parseInt(String(techObj.fingering), 10)
      if (finger >= 0 && finger <= 4) {
        result.finger = finger as 0 | 1 | 2 | 3 | 4
      }
    }

    // 弓向
    if (techObj['up-bow'] !== undefined) {
      result.bowDirection = 'up'
    }
    if (techObj['down-bow'] !== undefined) {
      result.bowDirection = 'down'
    }
  }

  // 也检查 articulations 中的弓向标记
  const articulations = safeGet<unknown>(notations, 'articulations', null)
  if (articulations && typeof articulations === 'object') {
    const artObj = articulations as Record<string, unknown>
    if (artObj['up-bow'] !== undefined) {
      result.bowDirection = 'up'
    }
    if (artObj['down-bow'] !== undefined) {
      result.bowDirection = 'down'
    }
  }

  return result
}

/**
 * 解析 MusicXML 字符串内容
 */
export function parseMusicXML(xmlContent: string): ParsedSong {
  const doc = xmlParser.parse(xmlContent)

  // 获取根元素 (score-partwise 或 score-timewise)
  const scorePartwise = doc['score-partwise']
  if (!scorePartwise) {
    throw new Error('Invalid MusicXML: missing score-partwise element')
  }

  // 提取元数据
  const work = safeGet<Record<string, unknown>>(scorePartwise, 'work', {})
  const identification = safeGet<Record<string, unknown>>(scorePartwise, 'identification', {})

  const title = safeGet<string>(work, 'work-title', '') ||
                safeGet<string>(scorePartwise, 'movement-title', '') ||
                'Untitled'

  // 提取作曲家
  let composer = ''
  const creators = ensureArray(safeGet<unknown>(identification, 'creator', []))
  for (const creator of creators) {
    if (typeof creator === 'string') {
      composer = creator
      break
    }
    if (typeof creator === 'object' && creator !== null) {
      const creatorObj = creator as Record<string, unknown>
      if (creatorObj['@_type'] === 'composer') {
        composer = String(creatorObj['#text'] || '')
        break
      }
    }
  }

  // 获取第一个 part
  const parts = ensureArray(scorePartwise.part)
  if (parts.length === 0) {
    throw new Error('Invalid MusicXML: no parts found')
  }

  const part = parts[0] as Record<string, unknown>
  const measures = ensureArray(part.measure)

  // 解析属性
  let tempo = 120 // 默认速度
  let divisions = 1 // 每拍的 division 单位
  let timeSignature: [number, number] = [4, 4]
  let keySignature = 'C'

  const notes: ParsedNote[] = []
  let noteIndex = 0
  let currentBeat = 0

  // 遍历所有小节
  for (let measureIdx = 0; measureIdx < measures.length; measureIdx++) {
    const measure = measures[measureIdx] as Record<string, unknown>
    const measureNumber = parseInt(String(measure['@_number'] || measureIdx + 1), 10)

    // 解析小节属性
    const attributes = safeGet<Record<string, unknown>>(measure, 'attributes', {})
    if (attributes.divisions !== undefined) {
      divisions = parseInt(String(attributes.divisions), 10) || 1
    }

    // 拍号
    const time = safeGet<Record<string, unknown> | null>(attributes, 'time', null)
    if (time) {
      const beats = parseInt(String(time.beats), 10) || 4
      const beatType = parseInt(String(time['beat-type']), 10) || 4
      timeSignature = [beats, beatType]
    }

    // 调号
    const key = safeGet<Record<string, unknown> | null>(attributes, 'key', null)
    if (key) {
      const fifths = parseInt(String(key.fifths), 10) || 0
      const mode = String(key.mode || 'major')
      keySignature = getKeySignatureName(fifths, mode)
    }

    // 解析方向标记（速度等）
    const directions = ensureArray(measure.direction)
    for (const direction of directions) {
      if (!direction || typeof direction !== 'object') continue
      const dirObj = direction as Record<string, unknown>
      const sound = safeGet<Record<string, unknown> | null>(dirObj, 'sound', null)
      if (sound && sound['@_tempo'] !== undefined) {
        tempo = parseFloat(String(sound['@_tempo'])) || tempo
      }
    }

    // 解析音符
    const measureNotes = ensureArray(measure.note)
    let measureBeatPosition = 0

    for (const note of measureNotes) {
      if (!note || typeof note !== 'object') continue
      const noteObj = note as Record<string, unknown>

      // 跳过休止符
      if (noteObj.rest !== undefined) {
        const duration = parseInt(String(noteObj.duration), 10) || divisions
        measureBeatPosition += duration / divisions
        continue
      }

      // 跳过和弦中的非首音符（chord 标记）
      // 注意：chord 音符共享相同的起始位置
      const isChord = noteObj.chord !== undefined

      // 获取音高信息
      const pitch = safeGet<Record<string, unknown> | null>(noteObj, 'pitch', null)
      if (!pitch) continue

      const step = String(pitch.step || 'C')
      const octave = parseInt(String(pitch.octave), 10) || 4
      const alter = parseInt(String(pitch.alter || 0), 10)

      // 计算频率和音高名称
      const frequency = noteToFrequency(step, octave, alter)
      const pitchName = formatPitchName(step, octave, alter)

      // 计算时值
      const duration = parseInt(String(noteObj.duration), 10) || divisions
      const durationInBeats = duration / divisions

      // 解析技术标记
      const notations = safeGet<Record<string, unknown> | null>(noteObj, 'notations', null)
      const technical = parseTechnical(notations)

      // 创建音符对象
      const parsedNote: ParsedNote = {
        index: noteIndex,
        pitch: pitchName,
        frequency,
        duration: durationInBeats,
        startBeat: currentBeat + (isChord ? 0 : measureBeatPosition),
        measureNumber,
        ...technical,
      }

      notes.push(parsedNote)
      noteIndex++

      // 更新位置（和弦音符不增加位置）
      if (!isChord) {
        measureBeatPosition += durationInBeats
      }
    }

    // 更新总拍数位置
    currentBeat += timeSignature[0] // 每小节的拍数
  }

  // 计算总拍数
  const totalBeats = notes.length > 0
    ? Math.max(...notes.map(n => n.startBeat + n.duration))
    : 0

  return {
    title,
    composer,
    notes,
    tempo,
    timeSignature,
    keySignature,
    totalBeats,
  }
}

/**
 * 从 URL 加载并解析 MusicXML 文件
 * 支持 .xml 和 .mxl (压缩) 格式
 */
export async function loadMusicXML(url: string): Promise<ParsedSong> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load MusicXML: ${response.status} ${response.statusText}`)
  }

  // 检查是否是压缩的 .mxl 文件
  const isMxl = url.toLowerCase().endsWith('.mxl')

  if (isMxl) {
    // 解压 MXL 文件
    const arrayBuffer = await response.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // 读取 container.xml 找到主文件路径
    const containerFile = zip.file('META-INF/container.xml')
    if (!containerFile) {
      throw new Error('Invalid MXL file: missing META-INF/container.xml')
    }

    const containerXml = await containerFile.async('string')
    const containerDoc = xmlParser.parse(containerXml)

    // 从 container.xml 提取主文件路径
    const rootfile = safeGet<Record<string, unknown>>(
      containerDoc,
      'container.rootfiles.rootfile',
      {}
    )

    let mainFilePath = safeGet<string>(rootfile, '@_full-path', '')

    // 如果没找到，尝试直接查找 .xml 文件
    if (!mainFilePath) {
      const files = Object.keys(zip.files)
      mainFilePath = files.find(f => f.endsWith('.xml') && !f.includes('META-INF')) || ''
    }

    if (!mainFilePath) {
      throw new Error('Invalid MXL file: could not find main XML file')
    }

    // 读取主 XML 文件
    const mainFile = zip.file(mainFilePath)
    if (!mainFile) {
      throw new Error(`Invalid MXL file: missing main file ${mainFilePath}`)
    }

    const xmlContent = await mainFile.async('string')
    return parseMusicXML(xmlContent)
  }

  // 普通 XML 文件
  const xmlContent = await response.text()
  return parseMusicXML(xmlContent)
}

// ===================
// 辅助工具函数
// ===================

/**
 * 获取音符在小提琴上的推荐弦和指法
 * 基于音高自动推算（如果 MusicXML 中没有标注）
 */
export function getViolinFingering(pitch: string): { string: 1 | 2 | 3 | 4; finger: 0 | 1 | 2 | 3 | 4 } {
  // 小提琴空弦: G3, D4, A4, E5
  const violinStrings = {
    G: { open: 'G3', range: ['G3', 'G4'] },
    D: { open: 'D4', range: ['D4', 'D5'] },
    A: { open: 'A4', range: ['A4', 'A5'] },
    E: { open: 'E5', range: ['E5', 'E6'] },
  }

  // 提取音符信息
  const match = pitch.match(/^([A-G])([#b]?)(\d)$/)
  if (!match) return { string: 3, finger: 1 }

  const [, note, accidental, octaveStr] = match
  const octave = parseInt(octaveStr, 10)
  const semitone = NOTE_SEMITONES[note] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0)
  const midi = (octave + 1) * 12 + semitone

  // G3 = 55, D4 = 62, A4 = 69, E5 = 76
  const openStrings = [
    { string: 4 as const, midi: 55, name: 'G' }, // G 弦
    { string: 3 as const, midi: 62, name: 'D' }, // D 弦
    { string: 2 as const, midi: 69, name: 'A' }, // A 弦
    { string: 1 as const, midi: 76, name: 'E' }, // E 弦
  ]

  // 找到最合适的弦
  for (const os of openStrings) {
    const diff = midi - os.midi
    if (diff >= 0 && diff <= 7) {
      // 在该弦的一把位范围内
      const finger = Math.min(diff, 4) as 0 | 1 | 2 | 3 | 4
      return { string: os.string, finger }
    }
  }

  // 默认使用 A 弦
  return { string: 2, finger: 1 }
}

/**
 * 为没有技术标记的音符添加推荐指法
 */
export function addDefaultFingerings(song: ParsedSong): ParsedSong {
  const notesWithFingering = song.notes.map(note => {
    if (note.string === undefined || note.finger === undefined) {
      const { string, finger } = getViolinFingering(note.pitch)
      return {
        ...note,
        string: note.string ?? string,
        finger: note.finger ?? finger,
      }
    }
    return note
  })

  return {
    ...song,
    notes: notesWithFingering,
  }
}
