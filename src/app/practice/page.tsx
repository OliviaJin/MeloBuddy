'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { songs } from '@/data'
import { useGameStore } from '@/stores'

export default function PracticePage() {
  const router = useRouter()
  const { completedSongs, level } = useGameStore()

  useEffect(() => {
    // 找到一个推荐的曲目（未完成的、等级足够的）
    const availableSongs = songs.filter(
      (song) =>
        !completedSongs.includes(song.id) && level >= song.requiredLevel
    )

    if (availableSongs.length > 0) {
      // 选择第一个未完成的曲目
      router.replace(`/practice/${availableSongs[0].id}`)
    } else {
      // 如果所有曲目都完成了，选择第一首曲目
      router.replace(`/practice/${songs[0].id}`)
    }
  }, [router, completedSongs, level])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
        <p className="text-gray-500">正在加载...</p>
      </div>
    </div>
  )
}
