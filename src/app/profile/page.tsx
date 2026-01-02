'use client'

import { useState } from 'react'
import { useGameStore, getLevelXPRange } from '@/stores'
import { songs } from '@/data'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Star,
  Flame,
  Music,
  Trophy,
  Clock,
  ChevronRight,
  Info,
  RotateCcw,
  Edit3,
  Check,
  X,
} from 'lucide-react'

// 可选头像列表
const avatarEmojis = ['😺', '😸', '😻', '🐱', '🦊', '🐰', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮']

// 成就定义
interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  check: (state: {
    streakDays: number
    bestStreak: number
    completedSongs: string[]
    threeStarSongs: string[]
    xp: number
  }) => boolean
}

const achievements: Achievement[] = [
  {
    id: 'first-streak-3',
    name: '首次连胜3天',
    description: '连续练习3天',
    icon: '🔥',
    check: (s) => s.bestStreak >= 3,
  },
  {
    id: 'first-song',
    name: '完成第一首曲目',
    description: '完成任意一首曲目',
    icon: '🎵',
    check: (s) => s.completedSongs.length >= 1,
  },
  {
    id: 'first-three-star',
    name: '获得第一个三星',
    description: '以100%完成度完成曲目',
    icon: '⭐',
    check: (s) => s.threeStarSongs.length >= 1,
  },
  {
    id: 'all-scales',
    name: '完成所有音阶',
    description: '完成全部音阶练习',
    icon: '🎻',
    check: (s) => {
      const scaleSongs = songs.filter((song) => song.category === '音阶')
      return scaleSongs.every((song) => s.completedSongs.includes(song.id))
    },
  },
]

// 头像选择弹窗
function AvatarPicker({
  currentEmoji,
  onSelect,
  onClose,
}: {
  currentEmoji: string
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">选择头像</h3>
        <div className="grid grid-cols-4 gap-3">
          {avatarEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all ${
                emoji === currentEmoji
                  ? 'bg-primary-100 ring-2 ring-primary-500'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-500 font-medium"
        >
          取消
        </button>
      </motion.div>
    </motion.div>
  )
}

// 确认弹窗
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-700"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 rounded-xl font-bold text-white"
          >
            确认重置
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const {
    xp,
    level,
    streakDays,
    bestStreak,
    completedSongs,
    threeStarSongs,
    totalPracticeTime,
    nickname,
    avatarEmoji,
    setNickname,
    setAvatarEmoji,
    resetAllProgress,
  } = useGameStore()

  const [isEditingName, setIsEditingName] = useState(false)
  const [tempNickname, setTempNickname] = useState(nickname)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // XP进度
  const { min: currentLevelXp, max: nextLevelXp } = getLevelXPRange(level)
  const xpProgress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  // 检查成就状态
  const achievementState = { streakDays, bestStreak, completedSongs, threeStarSongs, xp }

  const handleSaveNickname = () => {
    if (tempNickname.trim()) {
      setNickname(tempNickname.trim())
    }
    setIsEditingName(false)
  }

  const handleResetProgress = () => {
    resetAllProgress()
    setShowResetConfirm(false)
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* 用户卡片 */}
      <motion.div
        className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-3xl p-5 text-white shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="relative"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              {avatarEmoji}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
              <Edit3 className="w-4 h-4 text-primary-600" />
            </div>
          </button>

          {/* 信息 */}
          <div className="flex-1">
            {/* 昵称 */}
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="bg-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50 outline-none flex-1"
                  placeholder="输入昵称"
                  maxLength={10}
                  autoFocus
                />
                <button
                  onClick={handleSaveNickname}
                  className="p-1 bg-white/20 rounded-full"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTempNickname(nickname)
                    setIsEditingName(false)
                  }}
                  className="p-1 bg-white/20 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 mb-1"
              >
                <h1 className="text-xl font-bold">{nickname}</h1>
                <Edit3 className="w-4 h-4 opacity-60" />
              </button>
            )}

            {/* 等级徽章 */}
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm font-medium">
                Lv.{level}
              </span>
              <span className="text-white/70 text-sm">小提琴学员</span>
            </div>
          </div>
        </div>

        {/* XP进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-white/70">经验值</span>
            <span className="text-white/70">
              {xp} / {nextLevelXp} XP
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          </div>
        </div>
      </motion.div>

      {/* 统计数据 */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white rounded-2xl p-4 shadow-cute">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">总练习时长</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {formatTime(totalPracticeTime)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-cute">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Music className="w-4 h-4" />
            <span className="text-xs">完成曲目</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {completedSongs.length} <span className="text-sm font-normal text-gray-500">/ {songs.length}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-cute">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs">最长连胜</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {bestStreak} <span className="text-sm font-normal text-gray-500">天</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-cute">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-xs">总获得XP</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{xp}</p>
        </div>
      </motion.div>

      {/* 成就展示 */}
      <motion.div
        className="bg-white rounded-2xl p-4 shadow-cute"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">成就</h2>
          <span className="text-xs text-gray-500">
            {achievements.filter((a) => a.check(achievementState)).length} / {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {achievements.map((achievement) => {
            const unlocked = achievement.check(achievementState)
            return (
              <div
                key={achievement.id}
                className="text-center"
                title={achievement.description}
              >
                <motion.div
                  className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-2xl mb-1 ${
                    unlocked
                      ? 'bg-gradient-to-br from-primary-100 to-secondary-100'
                      : 'bg-gray-100 grayscale opacity-40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {achievement.icon}
                </motion.div>
                <p className={`text-xs ${unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                  {achievement.name}
                </p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* 设置 */}
      <motion.div
        className="bg-white rounded-2xl shadow-cute overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
            <RotateCcw className="w-5 h-5" />
          </div>
          <span className="flex-1 text-left text-gray-700">重置进度</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <div className="w-full flex items-center gap-4 px-4 py-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-gray-700">关于App</span>
            <p className="text-xs text-gray-400">乐伴 MeloBuddy v1.0.0</p>
          </div>
        </div>
      </motion.div>

      {/* 头像选择弹窗 */}
      <AnimatePresence>
        {showAvatarPicker && (
          <AvatarPicker
            currentEmoji={avatarEmoji}
            onSelect={setAvatarEmoji}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* 重置确认弹窗 */}
      <AnimatePresence>
        {showResetConfirm && (
          <ConfirmDialog
            title="重置进度"
            message="确定要重置所有进度吗？这将清除你的所有XP、等级、成就和练习记录。此操作无法撤销。"
            onConfirm={handleResetProgress}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
