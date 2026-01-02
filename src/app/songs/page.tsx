'use client'

import { useGameStore } from '@/stores'
import { songs, getSongsByDifficulty, getSongsByCategory } from '@/data'
import { Music, Check, Lock, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

type FilterType = 'all' | 'scale' | 'etude' | 'song'

const filterLabels: Record<FilterType, string> = {
  all: '全部',
  scale: '音阶',
  etude: '练习曲',
  song: '乐曲',
}

export default function SongsPage() {
  const { completedSongs, level } = useGameStore()
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredSongs =
    filter === 'all'
      ? songs
      : songs.filter((song) => {
          if (filter === 'scale') return song.category === '音阶'
          if (filter === 'etude') return song.category === '练习曲'
          if (filter === 'song') return song.category === '乐曲'
          return true
        })

  const isUnlocked = (requiredLevel: number) => level >= requiredLevel

  return (
    <div className="p-4 space-y-4">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-800">曲库</h1>
        <p className="text-gray-500 text-sm">选择一首曲目开始练习</p>
      </motion.div>

      {/* 分类筛选 */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {(Object.keys(filterLabels) as FilterType[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterLabels[key]}
          </button>
        ))}
      </motion.div>

      {/* 进度统计 */}
      <motion.div
        className="bg-pastel-purple rounded-2xl p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700">已完成曲目</p>
            <p className="text-2xl font-bold text-primary-800">
              {completedSongs.length} / {songs.length}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
        </div>
        <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(completedSongs.length / songs.length) * 100}%`,
            }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </div>
      </motion.div>

      {/* 曲目列表 */}
      <div className="space-y-3">
        {filteredSongs.map((song, index) => {
          const completed = completedSongs.includes(song.id)
          const unlocked = isUnlocked(song.requiredLevel)

          return (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {unlocked ? (
                <Link href={`/practice/${song.id}`}>
                  <div
                    className={`bg-white rounded-2xl p-4 shadow-cute border ${
                      completed ? 'border-green-200' : 'border-gray-100'
                    } flex items-center gap-4 btn-press`}
                  >
                    {/* 图标 */}
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center relative ${
                        song.category === '音阶'
                          ? 'bg-pastel-blue'
                          : song.category === '练习曲'
                          ? 'bg-pastel-yellow'
                          : 'bg-pastel-pink'
                      }`}
                    >
                      <Music className="w-7 h-7 text-gray-700" />
                      {completed && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">
                        {song.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {song.composer}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {song.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {song.tempo} BPM
                        </span>
                      </div>
                    </div>

                    {/* 难度 & XP */}
                    <div className="text-right">
                      <div className="flex gap-0.5 justify-end mb-1">
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
                      <span className="text-xs text-primary-600 font-medium">
                        +{song.xpReward} XP
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-4 opacity-60">
                  {/* 锁定图标 */}
                  <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-gray-400" />
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-500 truncate">
                      {song.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      需要等级 {song.requiredLevel} 解锁
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
