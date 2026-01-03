// 统一导出曲库数据
// 使用新版 MusicXML 驱动的曲库

import { songLibrary, getSongById, searchSongs, getSongsByCategory, getSongsByDifficulty } from './songs/index'
import type { SongMeta } from '@/types'

// 为兼容旧代码，将 songLibrary 导出为 songs
export const songs = songLibrary

// 导出查询函数
export { getSongById, searchSongs, getSongsByCategory, getSongsByDifficulty }

// 导出类型
export type { SongMeta }

// Note 类型
export type Note = {
  pitch: string
  duration: number
  finger: number
  string: number
}

// 扩展 Song 类型以兼容旧代码
// notes 是可选的，因为现在使用 MusicXML 动态加载
export type Song = SongMeta & {
  notes?: Note[]
}
