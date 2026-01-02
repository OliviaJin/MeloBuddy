'use client'

import { useGameStore } from '@/stores'
import { Flame, Star, Crown } from 'lucide-react'
import { motion } from 'framer-motion'

export function StatusBar() {
  const { xp, level, streakDays, getLevelProgress } = useGameStore()
  const progress = getLevelProgress()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[430px] mx-auto">
        <div className="bg-gradient-primary px-4 py-3 rounded-b-3xl shadow-lg">
          {/* 主状态栏 */}
          <div className="flex items-center justify-between text-white">
            {/* 连胜 */}
            <motion.div
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
              whileTap={{ scale: 0.95 }}
            >
              <Flame
                className={`w-4 h-4 ${streakDays > 0 ? 'text-orange-300' : 'text-white/50'}`}
                fill={streakDays > 0 ? 'currentColor' : 'none'}
              />
              <span className="font-bold text-sm">{streakDays}</span>
            </motion.div>

            {/* XP */}
            <motion.div
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
              whileTap={{ scale: 0.95 }}
            >
              <Star className="w-4 h-4 text-yellow-300" fill="currentColor" />
              <span className="font-bold text-sm">{xp.toLocaleString()}</span>
            </motion.div>

            {/* 等级 */}
            <motion.div
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
              whileTap={{ scale: 0.95 }}
            >
              <Crown className="w-4 h-4 text-amber-300" fill="currentColor" />
              <span className="font-bold text-sm">Lv.{level}</span>
            </motion.div>
          </div>

          {/* 经验条 */}
          <div className="mt-2.5">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
