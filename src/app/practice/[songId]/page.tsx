'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getSongById } from '@/data'
import { useGameStore } from '@/stores'
import { useLanguageStore } from '@/stores/useLanguageStore'
import { PracticeMode, PracticeResult } from '@/types/practice'
import {
  ModeSelector,
  LearnMode,
  FollowMode,
  AssessMode,
  PracticeComplete,
} from '@/components/practice'

type PageState = 'mode-select' | 'practicing' | 'complete'

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const songId = params.songId as string
  const song = getSongById(songId)

  const { completePractice } = useGameStore()
  const { language } = useLanguageStore()

  // 页面状态
  const [pageState, setPageState] = useState<PageState>('mode-select')
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null)
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null)

  // 选择模式
  const handleSelectMode = useCallback((mode: PracticeMode) => {
    setSelectedMode(mode)
    setPageState('practicing')
  }, [])

  // 返回模式选择
  const handleBackToModeSelect = useCallback(() => {
    setPageState('mode-select')
    setSelectedMode(null)
    setPracticeResult(null)
  }, [])

  // 完成练习
  const handleComplete = useCallback((result: Omit<PracticeResult, 'mode' | 'songId'>) => {
    if (!selectedMode) return

    // 保存练习结果到 store
    const storeResult = completePractice(songId, result.score)

    const fullResult: PracticeResult = {
      ...result,
      mode: selectedMode,
      songId,
      xpEarned: storeResult.xpEarned,
    }

    setPracticeResult(fullResult)
    setPageState('complete')
  }, [selectedMode, songId, completePractice])

  // 重新练习（保持当前模式）
  const handleReplay = useCallback(() => {
    setPracticeResult(null)
    setPageState('practicing')
  }, [])

  // 返回首页
  const handleHome = useCallback(() => {
    router.push('/')
  }, [router])

  // 返回（从练习中返回模式选择）
  const handleBack = useCallback(() => {
    setPageState('mode-select')
    setSelectedMode(null)
  }, [])

  // 曲目不存在
  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">曲目不存在</p>
      </div>
    )
  }

  // 渲染模式选择
  if (pageState === 'mode-select') {
    return (
      <ModeSelector
        song={song}
        onSelectMode={handleSelectMode}
        onBack={() => router.back()}
      />
    )
  }

  // 渲染练习完成
  if (pageState === 'complete' && practiceResult) {
    return (
      <AnimatePresence>
        <PracticeComplete
          song={song}
          result={practiceResult}
          onReplay={handleReplay}
          onHome={handleHome}
          onSelectMode={handleBackToModeSelect}
          language={language}
        />
      </AnimatePresence>
    )
  }

  // 渲染练习模式
  if (pageState === 'practicing' && selectedMode) {
    switch (selectedMode) {
      case 'learn':
        return (
          <LearnMode
            song={song}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )
      case 'follow':
        return (
          <FollowMode
            song={song}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )
      case 'assess':
        return (
          <AssessMode
            song={song}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )
    }
  }

  // 默认返回模式选择
  return (
    <ModeSelector
      song={song}
      onSelectMode={handleSelectMode}
      onBack={() => router.back()}
    />
  )
}
