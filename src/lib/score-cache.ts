import { ParsedSong } from '@/types'
import { loadMusicXML } from './musicxml-parser'

const CACHE_KEY_PREFIX = 'melobuddy_score_'
const CACHE_VERSION = 'v1'

/**
 * 获取乐谱（优先从缓存读取）
 * @param songId 曲目ID
 * @param xmlUrl MusicXML文件URL
 * @returns 解析后的乐谱数据
 */
export async function getScore(songId: string, xmlUrl: string): Promise<ParsedSong> {
  const cacheKey = `${CACHE_KEY_PREFIX}${songId}_${CACHE_VERSION}`

  // 检查是否在浏览器环境
  if (typeof window === 'undefined') {
    // 服务端直接加载
    return await loadMusicXML(xmlUrl)
  }

  try {
    // 尝试读取缓存
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached) as ParsedSong
      // 验证缓存数据有效性
      if (parsed && parsed.notes && Array.isArray(parsed.notes)) {
        return parsed
      }
    }
  } catch (error) {
    // 缓存读取失败，继续加载
    console.warn('Failed to read score cache:', error)
  }

  // 加载并解析
  const parsed = await loadMusicXML(xmlUrl)

  try {
    // 存入缓存
    localStorage.setItem(cacheKey, JSON.stringify(parsed))
  } catch (error) {
    // 缓存写入失败（可能是存储空间不足）
    console.warn('Failed to cache score:', error)
  }

  return parsed
}

/**
 * 清除指定乐谱的缓存
 * @param songId 曲目ID
 */
export function clearScoreCacheById(songId: string): void {
  if (typeof window === 'undefined') return

  const cacheKey = `${CACHE_KEY_PREFIX}${songId}_${CACHE_VERSION}`
  try {
    localStorage.removeItem(cacheKey)
  } catch (error) {
    console.warn('Failed to clear score cache:', error)
  }
}

/**
 * 清除所有乐谱缓存
 */
export function clearScoreCache(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []

    // 遍历所有 localStorage 项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    // 删除所有乐谱缓存
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })

    console.log(`Cleared ${keysToRemove.length} score cache entries`)
  } catch (error) {
    console.warn('Failed to clear score cache:', error)
  }
}

/**
 * 获取缓存统计信息
 */
export function getScoreCacheStats(): { count: number; totalSize: number } {
  if (typeof window === 'undefined') {
    return { count: 0, totalSize: 0 }
  }

  let count = 0
  let totalSize = 0

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        count++
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += value.length * 2 // UTF-16 每字符2字节
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get cache stats:', error)
  }

  return { count, totalSize }
}

/**
 * 检查乐谱是否已缓存
 * @param songId 曲目ID
 */
export function isScoreCached(songId: string): boolean {
  if (typeof window === 'undefined') return false

  const cacheKey = `${CACHE_KEY_PREFIX}${songId}_${CACHE_VERSION}`
  try {
    return localStorage.getItem(cacheKey) !== null
  } catch {
    return false
  }
}

/**
 * 预加载多个乐谱到缓存
 * @param songs 要预加载的曲目列表
 */
export async function preloadScores(
  songs: Array<{ id: string; musicXmlUrl: string }>
): Promise<void> {
  const uncachedSongs = songs.filter((song) => !isScoreCached(song.id))

  // 并发加载未缓存的乐谱
  await Promise.all(
    uncachedSongs.map(async (song) => {
      try {
        await getScore(song.id, song.musicXmlUrl)
      } catch (error) {
        console.warn(`Failed to preload score for ${song.id}:`, error)
      }
    })
  )
}
