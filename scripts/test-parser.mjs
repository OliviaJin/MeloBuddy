#!/usr/bin/env node
/**
 * 测试MusicXML解析器
 * 尝试解析几个代表性的曲目
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { XMLParser } from 'fast-xml-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// 复制解析逻辑（简化版）
const A4_FREQUENCY = 440
const A4_MIDI = 69

const NOTE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function noteToMidi(step, octave, alter = 0) {
  const semitone = NOTE_SEMITONES[step.toUpperCase()] ?? 0
  return (octave + 1) * 12 + semitone + alter
}

function midiToFrequency(midi) {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12)
}

function formatPitchName(step, octave, alter = 0) {
  let accidental = ''
  if (alter === 1) accidental = '#'
  else if (alter === -1) accidental = 'b'
  return `${step}${accidental}${octave}`
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => ['part', 'measure', 'note', 'direction', 'creator'].includes(name)
})

function ensureArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function safeGet(obj, path, defaultValue) {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue
    }
    current = current[key]
  }
  return current ?? defaultValue
}

function parseMusicXML(xmlContent) {
  const doc = xmlParser.parse(xmlContent)
  const scorePartwise = doc['score-partwise']

  if (!scorePartwise) {
    throw new Error('Invalid MusicXML: missing score-partwise')
  }

  const work = safeGet(scorePartwise, 'work', {})
  const title = safeGet(work, 'work-title', '') ||
                safeGet(scorePartwise, 'movement-title', '') ||
                'Untitled'

  const parts = ensureArray(scorePartwise.part)
  if (parts.length === 0) {
    throw new Error('No parts found')
  }

  const part = parts[0]
  const measures = ensureArray(part.measure)

  let tempo = 120
  let divisions = 1
  let timeSignature = [4, 4]
  let keySignature = 'C'
  const notes = []
  let noteIndex = 0

  for (const measure of measures) {
    const attributes = safeGet(measure, 'attributes', {})
    if (attributes.divisions) {
      divisions = parseInt(attributes.divisions) || 1
    }

    const time = safeGet(attributes, 'time', null)
    if (time) {
      timeSignature = [
        parseInt(time.beats) || 4,
        parseInt(time['beat-type']) || 4
      ]
    }

    const key = safeGet(attributes, 'key', null)
    if (key) {
      const fifths = parseInt(key.fifths) || 0
      const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
      const majorFlats = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']
      keySignature = fifths >= 0 ? (majorKeys[fifths] || 'C') : (majorFlats[-fifths] || 'C')
    }

    const directions = ensureArray(measure.direction)
    for (const dir of directions) {
      const sound = safeGet(dir, 'sound', null)
      if (sound && sound['@_tempo']) {
        tempo = parseFloat(sound['@_tempo']) || tempo
      }
    }

    const measureNotes = ensureArray(measure.note)
    for (const note of measureNotes) {
      if (note.rest) continue

      const pitch = safeGet(note, 'pitch', null)
      if (!pitch) continue

      const step = String(pitch.step || 'C')
      const octave = parseInt(pitch.octave) || 4
      const alter = parseInt(pitch.alter || 0)

      const midi = noteToMidi(step, octave, alter)
      const frequency = Math.round(midiToFrequency(midi) * 100) / 100
      const pitchName = formatPitchName(step, octave, alter)

      const duration = parseInt(note.duration) || divisions
      const durationInBeats = duration / divisions

      notes.push({
        index: noteIndex++,
        pitch: pitchName,
        frequency,
        duration: durationInBeats
      })
    }
  }

  return {
    title,
    tempo,
    timeSignature,
    keySignature,
    noteCount: notes.length,
    firstNotes: notes.slice(0, 5),
    lastNotes: notes.slice(-3)
  }
}

// 测试几个代表性的曲目
const testFiles = [
  '/scores/scale/scale-g-major-1oct.xml',
  '/scores/piece/twinkle-star.xml',
  '/scores/piece/ode-to-joy.xml',
  '/scores/etude/wohlfahrt-op45-no1.xml',
  '/scores/exam/abrsm-g1-country-dance.xml'
]

console.log('🎼 MusicXML 解析器测试')
console.log('='.repeat(60))

let successCount = 0
let failCount = 0

for (const url of testFiles) {
  const filePath = path.join(projectRoot, 'public', url)
  console.log(`\n📄 ${url}`)

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const result = parseMusicXML(content)

    console.log(`   标题: ${result.title}`)
    console.log(`   速度: ${result.tempo} BPM`)
    console.log(`   拍号: ${result.timeSignature[0]}/${result.timeSignature[1]}`)
    console.log(`   调号: ${result.keySignature}`)
    console.log(`   音符数: ${result.noteCount}`)
    console.log(`   前5个音: ${result.firstNotes.map(n => n.pitch).join(', ')}`)
    console.log(`   ✅ 解析成功`)
    successCount++
  } catch (err) {
    console.log(`   ❌ 解析失败: ${err.message}`)
    failCount++
  }
}

console.log('\n' + '='.repeat(60))
console.log(`📋 测试结果: ${successCount} 成功, ${failCount} 失败`)
console.log('')
