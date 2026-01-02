'use client'

import { StatusBar } from './StatusBar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  hideStatusBar?: boolean
  hideBottomNav?: boolean
}

export function AppShell({
  children,
  hideStatusBar = false,
  hideBottomNav = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 移动端容器 */}
      <div className="max-w-[430px] mx-auto min-h-screen bg-white shadow-xl relative">
        {/* 顶部状态栏 */}
        {!hideStatusBar && <StatusBar />}

        {/* 主内容区域 */}
        <main
          className={`
            ${!hideStatusBar ? 'pt-[72px]' : ''}
            ${!hideBottomNav ? 'pb-[80px]' : ''}
            min-h-screen
          `}
        >
          {children}
        </main>

        {/* 底部导航 */}
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  )
}
