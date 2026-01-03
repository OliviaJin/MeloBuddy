'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/stores'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { Language, t } from '@/i18n/translations'
import { songLibrary, searchSongs } from '@/data/songs/index'
import { SongMeta } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Music, Star, Clock, Check, Play, Search, X } from 'lucide-react'

// 难度筛选选项
type DifficultyFilter = 'all' | 1 | 2 | 3 | 4

const difficultyOptions: { value: DifficultyFilter; labelKey: string; stars?: number }[] = [
  { value: 'all', labelKey: 'library.all' },
  { value: 1, labelKey: 'library.beginner', stars: 1 },
  { value: 2, labelKey: 'library.elementary', stars: 2 },
  { value: 3, labelKey: 'library.intermediate', stars: 3 },
  { value: 4, labelKey: 'library.advanced', stars: 4 },
]

// 分类筛选选项
type CategoryFilter = 'all' | 'scale' | 'etude' | 'piece' | 'exam'

const categoryOptions: { value: CategoryFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'library.all' },
  { value: 'scale', labelKey: 'library.category.scale' },
  { value: 'etude', labelKey: 'library.category.etude' },
  { value: 'piece', labelKey: 'library.category.piece' },
  { value: 'exam', labelKey: 'library.category.exam' },
]

// SongCard 组件
function SongCard({
  song,
  isCompleted,
  language,
}: {
  song: SongMeta
  isCompleted: boolean
  language: Language
}) {
  const categoryColors: Record<SongMeta['category'], string> = {
    scale: 'bg-blue-100',
    etude: 'bg-amber-100',
    piece: 'bg-pink-100',
    exam: 'bg-purple-100',
  }

  const categoryIcons: Record<SongMeta['category'], string> = {
    scale: 'from-blue-400 to-blue-500',
    etude: 'from-amber-400 to-amber-500',
    piece: 'from-pink-400 to-pink-500',
    exam: 'from-purple-400 to-purple-500',
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
          {/* 分类图标 */}
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryIcons[song.category]} flex items-center justify-center shadow-sm`}
            >
              <Music className="w-7 h-7 text-white" />
            </div>
            {isCompleted && (
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm"
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
            <h3 className="font-bold text-gray-800 truncate">{song.title}</h3>
            {song.composer && (
              <p className="text-sm text-gray-500 truncate">{song.composer}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {/* 难度星级 */}
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
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
                <span className="text-xs">{song.duration}{t('library.seconds', language)}</span>
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
  const { completedSongs } = useGameStore()
  const { language } = useLanguageStore()

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选状态
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  // 筛选曲目
  const filteredSongs = useMemo(() => {
    let songs = songLibrary

    // 搜索过滤
    if (searchQuery.trim()) {
      songs = searchSongs(searchQuery.trim())
    }

    // 难度过滤
    if (difficultyFilter !== 'all') {
      songs = songs.filter((song) => song.difficulty === difficultyFilter)
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
      songs = songs.filter((song) => song.category === categoryFilter)
    }

    return songs
  }, [searchQuery, difficultyFilter, categoryFilter])

  // 统计
  const stats = useMemo(() => {
    const total = songLibrary.length
    const completed = completedSongs.length
    return { total, completed }
  }, [completedSongs])

  return (
    <div className="p-4 space-y-4">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-800">{t('library.title', language)}</h1>
        <p className="text-gray-500 text-sm">
          {t('library.completed', language)} {stats.completed}/{stats.total} {t('library.songs', language)}
        </p>
      </motion.div>

      {/* 搜索栏 */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('library.search', language)}
            className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* 难度筛选 Tab */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {difficultyOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setDifficultyFilter(option.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              difficultyFilter === option.value
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
                      difficultyFilter === option.value
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

      {/* 分类筛选 */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setCategoryFilter(option.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === option.value
                ? 'bg-secondary-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(option.labelKey, language)}
          </button>
        ))}
      </motion.div>

      {/* 曲目列表 */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredSongs.map((song, index) => {
            const isCompleted = completedSongs.includes(song.id)

            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <SongCard
                  song={song}
                  isCompleted={isCompleted}
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
            <p className="text-gray-500">{t('library.noResults', language)}</p>
          </motion.div>
        )}
      </div>

      {/* 底部间距 */}
      <div className="h-20" />
    </div>
  )
}
