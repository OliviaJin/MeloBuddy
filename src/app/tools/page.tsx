'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Music2, Timer } from 'lucide-react'
import Link from 'next/link'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { t } from '@/i18n/translations'
import { Tuner } from '@/components/tools'
import { Metronome } from '@/components/tools'

type ToolTab = 'tuner' | 'metronome'

export default function ToolsPage() {
  const { language } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<ToolTab>('tuner')

  const tabs: { id: ToolTab; icon: typeof Music2; labelKey: string }[] = [
    { id: 'tuner', icon: Music2, labelKey: 'tools.tuner' },
    { id: 'metronome', icon: Timer, labelKey: 'tools.metronome' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-800">{t('tools.title', language)}</h1>
          <div className="w-9" /> {/* 占位 */}
        </div>

        {/* Tab 切换 */}
        <div className="flex px-4 pb-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(tab.labelKey, language)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 工具内容 */}
      <div className="p-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'tuner' ? (
            <div className="space-y-4">
              <Tuner compact={false} />

              {/* 调音提示 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  {t('tools.tunerTips', language)}
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {t('tools.tunerTip1', language)}</li>
                  <li>• {t('tools.tunerTip2', language)}</li>
                  <li>• {t('tools.tunerTip3', language)}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Metronome initialBpm={80} initialTimeSignature="4/4" compact={false} />

              {/* 节拍器提示 */}
              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  {t('tools.metronomeTips', language)}
                </h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• {t('tools.metronomeTip1', language)}</li>
                  <li>• {t('tools.metronomeTip2', language)}</li>
                  <li>• {t('tools.metronomeTip3', language)}</li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
