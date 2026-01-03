'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Users, Award, ChevronRight } from 'lucide-react'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { PracticeMode } from '@/types/practice'
import { Song } from '@/data'

interface ModeSelectorProps {
  song: Song
  onSelectMode: (mode: PracticeMode) => void
  onBack: () => void
}

const modeIcons = {
  learn: BookOpen,
  follow: Users,
  assess: Award,
}

const modeColors = {
  learn: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200',
    activeBg: 'bg-blue-500',
  },
  follow: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    border: 'border-green-200',
    activeBg: 'bg-green-500',
  },
  assess: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    border: 'border-purple-200',
    activeBg: 'bg-purple-500',
  },
}

export function ModeSelector({ song, onSelectMode, onBack }: ModeSelectorProps) {
  const { language } = useLanguageStore()
  const modes: PracticeMode[] = ['learn', 'follow', 'assess']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="text-center flex-1 mx-4">
            <h1 className="font-bold text-gray-800 truncate">{song.title}</h1>
            <p className="text-xs text-gray-500">{song.composer}</p>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* 主内容 */}
      <div className="p-4 space-y-6">
        {/* 标题 */}
        <motion.div
          className="text-center pt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-gray-800">
            {t('practice.selectMode', language)}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {t('practice.selectModeDesc', language)}
          </p>
        </motion.div>

        {/* 模式卡片 */}
        <div className="space-y-4">
          {modes.map((mode, index) => {
            const Icon = modeIcons[mode]
            const colors = modeColors[mode]
            const isRecommended = mode === 'learn'

            return (
              <motion.button
                key={mode}
                onClick={() => onSelectMode(mode)}
                className={`w-full p-5 rounded-2xl border-2 ${colors.border} ${colors.bg} text-left relative overflow-hidden`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 推荐标签 */}
                {isRecommended && (
                  <span className="absolute top-3 right-3 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">
                    {t('practice.recommended', language)}
                  </span>
                )}

                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colors.icon}`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {t(`practice.mode.${mode}`, language)}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {t(`practice.mode.${mode}.desc`, language)}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      {t(`practice.mode.${mode}.tip`, language)}
                    </p>
                  </div>

                  {/* 箭头 */}
                  <ChevronRight className="w-5 h-5 text-gray-400 self-center" />
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* 曲目信息 */}
        <motion.div
          className="bg-white rounded-2xl p-4 shadow-cute"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{song.category}</p>
              <p className="font-medium text-gray-800">{song.duration}s</p>
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${star <= song.difficulty ? 'opacity-100' : 'opacity-20'}`}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
