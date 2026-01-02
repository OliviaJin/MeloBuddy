import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===================
// 等级经验表
// ===================
// Lv1: 0-100 XP
// Lv2: 100-250 XP (需要150)
// Lv3: 250-500 XP (需要250)
// Lv4: 500-850 XP (需要350)
// Lv5: 850-1300 XP (需要450)
// ... 每级递增100XP需求

export const LEVEL_XP_TABLE: number[] = [
  0,      // Lv1 起始
  100,    // Lv2 起始
  250,    // Lv3 起始
  500,    // Lv4 起始
  850,    // Lv5 起始
  1300,   // Lv6 起始
  1850,   // Lv7 起始
  2500,   // Lv8 起始
  3250,   // Lv9 起始
  4100,   // Lv10 起始
  5050,   // Lv11 起始
  6100,   // Lv12 起始
  7250,   // Lv13 起始
  8500,   // Lv14 起始
  9850,   // Lv15 起始
  11300,  // Lv16 起始
  12850,  // Lv17 起始
  14500,  // Lv18 起始
  16250,  // Lv19 起始
  18100,  // Lv20 起始
]

// 最大等级
export const MAX_LEVEL = LEVEL_XP_TABLE.length

// ===================
// 工具函数
// ===================

/**
 * 根据XP计算等级
 */
export function calculateLevelFromXP(xp: number): number {
  for (let i = LEVEL_XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_TABLE[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * 获取当前等级所需的XP范围
 */
export function getLevelXPRange(level: number): { min: number; max: number } {
  const min = LEVEL_XP_TABLE[level - 1] || 0
  const max = LEVEL_XP_TABLE[level] || LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1] + 1000
  return { min, max }
}

/**
 * 获取当前等级进度百分比
 */
export function getLevelProgress(xp: number, level: number): number {
  const { min, max } = getLevelXPRange(level)
  const progress = ((xp - min) / (max - min)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

/**
 * 获取距离下一级所需XP
 */
export function getXPToNextLevel(xp: number, level: number): number {
  const { max } = getLevelXPRange(level)
  return Math.max(max - xp, 0)
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 检查日期是否是昨天
 */
function isYesterday(dateString: string | null): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
}

/**
 * 检查日期是否是今天
 */
function isToday(dateString: string | null): boolean {
  if (!dateString) return false
  return dateString === getTodayString()
}

// ===================
// Store 类型定义
// ===================

interface PracticeRecord {
  songId: string
  timestamp: number
  score: number
  xpEarned: number
}

interface GameState {
  // 状态
  xp: number
  level: number
  streakDays: number
  bestStreak: number
  lastPracticeDate: string | null
  completedSongs: string[]
  threeStarSongs: string[]
  todayPracticeCount: number
  todayXP: number
  recentPractice: PracticeRecord[]
  totalPracticeTime: number // 秒
  nickname: string
  avatarEmoji: string

  // 计算属性 getters
  getLevelProgress: () => number
  getXPToNextLevel: () => number

  // 方法
  addXP: (amount: number) => { leveledUp: boolean; newLevel: number }
  completePractice: (songId: string, score: number) => {
    xpEarned: number
    leveledUp: boolean
    isNewSong: boolean
    streakBonus: number
    isThreeStar: boolean
  }
  checkAndUpdateStreak: () => {
    streakBroken: boolean
    newStreak: number
    isFirstPracticeToday: boolean
  }
  resetDailyStats: () => void
  setNickname: (name: string) => void
  setAvatarEmoji: (emoji: string) => void
  resetAllProgress: () => void
}

export type { PracticeRecord }

// ===================
// Store 实现
// ===================

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ===================
      // 初始状态
      // ===================
      xp: 0,
      level: 1,
      streakDays: 0,
      bestStreak: 0,
      lastPracticeDate: null,
      completedSongs: [],
      threeStarSongs: [],
      todayPracticeCount: 0,
      todayXP: 0,
      recentPractice: [],
      totalPracticeTime: 0,
      nickname: '小音乐家',
      avatarEmoji: '😺',

      // ===================
      // 计算属性
      // ===================
      getLevelProgress: () => {
        const { xp, level } = get()
        return getLevelProgress(xp, level)
      },

      getXPToNextLevel: () => {
        const { xp, level } = get()
        return getXPToNextLevel(xp, level)
      },

      // ===================
      // 方法
      // ===================

      /**
       * 增加经验值
       * @param amount 增加的XP数量
       * @returns 是否升级以及新等级
       */
      addXP: (amount: number) => {
        const { xp: currentXP, level: currentLevel } = get()
        const newXP = currentXP + amount
        const newLevel = calculateLevelFromXP(newXP)
        const leveledUp = newLevel > currentLevel

        set({
          xp: newXP,
          level: newLevel,
        })

        return { leveledUp, newLevel }
      },

      /**
       * 完成练习
       * @param songId 曲目ID
       * @param score 得分 (0-100)
       * @returns 获得的XP、是否升级、是否新曲目、连胜奖励
       */
      completePractice: (songId: string, score: number) => {
        const state = get()
        const today = getTodayString()

        // 检查是否是今天第一次练习
        const isFirstPracticeToday = !isToday(state.lastPracticeDate)

        // 计算基础XP (根据得分)
        let xpEarned = Math.floor(score * 0.5) // 50分满分可得25XP

        // 检查是否是新曲目
        const isNewSong = !state.completedSongs.includes(songId)
        if (isNewSong) {
          xpEarned += 20 // 新曲目奖励
        }

        // 连胜奖励
        let streakBonus = 0
        let newStreakDays = state.streakDays

        if (isFirstPracticeToday) {
          // 更新连胜
          if (isYesterday(state.lastPracticeDate)) {
            newStreakDays = state.streakDays + 1
          } else if (!isToday(state.lastPracticeDate)) {
            // 连胜断了，重新开始
            newStreakDays = 1
          }

          // 连胜奖励: 每天+5XP，最高+50
          streakBonus = Math.min(newStreakDays * 5, 50)
          xpEarned += streakBonus
        }

        // 计算升级
        const newXP = state.xp + xpEarned
        const newLevel = calculateLevelFromXP(newXP)
        const leveledUp = newLevel > state.level

        // 创建练习记录
        const practiceRecord: PracticeRecord = {
          songId,
          timestamp: Date.now(),
          score,
          xpEarned,
        }

        // 更新最近练习（保留最近10条）
        const updatedRecentPractice = [
          practiceRecord,
          ...state.recentPractice.filter((r) => r.songId !== songId),
        ].slice(0, 10)

        // 更新今日XP（如果是新的一天则重置）
        const newTodayXP = isFirstPracticeToday ? xpEarned : state.todayXP + xpEarned

        // 检查是否三星完成
        const isThreeStar = score >= 100
        const newThreeStarSongs = isThreeStar && !state.threeStarSongs.includes(songId)
          ? [...state.threeStarSongs, songId]
          : state.threeStarSongs

        // 更新最佳连胜
        const newBestStreak = Math.max(state.bestStreak, newStreakDays)

        // 更新状态
        set({
          xp: newXP,
          level: newLevel,
          streakDays: newStreakDays,
          bestStreak: newBestStreak,
          lastPracticeDate: today,
          completedSongs: isNewSong
            ? [...state.completedSongs, songId]
            : state.completedSongs,
          threeStarSongs: newThreeStarSongs,
          todayPracticeCount: isFirstPracticeToday
            ? 1
            : state.todayPracticeCount + 1,
          todayXP: newTodayXP,
          recentPractice: updatedRecentPractice,
        })

        return {
          xpEarned,
          leveledUp,
          isNewSong,
          streakBonus,
          isThreeStar,
        }
      },

      /**
       * 检查并更新连胜状态
       * @returns 连胜是否断了、新的连胜天数、是否是今天第一次练习
       */
      checkAndUpdateStreak: () => {
        const state = get()
        const today = getTodayString()

        // 已经是今天，不需要更新
        if (isToday(state.lastPracticeDate)) {
          return {
            streakBroken: false,
            newStreak: state.streakDays,
            isFirstPracticeToday: false,
          }
        }

        // 检查是否是昨天
        if (isYesterday(state.lastPracticeDate)) {
          // 连胜继续，但还没练习
          return {
            streakBroken: false,
            newStreak: state.streakDays,
            isFirstPracticeToday: true,
          }
        }

        // 连胜断了
        if (state.lastPracticeDate && state.streakDays > 0) {
          set({
            streakDays: 0,
            todayPracticeCount: 0,
          })

          return {
            streakBroken: true,
            newStreak: 0,
            isFirstPracticeToday: true,
          }
        }

        // 从未练习过
        return {
          streakBroken: false,
          newStreak: 0,
          isFirstPracticeToday: true,
        }
      },

      /**
       * 重置每日统计（用于测试或新的一天）
       */
      resetDailyStats: () => {
        set({
          todayPracticeCount: 0,
        })
      },

      /**
       * 设置昵称
       */
      setNickname: (name: string) => {
        set({ nickname: name })
      },

      /**
       * 设置头像emoji
       */
      setAvatarEmoji: (emoji: string) => {
        set({ avatarEmoji: emoji })
      },

      /**
       * 重置所有进度（开发用）
       */
      resetAllProgress: () => {
        set({
          xp: 0,
          level: 1,
          streakDays: 0,
          bestStreak: 0,
          lastPracticeDate: null,
          completedSongs: [],
          threeStarSongs: [],
          todayPracticeCount: 0,
          todayXP: 0,
          recentPractice: [],
          totalPracticeTime: 0,
        })
      },
    }),
    {
      name: 'melobuddy-game-storage',
      // 只持久化这些字段
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        streakDays: state.streakDays,
        bestStreak: state.bestStreak,
        lastPracticeDate: state.lastPracticeDate,
        completedSongs: state.completedSongs,
        threeStarSongs: state.threeStarSongs,
        todayPracticeCount: state.todayPracticeCount,
        todayXP: state.todayXP,
        recentPractice: state.recentPractice,
        totalPracticeTime: state.totalPracticeTime,
        nickname: state.nickname,
        avatarEmoji: state.avatarEmoji,
      }),
    }
  )
)

// ===================
// Selectors (优化重渲染)
// ===================

export const useXP = () => useGameStore((state) => state.xp)
export const useLevel = () => useGameStore((state) => state.level)
export const useStreakDays = () => useGameStore((state) => state.streakDays)
export const useTodayPracticeCount = () => useGameStore((state) => state.todayPracticeCount)
export const useCompletedSongs = () => useGameStore((state) => state.completedSongs)
export const useTodayXP = () => useGameStore((state) => state.todayXP)
export const useRecentPractice = () => useGameStore((state) => state.recentPractice)

// ===================
// 类型导出
// ===================

export type { GameState }
