'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Library, MessageCircle, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface NavItem {
  id: string
  href: string
  icon: typeof Home
  label: string
}

const navItems: NavItem[] = [
  { id: 'home', href: '/', icon: Home, label: '首页' },
  { id: 'library', href: '/library', icon: Library, label: '曲库' },
  { id: 'ai-chat', href: '/ai-chat', icon: MessageCircle, label: '喵Do' },
  { id: 'achievements', href: '/achievements', icon: Trophy, label: '成就' },
  { id: 'profile', href: '/profile', icon: User, label: '我的' },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[430px] mx-auto">
        <div className="bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
          <div className="flex items-center justify-around py-2 px-4">
            {navItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              return (
                <Link key={item.id} href={item.href} className="relative">
                  <motion.div
                    className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                      active
                        ? 'text-primary-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {/* 背景高亮 */}
                    {active && (
                      <motion.div
                        className="absolute inset-0 bg-primary-50 rounded-xl"
                        layoutId="navBackground"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* 图标 */}
                    <motion.div
                      className="relative z-10"
                      animate={{
                        scale: active ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon
                        className="w-6 h-6"
                        strokeWidth={active ? 2.5 : 2}
                        fill={active ? 'currentColor' : 'none'}
                      />
                    </motion.div>

                    {/* 标签 */}
                    <span
                      className={`relative z-10 text-xs mt-1 font-medium ${
                        active ? 'text-primary-600' : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
