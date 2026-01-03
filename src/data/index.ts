export {
  songs,
  getSongsByDifficulty,
  getSongsByCategory,
  getStringName,
  getFingerName,
  calculateSongDuration,
  getUsedStrings,
  getUsedFingers,
  type Song,
  type Note,
} from './songs'

import { songs, getSongById as getOldSongById, type Song } from './songs'
import { getSongById as getNewSongById, songLibrary } from './songs/index'
import type { SongMeta } from '@/types'

// 扩展的歌曲类型，支持 MusicXML
export type ExtendedSong = Song & {
  musicXmlUrl?: string
  titleEn?: string
}

// 将 SongMeta 转换为 ExtendedSong（没有内嵌音符的）
function convertSongMetaToSong(meta: SongMeta): ExtendedSong {
  return {
    id: meta.id,
    name: meta.title,
    nameEn: meta.titleEn,
    composer: meta.composer || '',
    difficulty: meta.difficulty,
    duration: meta.duration,
    xpReward: meta.xpReward,
    category: meta.category === 'scale' ? '音阶' :
              meta.category === 'etude' ? '练习曲' :
              meta.category === 'exam' ? '乐曲' : '乐曲',
    requiredLevel: 1,
    notes: [], // 空数组，使用 MusicXML 加载
    musicXmlUrl: meta.musicXmlUrl,
    titleEn: meta.titleEn,
  }
}

// 统一的歌曲查找函数
export function getSongById(id: string): ExtendedSong | undefined {
  // 先查找旧数据（有内嵌音符）
  const oldSong = getOldSongById(id)
  if (oldSong) {
    return oldSong as ExtendedSong
  }

  // 再查找新数据（MusicXML）
  const newSong = getNewSongById(id)
  if (newSong) {
    return convertSongMetaToSong(newSong)
  }

  return undefined
}

// 获取所有歌曲（合并两个数据源）
export function getAllSongs(): ExtendedSong[] {
  const oldSongs = songs.map(s => s as ExtendedSong)
  const newSongs = songLibrary
    .filter(meta => !songs.find(s => s.id === meta.id)) // 排除重复
    .map(convertSongMetaToSong)

  return [...oldSongs, ...newSongs]
}
