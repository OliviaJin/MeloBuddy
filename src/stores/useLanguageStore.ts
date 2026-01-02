import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Language, getDefaultLanguage } from '@/i18n/translations'

interface LanguageState {
  language: Language
  isInitialized: boolean
  setLanguage: (lang: Language) => void
  initLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'zh-CN', // 默认值，会被 initLanguage 覆盖
      isInitialized: false,

      setLanguage: (lang: Language) => {
        set({ language: lang })
      },

      initLanguage: () => {
        const { isInitialized } = get()
        if (!isInitialized) {
          // 首次使用时根据浏览器语言自动检测
          const detectedLang = getDefaultLanguage()
          set({ language: detectedLang, isInitialized: true })
        }
      },
    }),
    {
      name: 'melobuddy-language-storage',
      partialize: (state) => ({
        language: state.language,
        isInitialized: state.isInitialized,
      }),
    }
  )
)

// Selectors
export const useLanguage = () => useLanguageStore((state) => state.language)
