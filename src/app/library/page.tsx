'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/stores'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { Language, t } from '@/i18n/translations'
import { songs, Song } from '@/data'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Music, Star, Clock, Check, Play, Lock } from 'lucide-react'

// 难度筛选选项
type DifficultyFilter = 'all' | 1 | 2 | 3

const filterOptions: { value: DifficultyFilter; labelKey: string; stars?: number }[] = [
  { value: 'all', labelKey: 'library.all' },
  { value: 1, labelKey: 'library.beginner', stars: 1 },
  { value: 2, labelKey: 'library.elementary', stars: 2 },
  { value: 3, labelKey: 'library.intermediate', stars: 3 },
]

// SongCard 组件
function SongCard({
  song,
  isCompleted,
  isLocked,
  language,
}: {
  song: Song
  isCompleted: boolean
  isLocked: boolean
  language: Language
}) {
  const categoryColors = {
    音阶: 'bg-blue-50 border-blue-200',
    练习曲: 'bg-amber-50 border-amber-200',
    乐曲: 'bg-pink-50 border-pink-200',
  }

  const categoryIcons = {
    音阶: 'bg-pastel-blue',
    练习曲: 'bg-pastel-yellow',
    乐曲: 'bg-pastel-pink',
  }

  if (isLocked) {
    return (
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 opacity-60">
        <div className="flex items-center gap-4">
          {/* 锁定图标 */}
          <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-400 truncate">{song.name}</h3>
            <p className="text-sm text-gray-400">{t('library.locked', language)}{song.requiredLevel}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/practice/${song.id}`}>
      <motion.div
        className={`bg-white rounded-2xl p-4 shadow-cute border ${
          isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
        } btn-press`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          {/* 难度星级 + 图标 */}
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-xl ${categoryIcons[song.category]} flex items-center justify-center`}
            >
              <Music className="w-7 h-7 text-gray-700" />
            </div>
            {isCompleted && (
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>

          {/* 曲目信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 truncate">{song.name}</h3>
            <p className="text-sm text-gray-500 truncate">{song.composer}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {/* 难度星级 */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < song.difficulty
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              {/* 时长 */}
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{song.duration}秒</span>
              </div>
            </div>
          </div>

          {/* XP + 开始按钮 */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              +{song.xpReward} XP
            </span>
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-sm">
              <Play className="w-4 h-4 text-white" fill="white" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function LibraryPage() {
  const { completedSongs, level } = useGameStore()
  const { language } = useLanguageStore()
  const [activeFilter, setActiveFilter] = useState<DifficultyFilter>('all')

  // 筛选曲目
  const filteredSongs = useMemo(() => {
    if (activeFilter === 'all') return songs
    return songs.filter((song) => song.difficulty === activeFilter)
  }, [activeFilter])

  // 统计
  const stats = useMemo(() => {
    const total = songs.length
    const completed = completedSongs.length
    const unlocked = songs.filter((s) => s.requiredLevel <= level).length
    return { total, completed, unlocked }
  }, [completedSongs, level])

  return (
    <div className="p-4 space-y-4">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-800">{t('library.title', language)}</h1>
        <p className="text-gray-500 text-sm">
          {t('library.completed', language)} {stats.completed}/{stats.total}
        </p>
      </motion.div>

      {/* 难度筛选 Tab */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setActiveFilter(option.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === option.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {option.stars && (
              <span className="flex">
                {Array.from({ length: option.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      activeFilter === option.value
                        ? 'text-yellow-300 fill-yellow-300'
                        : 'text-yellow-400 fill-yellow-400'
                    }`}
                  />
                ))}
              </span>
            )}
            {t(option.labelKey, language)}
          </button>
        ))}
      </motion.div>

      {/* 曲目列表 */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredSongs.map((song, index) => {
            const isCompleted = completedSongs.includes(song.id)
            const isLocked = song.requiredLevel > level

            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <SongCard
                  song={song}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                  language={language}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredSongs.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无此难度的曲目</p>
          </motion.div>
        )}
      </div>

      {/* 底部间距 */}
      <div className="h-4" />
    </div>
  )
}
