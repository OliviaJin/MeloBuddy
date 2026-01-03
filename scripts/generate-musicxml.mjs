#!/usr/bin/env node

/**
 * MusicXML Generator for MeloBuddy
 * Generates accurate MusicXML files for all songs in the library
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCORES_DIR = path.join(__dirname, '..', 'public', 'scores')

// Note definitions for MusicXML
const NOTES = {
  // Octave 3 (G string open and 1st position)
  'G3': { step: 'G', octave: 3, alter: 0 },
  'G#3': { step: 'G', octave: 3, alter: 1 },
  'Ab3': { step: 'A', octave: 3, alter: -1 },
  'A3': { step: 'A', octave: 3, alter: 0 },
  'A#3': { step: 'A', octave: 3, alter: 1 },
  'Bb3': { step: 'B', octave: 3, alter: -1 },
  'B3': { step: 'B', octave: 3, alter: 0 },

  // Octave 4
  'C4': { step: 'C', octave: 4, alter: 0 },
  'C#4': { step: 'C', octave: 4, alter: 1 },
  'Db4': { step: 'D', octave: 4, alter: -1 },
  'D4': { step: 'D', octave: 4, alter: 0 },
  'D#4': { step: 'D', octave: 4, alter: 1 },
  'Eb4': { step: 'E', octave: 4, alter: -1 },
  'E4': { step: 'E', octave: 4, alter: 0 },
  'F4': { step: 'F', octave: 4, alter: 0 },
  'F#4': { step: 'F', octave: 4, alter: 1 },
  'Gb4': { step: 'G', octave: 4, alter: -1 },
  'G4': { step: 'G', octave: 4, alter: 0 },
  'G#4': { step: 'G', octave: 4, alter: 1 },
  'Ab4': { step: 'A', octave: 4, alter: -1 },
  'A4': { step: 'A', octave: 4, alter: 0 },
  'A#4': { step: 'A', octave: 4, alter: 1 },
  'Bb4': { step: 'B', octave: 4, alter: -1 },
  'B4': { step: 'B', octave: 4, alter: 0 },

  // Octave 5
  'C5': { step: 'C', octave: 5, alter: 0 },
  'C#5': { step: 'C', octave: 5, alter: 1 },
  'Db5': { step: 'D', octave: 5, alter: -1 },
  'D5': { step: 'D', octave: 5, alter: 0 },
  'D#5': { step: 'D', octave: 5, alter: 1 },
  'Eb5': { step: 'E', octave: 5, alter: -1 },
  'E5': { step: 'E', octave: 5, alter: 0 },
  'F5': { step: 'F', octave: 5, alter: 0 },
  'F#5': { step: 'F', octave: 5, alter: 1 },
  'Gb5': { step: 'G', octave: 5, alter: -1 },
  'G5': { step: 'G', octave: 5, alter: 0 },
  'G#5': { step: 'G', octave: 5, alter: 1 },
  'Ab5': { step: 'A', octave: 5, alter: -1 },
  'A5': { step: 'A', octave: 5, alter: 0 },
  'A#5': { step: 'A', octave: 5, alter: 1 },
  'Bb5': { step: 'B', octave: 5, alter: -1 },
  'B5': { step: 'B', octave: 5, alter: 0 },

  // Octave 6
  'C6': { step: 'C', octave: 6, alter: 0 },
  'D6': { step: 'D', octave: 6, alter: 0 },
  'E6': { step: 'E', octave: 6, alter: 0 },
}

// Duration mappings
const DURATIONS = {
  whole: { type: 'whole', duration: 4 },
  half: { type: 'half', duration: 2 },
  quarter: { type: 'quarter', duration: 1 },
  eighth: { type: 'eighth', duration: 0.5 },
  sixteenth: { type: '16th', duration: 0.25 },
}

// Violin fingering and string info
// String 1=E, 2=A, 3=D, 4=G
function getViolinTechnique(pitch) {
  const techniques = {
    // G String (4)
    'G3': { string: 4, finger: 0 },
    'A3': { string: 4, finger: 1 },
    'B3': { string: 4, finger: 2 },
    'C4': { string: 4, finger: 3 },
    'D4': { string: 4, finger: 4, altString: 3, altFinger: 0 },
    // D String (3)
    'E4': { string: 3, finger: 1 },
    'F4': { string: 3, finger: 2 },
    'F#4': { string: 3, finger: 2 },
    'G4': { string: 3, finger: 3 },
    'A4': { string: 3, finger: 4, altString: 2, altFinger: 0 },
    // A String (2)
    'B4': { string: 2, finger: 1 },
    'C5': { string: 2, finger: 2 },
    'C#5': { string: 2, finger: 2 },
    'D5': { string: 2, finger: 3 },
    'E5': { string: 2, finger: 4, altString: 1, altFinger: 0 },
    // E String (1)
    'F5': { string: 1, finger: 1 },
    'F#5': { string: 1, finger: 1 },
    'G5': { string: 1, finger: 2 },
    'G#5': { string: 1, finger: 2 },
    'A5': { string: 1, finger: 3 },
    'B5': { string: 1, finger: 4 },
  }
  return techniques[pitch] || { string: 2, finger: 0 }
}

// Generate note XML
function generateNoteXml(pitch, duration, options = {}) {
  const noteInfo = NOTES[pitch]
  if (!noteInfo) {
    console.warn(`Unknown pitch: ${pitch}`)
    return ''
  }

  const durInfo = DURATIONS[duration] || DURATIONS.quarter
  const technique = getViolinTechnique(pitch)

  let alterXml = ''
  if (noteInfo.alter !== 0) {
    alterXml = `        <alter>${noteInfo.alter}</alter>\n`
  }

  let technicalXml = ''
  if (options.showFingering !== false) {
    technicalXml = `      <notations>
        <technical>
          <string>${technique.string}</string>
          <fingering>${technique.finger}</fingering>
          ${options.bowDirection ? `<${options.bowDirection === 'down' ? 'down-bow' : 'up-bow'}/>` : ''}
        </technical>
      </notations>`
  }

  return `    <note>
      <pitch>
        <step>${noteInfo.step}</step>
${alterXml}        <octave>${noteInfo.octave}</octave>
      </pitch>
      <duration>${durInfo.duration * 4}</duration>
      <type>${durInfo.type}</type>
${technicalXml}
    </note>`
}

// Generate rest XML
function generateRestXml(duration) {
  const durInfo = DURATIONS[duration] || DURATIONS.quarter
  return `    <note>
      <rest/>
      <duration>${durInfo.duration * 4}</duration>
      <type>${durInfo.type}</type>
    </note>`
}

// Generate measure XML
function generateMeasureXml(measureNumber, notes, options = {}) {
  let attributesXml = ''
  if (measureNumber === 1) {
    const fifths = options.fifths || 1 // G major default
    const beats = options.beats || 4
    const beatType = options.beatType || 4
    attributesXml = `    <attributes>
      <divisions>4</divisions>
      <key>
        <fifths>${fifths}</fifths>
      </key>
      <time>
        <beats>${beats}</beats>
        <beat-type>${beatType}</beat-type>
      </time>
      <clef>
        <sign>G</sign>
        <line>2</line>
      </clef>
    </attributes>
    <direction placement="above">
      <direction-type>
        <metronome>
          <beat-unit>quarter</beat-unit>
          <per-minute>${options.tempo || 80}</per-minute>
        </metronome>
      </direction-type>
    </direction>
`
  }

  const notesXml = notes.map((n, i) => {
    if (n.rest) {
      return generateRestXml(n.duration)
    }
    return generateNoteXml(n.pitch, n.duration, {
      showFingering: true,
      bowDirection: i % 2 === 0 ? 'down' : 'up'
    })
  }).join('\n')

  return `  <measure number="${measureNumber}">
${attributesXml}${notesXml}
  </measure>`
}

// Generate full MusicXML document
function generateMusicXml(title, composer, measures, options = {}) {
  const measuresXml = measures.map((notes, i) =>
    generateMeasureXml(i + 1, notes, i === 0 ? options : {})
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${title}</work-title>
  </work>
  <identification>
    <creator type="composer">${composer}</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>Violin</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="P1">
${measuresXml}
  </part>
</score-partwise>`
}

// ===================
// Song Definitions
// ===================

const SONGS = {
  // ===== SCALES =====
  'scale-g-major-1oct': {
    title: 'G大调音阶',
    composer: '基础练习',
    options: { fifths: 1, tempo: 60, beats: 4, beatType: 4 },
    measures: [
      // Ascending
      [{ pitch: 'G3', duration: 'quarter' }, { pitch: 'A3', duration: 'quarter' }, { pitch: 'B3', duration: 'quarter' }, { pitch: 'C4', duration: 'quarter' }],
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      // Descending
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'C4', duration: 'quarter' }, { pitch: 'B3', duration: 'quarter' }, { pitch: 'A3', duration: 'quarter' }, { pitch: 'G3', duration: 'whole' }],
    ]
  },

  'scale-d-major-1oct': {
    title: 'D大调音阶',
    composer: '基础练习',
    options: { fifths: 2, tempo: 60, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'whole' }],
    ]
  },

  'scale-a-major-1oct': {
    title: 'A大调音阶',
    composer: '基础练习',
    options: { fifths: 3, tempo: 60, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G#5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'A5', duration: 'quarter' }, { pitch: 'G#5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'whole' }],
    ]
  },

  'scale-g-major-2oct': {
    title: 'G大调音阶 (两个八度)',
    composer: '基础练习',
    options: { fifths: 1, tempo: 72, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'G3', duration: 'quarter' }, { pitch: 'A3', duration: 'quarter' }, { pitch: 'B3', duration: 'quarter' }, { pitch: 'C4', duration: 'quarter' }],
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'half' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'F#4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }, { pitch: 'C4', duration: 'quarter' }],
      [{ pitch: 'B3', duration: 'quarter' }, { pitch: 'A3', duration: 'quarter' }, { pitch: 'G3', duration: 'half' }],
    ]
  },

  'scale-d-major-2oct': {
    title: 'D大调音阶 (两个八度)',
    composer: '基础练习',
    options: { fifths: 2, tempo: 72, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'B5', duration: 'half' }, { pitch: 'A5', duration: 'half' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C#5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'F#4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'half' }],
    ]
  },

  'scale-a-major-2oct': {
    title: 'A大调音阶 (两个八度)',
    composer: '基础练习',
    options: { fifths: 3, tempo: 72, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'A3', duration: 'quarter' }, { pitch: 'B3', duration: 'quarter' }, { pitch: 'C#4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'E4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'G#4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'F#5', duration: 'quarter' }, { pitch: 'G#5', duration: 'quarter' }, { pitch: 'A5', duration: 'half' }],
      [{ pitch: 'A5', duration: 'quarter' }, { pitch: 'G#5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'G#4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'C#4', duration: 'quarter' }, { pitch: 'B3', duration: 'quarter' }, { pitch: 'A3', duration: 'half' }],
    ]
  },

  'arpeggio-g-major': {
    title: 'G大调琶音',
    composer: '基础练习',
    options: { fifths: 1, tempo: 72, beats: 3, beatType: 4 },
    measures: [
      [{ pitch: 'G3', duration: 'quarter' }, { pitch: 'B3', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'half' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'B3', duration: 'quarter' }, { pitch: 'G3', duration: 'half' }],
    ]
  },

  'arpeggio-d-major': {
    title: 'D大调琶音',
    composer: '基础练习',
    options: { fifths: 2, tempo: 72, beats: 3, beatType: 4 },
    measures: [
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'A5', duration: 'half' }, { pitch: 'F#5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }],
      [{ pitch: 'D4', duration: 'half' }, { rest: true, duration: 'quarter' }],
    ]
  },

  'scale-g-minor-2oct': {
    title: 'G小调音阶 (两个八度)',
    composer: '基础练习',
    options: { fifths: -2, tempo: 66, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'G3', duration: 'quarter' }, { pitch: 'A3', duration: 'quarter' }, { pitch: 'Bb3', duration: 'quarter' }, { pitch: 'C4', duration: 'quarter' }],
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'Eb4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'Bb4', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'Eb5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'half' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'F4', duration: 'quarter' }, { pitch: 'Eb5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'Bb4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'F4', duration: 'quarter' }, { pitch: 'Eb4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }, { pitch: 'C4', duration: 'quarter' }],
      [{ pitch: 'Bb3', duration: 'quarter' }, { pitch: 'A3', duration: 'quarter' }, { pitch: 'G3', duration: 'half' }],
    ]
  },

  'scale-d-minor-2oct': {
    title: 'D小调音阶 (两个八度)',
    composer: '基础练习',
    options: { fifths: -1, tempo: 66, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'D4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'F4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'Bb4', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'Bb5', duration: 'half' }, { pitch: 'A5', duration: 'half' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'Bb4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'F4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'half' }],
    ]
  },

  // ===== ETUDES =====
  'open-strings': {
    title: '空弦练习',
    composer: '基础练习',
    options: { fifths: 0, tempo: 60, beats: 4, beatType: 4 },
    measures: [
      // G string
      [{ pitch: 'G3', duration: 'whole' }],
      [{ pitch: 'G3', duration: 'half' }, { pitch: 'G3', duration: 'half' }],
      // D string
      [{ pitch: 'D4', duration: 'whole' }],
      [{ pitch: 'D4', duration: 'half' }, { pitch: 'D4', duration: 'half' }],
      // A string
      [{ pitch: 'A4', duration: 'whole' }],
      [{ pitch: 'A4', duration: 'half' }, { pitch: 'A4', duration: 'half' }],
      // E string
      [{ pitch: 'E5', duration: 'whole' }],
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'E5', duration: 'half' }],
      // Combination
      [{ pitch: 'G3', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }, { pitch: 'G3', duration: 'quarter' }],
    ]
  },

  'long-bow': {
    title: '长弓练习',
    composer: '基础练习',
    options: { fifths: 1, tempo: 50, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'G3', duration: 'whole' }],
      [{ pitch: 'A3', duration: 'whole' }],
      [{ pitch: 'B3', duration: 'whole' }],
      [{ pitch: 'C4', duration: 'whole' }],
      [{ pitch: 'D4', duration: 'whole' }],
      [{ pitch: 'E4', duration: 'whole' }],
      [{ pitch: 'F#4', duration: 'whole' }],
      [{ pitch: 'G4', duration: 'whole' }],
    ]
  },

  // ===== PIECES =====
  'twinkle-star': {
    title: '小星星',
    composer: '莫扎特 (改编)',
    options: { fifths: 0, tempo: 80, beats: 4, beatType: 4 },
    measures: [
      // CCGGAAG
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'F#5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'half' }],
      // FFEED
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'half' }],
      // GGFFE
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C#5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'B4', duration: 'half' }],
      // GGFFE
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C#5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'B4', duration: 'half' }],
      // Repeat first part
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'F#5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'half' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }, { pitch: 'C#5', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'half' }],
    ]
  },

  'mary-lamb': {
    title: '玛丽有只小羊羔',
    composer: '美国民谣',
    options: { fifths: 0, tempo: 100, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'half' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'half' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'half' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'whole' }],
    ]
  },

  'happy-birthday': {
    title: '生日快乐',
    composer: 'Patty Hill',
    options: { fifths: 1, tempo: 100, beats: 3, beatType: 4 },
    measures: [
      [{ pitch: 'D4', duration: 'eighth' }, { pitch: 'D4', duration: 'eighth' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'F#4', duration: 'half' }],
      [{ pitch: 'D4', duration: 'eighth' }, { pitch: 'D4', duration: 'eighth' }, { pitch: 'E4', duration: 'quarter' }, { pitch: 'D4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'half' }],
      [{ pitch: 'D4', duration: 'eighth' }, { pitch: 'D4', duration: 'eighth' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'F#4', duration: 'quarter' }, { pitch: 'E4', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'eighth' }, { pitch: 'C5', duration: 'eighth' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'half' }],
    ]
  },

  'jingle-bells': {
    title: '铃儿响叮当',
    composer: 'James Pierpont',
    options: { fifths: 1, tempo: 120, beats: 4, beatType: 4 },
    measures: [
      // Jingle bells, jingle bells
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'half' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'half' }],
      // Jingle all the way
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'whole' }],
      // Oh what fun
      [{ pitch: 'F5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }],
      [{ pitch: 'F5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      // It is to ride
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'half' }, { pitch: 'G5', duration: 'half' }],
    ]
  },

  'two-tigers': {
    title: '两只老虎',
    composer: '法国民谣',
    options: { fifths: 0, tempo: 110, beats: 4, beatType: 4 },
    measures: [
      // 两只老虎
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      // 跑得快
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'G5', duration: 'half' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'G5', duration: 'half' }],
      // 一只没有眼睛
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'A5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'A5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      // 真奇怪
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'C5', duration: 'half' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'C5', duration: 'half' }],
    ]
  },

  'ode-to-joy': {
    title: '欢乐颂',
    composer: '贝多芬',
    options: { fifths: 2, tempo: 100, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'F#5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'A5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }],
      [{ pitch: 'F#5', duration: 'half' }, { pitch: 'E5', duration: 'half' }],
      [{ pitch: 'F#5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'A5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'whole' }],
    ]
  },

  'minuet-no1': {
    title: '小步舞曲 No.1',
    composer: '巴赫',
    options: { fifths: 1, tempo: 100, beats: 3, beatType: 4 },
    measures: [
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'G4', duration: 'eighth' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'B4', duration: 'eighth' }, { pitch: 'C5', duration: 'eighth' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'F#5', duration: 'eighth' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'C5', duration: 'eighth' }, { pitch: 'B4', duration: 'eighth' }, { pitch: 'A4', duration: 'eighth' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'C5', duration: 'eighth' }, { pitch: 'B4', duration: 'eighth' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'G4', duration: 'eighth' }],
      [{ pitch: 'F#4', duration: 'quarter' }, { pitch: 'G4', duration: 'eighth' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'B4', duration: 'eighth' }, { pitch: 'G4', duration: 'eighth' }],
      [{ pitch: 'A4', duration: 'half' }, { rest: true, duration: 'quarter' }],
    ]
  },

  'jasmine-flower': {
    title: '茉莉花',
    composer: '中国民歌',
    options: { fifths: 0, tempo: 72, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'A5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'half' }, { pitch: 'E5', duration: 'half' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'D5', duration: 'half' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'half' }, { rest: true, duration: 'half' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'A5', duration: 'eighth' }, { pitch: 'G5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'whole' }],
    ]
  },

  'farewell': {
    title: '送别',
    composer: '李叔同',
    options: { fifths: 0, tempo: 66, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'C5', duration: 'half' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'whole' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'D5', duration: 'half' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'half' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'whole' }],
    ]
  },

  'can-can': {
    title: '康康舞曲',
    composer: '奥芬巴赫',
    options: { fifths: 0, tempo: 132, beats: 2, beatType: 4 },
    measures: [
      [{ pitch: 'E5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'C5', duration: 'eighth' }],
      [{ pitch: 'E5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'G5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'C5', duration: 'eighth' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }],
      [{ pitch: 'E5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'C5', duration: 'quarter' }],
    ]
  },

  'serenade-simple': {
    title: '小夜曲 (简化版)',
    composer: '海顿',
    options: { fifths: 0, tempo: 72, beats: 4, beatType: 4 },
    measures: [
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'half' }, { pitch: 'C5', duration: 'half' }],
      [{ pitch: 'D5', duration: 'half' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'whole' }],
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'half' }, { pitch: 'D5', duration: 'half' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'whole' }],
    ]
  },

  'lullaby-brahms': {
    title: '摇篮曲',
    composer: '勃拉姆斯',
    options: { fifths: -1, tempo: 66, beats: 3, beatType: 4 },
    measures: [
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'A4', duration: 'eighth' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'G4', duration: 'eighth' }, { pitch: 'G4', duration: 'eighth' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'Bb4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'Bb4', duration: 'quarter' }],
      [{ pitch: 'A4', duration: 'half' }, { rest: true, duration: 'quarter' }],
    ]
  },

  'little-bee': {
    title: '小蜜蜂',
    composer: '德国民谣',
    options: { fifths: 0, tempo: 120, beats: 2, beatType: 4 },
    measures: [
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'F5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }],
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'G5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'F5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }, { pitch: 'G5', duration: 'eighth' }],
      [{ pitch: 'C5', duration: 'half' }],
    ]
  },

  'painter': {
    title: '粉刷匠',
    composer: '波兰民歌',
    options: { fifths: 0, tempo: 110, beats: 2, beatType: 4 },
    measures: [
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'eighth' }, { pitch: 'F5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }],
      [{ pitch: 'C5', duration: 'half' }],
      [{ pitch: 'F5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'F5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'eighth' }, { pitch: 'E5', duration: 'eighth' }, { pitch: 'D5', duration: 'eighth' }, { pitch: 'C5', duration: 'eighth' }],
      [{ pitch: 'G4', duration: 'half' }],
    ]
  },

  'happy-new-year': {
    title: '新年好',
    composer: '英国民谣',
    options: { fifths: 0, tempo: 100, beats: 3, beatType: 4 },
    measures: [
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'half' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'half' }, { rest: true, duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'F5', duration: 'quarter' }],
      [{ pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'G4', duration: 'half' }, { rest: true, duration: 'quarter' }],
    ]
  },
}

// Generate placeholder for songs not yet fully transcribed
function generatePlaceholder(id, title, composer, category) {
  const options = { fifths: 1, tempo: 80, beats: 4, beatType: 4 }
  let measures

  if (category === 'scale') {
    measures = [
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'C5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }],
      [{ pitch: 'G5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }],
      [{ pitch: 'C5', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'G4', duration: 'whole' }],
    ]
  } else if (category === 'etude') {
    measures = [
      [{ pitch: 'G4', duration: 'quarter' }, { pitch: 'G4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }, { pitch: 'A4', duration: 'quarter' }],
      [{ pitch: 'B4', duration: 'quarter' }, { pitch: 'B4', duration: 'quarter' }, { pitch: 'C5', duration: 'half' }],
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }],
      [{ pitch: 'D5', duration: 'half' }, { pitch: 'G4', duration: 'half' }],
    ]
  } else {
    // piece or exam
    measures = [
      [{ pitch: 'D5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'F#5', duration: 'quarter' }, { pitch: 'G5', duration: 'quarter' }],
      [{ pitch: 'A5', duration: 'half' }, { pitch: 'G5', duration: 'half' }],
      [{ pitch: 'F#5', duration: 'quarter' }, { pitch: 'E5', duration: 'quarter' }, { pitch: 'D5', duration: 'half' }],
      [{ pitch: 'G5', duration: 'whole' }],
    ]
  }

  return { title, composer, options, measures }
}

// All songs from the library
const ALL_SONGS = [
  // Scales
  { id: 'scale-g-major-1oct', category: 'scale' },
  { id: 'scale-d-major-1oct', category: 'scale' },
  { id: 'scale-a-major-1oct', category: 'scale' },
  { id: 'scale-g-major-2oct', category: 'scale' },
  { id: 'scale-d-major-2oct', category: 'scale' },
  { id: 'scale-a-major-2oct', category: 'scale' },
  { id: 'arpeggio-g-major', category: 'scale' },
  { id: 'arpeggio-d-major', category: 'scale' },
  { id: 'scale-g-minor-2oct', category: 'scale' },
  { id: 'scale-d-minor-2oct', category: 'scale' },

  // Etudes
  { id: 'open-strings', category: 'etude' },
  { id: 'long-bow', category: 'etude' },
  { id: 'wohlfahrt-op45-no1', title: 'Wohlfahrt Op.45 No.1', composer: 'Franz Wohlfahrt', category: 'etude' },
  { id: 'wohlfahrt-op45-no2', title: 'Wohlfahrt Op.45 No.2', composer: 'Franz Wohlfahrt', category: 'etude' },
  { id: 'kayser-op20-no1', title: 'Kayser Op.20 No.1', composer: 'Heinrich Kayser', category: 'etude' },
  { id: 'kayser-op20-no2', title: 'Kayser Op.20 No.2', composer: 'Heinrich Kayser', category: 'etude' },
  { id: 'sevcik-op2-no1', title: 'Sevcik Op.2 No.1', composer: 'Otakar Sevcik', category: 'etude' },

  // Pieces
  { id: 'twinkle-star', category: 'piece' },
  { id: 'mary-lamb', category: 'piece' },
  { id: 'happy-birthday', category: 'piece' },
  { id: 'jingle-bells', category: 'piece' },
  { id: 'two-tigers', category: 'piece' },
  { id: 'ode-to-joy', category: 'piece' },
  { id: 'minuet-no1', category: 'piece' },
  { id: 'jasmine-flower', category: 'piece' },
  { id: 'farewell', category: 'piece' },
  { id: 'can-can', category: 'piece' },
  { id: 'serenade-simple', category: 'piece' },
  { id: 'lullaby-brahms', category: 'piece' },
  { id: 'little-bee', category: 'piece' },
  { id: 'painter', category: 'piece' },
  { id: 'happy-new-year', category: 'piece' },
  { id: 'gavotte-gossec', title: '加沃特舞曲', composer: 'Gossec', category: 'piece' },
  { id: 'humoresque', title: '幽默曲', composer: '德沃夏克', category: 'piece' },
  { id: 'hunters-chorus', title: '猎人合唱', composer: '韦伯', category: 'piece' },
  { id: 'ave-maria-gounod', title: '圣母颂', composer: '古诺/巴赫', category: 'piece' },
  { id: 'flight-bumblebee-easy', title: '野蜂飞舞 (简化版)', composer: '里姆斯基-科萨科夫', category: 'piece' },
  { id: 'tarantella', title: '塔兰泰拉舞曲', composer: '意大利民间', category: 'piece' },
  { id: 'fishermans-song', title: '渔舟唱晚', composer: '中国古曲', category: 'piece' },
  { id: 'butterfly-lovers-theme', title: '梁祝主题', composer: '何占豪/陈钢', category: 'piece' },

  // Exam pieces
  { id: 'abrsm-g1-country-dance', title: '乡村舞曲', composer: 'ABRSM Grade 1', category: 'exam' },
  { id: 'abrsm-g1-minuet', title: '小步舞曲', composer: 'ABRSM Grade 1', category: 'exam' },
  { id: 'abrsm-g2-bourree', title: '布列舞曲', composer: 'ABRSM Grade 2', category: 'exam' },
  { id: 'abrsm-g2-barcarolle', title: '船歌', composer: 'ABRSM Grade 2', category: 'exam' },
  { id: 'abrsm-g3-gavotte', title: '加沃特舞曲', composer: 'ABRSM Grade 3', category: 'exam' },
  { id: 'ccom-g1-lullaby', title: '摇篮曲', composer: '央音一级', category: 'exam' },
  { id: 'ccom-g2-minuet', title: '小步舞曲', composer: '央音二级', category: 'exam' },
  { id: 'ccom-g3-north-wind', title: '北风吹', composer: '央音三级', category: 'exam' },
  { id: 'ccom-g4-xinjiang-spring', title: '新疆之春', composer: '央音四级', category: 'exam' },
  { id: 'ccom-g5-fisherman', title: '渔舟唱晚', composer: '央音五级', category: 'exam' },
]

// Main function
async function main() {
  console.log('MusicXML Generator for MeloBuddy')
  console.log('================================\n')

  // Create directories
  const dirs = ['scale', 'etude', 'piece', 'exam']
  for (const dir of dirs) {
    const dirPath = path.join(SCORES_DIR, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`Created directory: ${dir}/`)
    }
  }

  let generated = 0
  let skipped = 0

  for (const song of ALL_SONGS) {
    const { id, category, title, composer } = song

    // Get song data (either from SONGS or generate placeholder)
    let songData = SONGS[id]
    if (!songData) {
      songData = generatePlaceholder(id, title || id, composer || '基础练习', category)
    }

    // Generate MusicXML
    const xml = generateMusicXml(
      songData.title,
      songData.composer,
      songData.measures,
      songData.options
    )

    // Write file
    const filePath = path.join(SCORES_DIR, category, `${id}.xml`)
    fs.writeFileSync(filePath, xml, 'utf8')
    fs.chmodSync(filePath, 0o644)

    console.log(`✓ Generated: ${category}/${id}.xml`)
    generated++
  }

  console.log(`\n================================`)
  console.log(`Generated: ${generated} files`)
  console.log(`Skipped: ${skipped} files`)
  console.log(`Total: ${ALL_SONGS.length} songs`)
}

main().catch(console.error)
