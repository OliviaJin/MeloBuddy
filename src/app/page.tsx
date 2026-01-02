'use client'

import { useGameStore } from '@/stores'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { Language, t } from '@/i18n/translations'
import { songs, getSongById } from '@/data'
import { Music, Play, Flame, Star, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMemo } from 'react'

// 根据时间获取问候语
function getGreeting(lang: Language): { text: string; tip: string } {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 9) {
    return {
      text: t('home.greeting.morning', lang),
      tip: t('home.greeting.morning.tip', lang),
    }
  } else if (hour >= 9 && hour < 12) {
    return {
      text: t('home.greeting.forenoon', lang),
      tip: t('home.greeting.forenoon.tip', lang),
    }
  } else if (hour >= 12 && hour < 14) {
    return {
      text: t('home.greeting.noon', lang),
      tip: t('home.greeting.noon.tip', lang),
    }
  } else if (hour >= 14 && hour < 17) {
    return {
      text: t('home.greeting.afternoon', lang),
      tip: t('home.greeting.afternoon.tip', lang),
    }
  } else if (hour >= 17 && hour < 19) {
    return {
      text: t('home.greeting.evening', lang),
      tip: t('home.greeting.evening.tip', lang),
    }
  } else if (hour >= 19 && hour < 22) {
    return {
      text: t('home.greeting.night', lang),
      tip: t('home.greeting.night.tip', lang),
    }
  } else {
    return {
      text: t('home.greeting.late', lang),
      tip: t('home.greeting.late.tip', lang),
    }
  }
}

// 喵Do吉祥物组件 - 使用可爱猫咪emoji
function MascotCat({ mood = 'happy' }: { mood?: 'happy' | 'excited' | 'sleepy' }) {
  // 根据心情选择不同的猫咪emoji
  const catEmojis = {
    happy: '😺',      // 开心猫咪
    excited: '😻',    // 兴奋/心动猫咪
    sleepy: '😸',     // 眯眼微笑猫咪
  }

  return (
    <motion.div
      className="relative"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="relative">
        {/* 猫咪主体 */}
        <motion.span
          className="text-6xl block"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {catEmojis[mood]}
        </motion.span>
        {/* 小提琴装饰 */}
        <motion.span
          className="absolute -right-3 -bottom-1 text-2xl"
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎻
        </motion.span>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const {
    streakDays,
    todayPracticeCount,
    todayXP,
    completedSongs,
    recentPractice,
    level,
  } = useGameStore()

  const { language } = useLanguageStore()

  const greeting = useMemo(() => getGreeting(language), [language])
  const hour = new Date().getHours()

  // 吉祥物心情
  const mascotMood = hour >= 22 || hour < 5 ? 'sleepy' : streakDays >= 3 ? 'excited' : 'happy'

  // 推荐曲目（未完成的最简单曲目）
  const recommendedSong = useMemo(() => {
    return songs
      .filter((song) => !completedSongs.includes(song.id) && song.requiredLevel <= level)
      .sort((a, b) => a.difficulty - b.difficulty)[0] || songs[0]
  }, [completedSongs, level])

  // 最近练习的曲目（去重，取最近3首）
  const recentSongs = useMemo(() => {
    const uniqueSongIds = [...new Set(recentPractice.map((r) => r.songId))]
    return uniqueSongIds
      .slice(0, 3)
      .map((id) => getSongById(id))
      .filter(Boolean)
  }, [recentPractice])

  // 今日目标（3首）
  const dailyGoal = 3
  const progressPercent = Math.min((todayPracticeCount / dailyGoal) * 100, 100)

  // 是否有练习记录
  const hasPracticed = recentPractice.length > 0

  return (
    <div className="p-4 space-y-5">
      {/* 欢迎区域 */}
      <motion.div
        className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-3xl p-5 text-white shadow-lg overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <motion.h1
              className="text-2xl font-bold mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {greeting.text}
            </motion.h1>
            <motion.p
              className="text-white/80 text-sm mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {greeting.tip}
            </motion.p>

            {/* 今日统计小标签 */}
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {streakDays > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-xs font-medium">{streakDays}{t('home.streak', language)}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* 吉祥物 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <MascotCat mood={mascotMood} />
          </motion.div>
        </div>
      </motion.div>

      {/* 快速开始卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Link href={`/practice/${recommendedSong.id}`}>
          <motion.div
            className="bg-white rounded-2xl p-4 shadow-cute border border-gray-100 btn-press"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              {/* 播放图标 */}
              <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-md">
                <Play className="w-7 h-7 text-white" fill="white" />
              </div>

              {/* 信息 */}
              <div className="flex-1">
                <p className="text-xs text-primary-600 font-medium mb-0.5">
                  {hasPracticed ? t('home.continuePractice', language) : t('home.startPractice', language)}
                </p>
                <h3 className="font-bold text-gray-800">{recommendedSong.name}</h3>
                <p className="text-sm text-gray-500">{recommendedSong.composer}</p>
              </div>

              {/* XP */}
              <div className="text-right">
                <div className="flex gap-0.5 justify-end mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < recommendedSong.difficulty
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-primary-600 font-bold">
                  +{recommendedSong.xpReward} XP
                </span>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* 今日进度 */}
      <motion.div
        className="bg-white rounded-2xl p-4 shadow-cute border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">{t('home.todayProgress', language)}</h2>
          <span className="text-xs text-gray-500">
            {t('home.goal', language)}: {dailyGoal}{t('home.songs', language)}
          </span>
        </div>

        {/* 进度条 */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-pastel-blue rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Music className="w-4 h-4" />
              <span className="text-xs">{t('home.practiced', language)}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {todayPracticeCount} <span className="text-sm font-normal text-gray-500">{t('home.songs', language)}</span>
            </p>
          </div>
          <div className="bg-pastel-yellow rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs">{t('home.earned', language)}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {todayXP} <span className="text-sm font-normal text-gray-500">XP</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* 最近练习 */}
      {recentSongs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">{t('home.recentPractice', language)}</h2>
            <Link
              href="/library"
              className="text-primary-600 text-sm font-medium flex items-center gap-0.5"
            >
              {t('home.allLibrary', language)}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentSongs.map((song, index) => (
              <motion.div
                key={song!.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Link href={`/practice/${song!.id}`}>
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 btn-press">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        song!.category === '音阶'
                          ? 'bg-pastel-blue'
                          : song!.category === '练习曲'
                          ? 'bg-pastel-yellow'
                          : 'bg-pastel-pink'
                      }`}
                    >
                      <Music className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm truncate">
                        {song!.name}
                      </h3>
                      <p className="text-xs text-gray-500">{song!.composer}</p>
                    </div>
                    <Play className="w-5 h-5 text-primary-500" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 新用户引导 - 如果没有练习记录 */}
      {recentSongs.length === 0 && (
        <motion.div
          className="bg-pastel-purple rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-primary-800 mb-1">{t('home.welcome', language)}</h3>
              <p className="text-sm text-primary-700">
                {t('home.welcomeTip', language)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
