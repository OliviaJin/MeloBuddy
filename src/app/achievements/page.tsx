'use client'

import { useGameStore } from '@/stores'
import { songs } from '@/data'
import { motion } from 'framer-motion'
import { Trophy, Star, Flame, Music, Target, Award, Lock } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  condition: (state: {
    level: number
    streakDays: number
    completedSongs: string[]
    xp: number
    todayPracticeCount: number
  }) => boolean
  progress: (state: {
    level: number
    streakDays: number
    completedSongs: string[]
    xp: number
    todayPracticeCount: number
  }) => { current: number; total: number }
}

const achievements: Achievement[] = [
  {
    id: 'first-song',
    name: '初次演奏',
    description: '完成第一首曲目',
    icon: <Music className="w-6 h-6" />,
    condition: (s) => s.completedSongs.length >= 1,
    progress: (s) => ({ current: Math.min(s.completedSongs.length, 1), total: 1 }),
  },
  {
    id: 'song-collector-3',
    name: '曲目收集者',
    description: '完成3首曲目',
    icon: <Star className="w-6 h-6" />,
    condition: (s) => s.completedSongs.length >= 3,
    progress: (s) => ({ current: Math.min(s.completedSongs.length, 3), total: 3 }),
  },
  {
    id: 'song-master',
    name: '曲库大师',
    description: '完成全部曲目',
    icon: <Trophy className="w-6 h-6" />,
    condition: (s) => s.completedSongs.length >= songs.length,
    progress: (s) => ({
      current: Math.min(s.completedSongs.length, songs.length),
      total: songs.length,
    }),
  },
  {
    id: 'streak-3',
    name: '持之以恒',
    description: '连续练习3天',
    icon: <Flame className="w-6 h-6" />,
    condition: (s) => s.streakDays >= 3,
    progress: (s) => ({ current: Math.min(s.streakDays, 3), total: 3 }),
  },
  {
    id: 'streak-7',
    name: '周周不断',
    description: '连续练习7天',
    icon: <Flame className="w-6 h-6" />,
    condition: (s) => s.streakDays >= 7,
    progress: (s) => ({ current: Math.min(s.streakDays, 7), total: 7 }),
  },
  {
    id: 'streak-30',
    name: '月度坚持',
    description: '连续练习30天',
    icon: <Award className="w-6 h-6" />,
    condition: (s) => s.streakDays >= 30,
    progress: (s) => ({ current: Math.min(s.streakDays, 30), total: 30 }),
  },
  {
    id: 'level-5',
    name: '初学者',
    description: '达到5级',
    icon: <Target className="w-6 h-6" />,
    condition: (s) => s.level >= 5,
    progress: (s) => ({ current: Math.min(s.level, 5), total: 5 }),
  },
  {
    id: 'level-10',
    name: '进阶者',
    description: '达到10级',
    icon: <Target className="w-6 h-6" />,
    condition: (s) => s.level >= 10,
    progress: (s) => ({ current: Math.min(s.level, 10), total: 10 }),
  },
  {
    id: 'xp-1000',
    name: '经验丰富',
    description: '累计获得1000 XP',
    icon: <Star className="w-6 h-6" />,
    condition: (s) => s.xp >= 1000,
    progress: (s) => ({ current: Math.min(s.xp, 1000), total: 1000 }),
  },
]

export default function AchievementsPage() {
  const { level, streakDays, completedSongs, xp, todayPracticeCount } =
    useGameStore()

  const state = { level, streakDays, completedSongs, xp, todayPracticeCount }

  const unlockedCount = achievements.filter((a) => a.condition(state)).length

  return (
    <div className="p-4 space-y-4">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-800">成就</h1>
        <p className="text-gray-500 text-sm">记录你的每一个里程碑</p>
      </motion.div>

      {/* 成就统计 */}
      <motion.div
        className="bg-gradient-primary rounded-2xl p-5 text-white"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">已解锁成就</p>
            <p className="text-3xl font-bold">
              {unlockedCount} / {achievements.length}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(unlockedCount / achievements.length) * 100}%`,
            }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </div>
      </motion.div>

      {/* 成就列表 */}
      <div className="space-y-3">
        {achievements.map((achievement, index) => {
          const unlocked = achievement.condition(state)
          const progress = achievement.progress(state)
          const progressPercent = (progress.current / progress.total) * 100

          return (
            <motion.div
              key={achievement.id}
              className={`rounded-2xl p-4 ${
                unlocked
                  ? 'bg-white shadow-cute border border-primary-100'
                  : 'bg-gray-50 border border-gray-200'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="flex items-center gap-4">
                {/* 图标 */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    unlocked
                      ? 'bg-gradient-primary text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                </div>

                {/* 信息 */}
                <div className="flex-1">
                  <h3
                    className={`font-bold ${
                      unlocked ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {achievement.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      unlocked ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {/* 进度条 */}
                  {!unlocked && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-300 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {progress.current} / {progress.total}
                      </p>
                    </div>
                  )}
                </div>

                {/* 完成标记 */}
                {unlocked && (
                  <div className="text-green-500">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 + index * 0.1 }}
                    >
                      <Trophy className="w-6 h-6" />
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
