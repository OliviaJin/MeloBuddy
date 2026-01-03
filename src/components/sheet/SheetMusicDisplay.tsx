'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Music } from 'lucide-react'
import { ParsedNote } from '@/types'
import { loadMusicXML, addDefaultFingerings } from '@/lib/musicxml-parser'

interface SheetMusicDisplayProps {
  musicXmlUrl: string
  currentNoteIndex?: number
  highlightColor?: string
  zoom?: number
  showCursor?: boolean
  onReady?: (notes: ParsedNote[]) => void
  onNoteClick?: (index: number) => void
}

type LoadingState = 'idle' | 'loading' | 'ready' | 'error'

export function SheetMusicDisplay({
  musicXmlUrl,
  currentNoteIndex = -1,
  highlightColor = '#8B5CF6',
  zoom = 1.0,
  showCursor = true,
  onReady,
  onNoteClick,
}: SheetMusicDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<InstanceType<typeof import('opensheetmusicdisplay').OpenSheetMusicDisplay> | null>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedNotes, setParsedNotes] = useState<ParsedNote[]>([])
  const [title, setTitle] = useState('')
  const [composer, setComposer] = useState('')

  // 存储音符元素的位置信息
  const notePositionsRef = useRef<Map<number, DOMRect>>(new Map())

  // 初始化 OSMD
  const initOSMD = useCallback(async () => {
    // 等待容器挂载
    if (!containerRef.current) {
      console.warn('OSMD container not mounted yet')
      return
    }

    // 确保容器有尺寸
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      console.warn('OSMD container has no dimensions')
      return
    }

    setLoadingState('loading')
    setError(null)

    try {
      // 动态导入 OSMD (仅在客户端)
      const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay')

      // 清理之前的实例
      if (osmdRef.current) {
        osmdRef.current.clear()
      }

      // 创建 OSMD 实例
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawTitle: true,
        drawComposer: true,
        drawMeasureNumbers: true,
        drawTimeSignatures: true,
        drawingParameters: 'default',
        coloringEnabled: true,
      })

      osmdRef.current = osmd

      // 加载并解析 MusicXML
      const parsedSong = await loadMusicXML(musicXmlUrl)
      const songWithFingerings = addDefaultFingerings(parsedSong)

      setTitle(parsedSong.title)
      setComposer(parsedSong.composer)
      setParsedNotes(songWithFingerings.notes)

      // 使用 OSMD 渲染
      await osmd.load(musicXmlUrl)
      osmd.zoom = zoom
      osmd.render()

      // 启用光标
      if (showCursor && osmd.cursor) {
        osmd.cursor.show()
      }

      // 收集音符位置
      collectNotePositions()

      setLoadingState('ready')
      onReady?.(songWithFingerings.notes)
    } catch (err) {
      console.error('OSMD initialization error:', err)
      setError(err instanceof Error ? err.message : '加载乐谱失败')
      setLoadingState('error')
    }
  }, [musicXmlUrl, zoom, showCursor, onReady])

  // 收集音符元素位置
  const collectNotePositions = useCallback(() => {
    if (!containerRef.current) return

    notePositionsRef.current.clear()

    // 查找所有音符元素
    const noteElements = containerRef.current.querySelectorAll('.vf-stavenote, .vf-note')
    noteElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect()
      notePositionsRef.current.set(index, rect)
    })
  }, [])

  // 初始化 - 等待下一帧确保 DOM 已渲染
  useEffect(() => {
    // 使用 requestAnimationFrame 确保容器已挂载
    const frameId = requestAnimationFrame(() => {
      initOSMD()
    })

    return () => {
      cancelAnimationFrame(frameId)
      if (osmdRef.current) {
        osmdRef.current.clear()
        osmdRef.current = null
      }
    }
  }, [initOSMD])

  // 缩放变化时重新渲染
  useEffect(() => {
    if (osmdRef.current && loadingState === 'ready') {
      osmdRef.current.zoom = zoom
      osmdRef.current.render()
      collectNotePositions()
    }
  }, [zoom, loadingState, collectNotePositions])

  // 光标跟随当前音符
  useEffect(() => {
    if (!osmdRef.current || !showCursor || loadingState !== 'ready') return

    const osmd = osmdRef.current
    const cursor = osmd.cursor

    if (!cursor) return

    try {
      // 重置光标到开始
      cursor.reset()

      // 移动到目标音符
      for (let i = 0; i < currentNoteIndex && !cursor.iterator.EndReached; i++) {
        cursor.next()
      }

      // 高亮当前音符
      highlightCurrentNote()

      // 滚动到可见区域
      scrollToCurrentNote()
    } catch (err) {
      console.warn('Cursor navigation error:', err)
    }
  }, [currentNoteIndex, showCursor, loadingState, highlightColor])

  // 高亮当前音符
  const highlightCurrentNote = useCallback(() => {
    if (!containerRef.current || !osmdRef.current) return

    // 移除之前的高亮
    const prevHighlighted = containerRef.current.querySelectorAll('.note-highlighted')
    prevHighlighted.forEach(el => {
      el.classList.remove('note-highlighted')
      ;(el as HTMLElement).style.fill = ''
      ;(el as HTMLElement).style.stroke = ''
    })

    // 获取当前光标位置的音符
    const cursor = osmdRef.current.cursor
    if (!cursor || currentNoteIndex < 0) return

    // 尝试高亮当前音符的 SVG 元素
    const cursorElement = cursor.cursorElement
    if (cursorElement) {
      // 设置光标颜色
      cursorElement.style.backgroundColor = highlightColor
      cursorElement.style.opacity = '0.3'
    }

    // 查找并高亮对应的音符元素
    const noteElements = containerRef.current.querySelectorAll('.vf-stavenote, .vf-notehead')
    if (noteElements[currentNoteIndex]) {
      const noteEl = noteElements[currentNoteIndex] as HTMLElement
      noteEl.classList.add('note-highlighted')

      // 高亮所有子元素
      const paths = noteEl.querySelectorAll('path, ellipse, circle')
      paths.forEach(path => {
        ;(path as HTMLElement).style.fill = highlightColor
        ;(path as HTMLElement).style.stroke = highlightColor
      })
    }
  }, [currentNoteIndex, highlightColor])

  // 滚动到当前音符
  const scrollToCurrentNote = useCallback(() => {
    if (!containerRef.current || !osmdRef.current?.cursor) return

    const cursor = osmdRef.current.cursor
    const cursorElement = cursor.cursorElement

    if (cursorElement) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const cursorRect = cursorElement.getBoundingClientRect()

      // 计算相对位置
      const relativeLeft = cursorRect.left - containerRect.left
      const containerScrollLeft = containerRef.current.scrollLeft
      const containerWidth = containerRef.current.clientWidth

      // 如果光标在可见区域外，滚动
      if (relativeLeft < 50) {
        containerRef.current.scrollTo({
          left: containerScrollLeft + relativeLeft - containerWidth / 3,
          behavior: 'smooth',
        })
      } else if (relativeLeft > containerWidth - 50) {
        containerRef.current.scrollTo({
          left: containerScrollLeft + relativeLeft - containerWidth / 3,
          behavior: 'smooth',
        })
      }
    }
  }, [])

  // 处理容器点击事件
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onNoteClick || !containerRef.current) return

      const clickX = e.clientX
      const clickY = e.clientY

      // 查找最近的音符
      let closestIndex = -1
      let closestDistance = Infinity

      notePositionsRef.current.forEach((rect, index) => {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const distance = Math.sqrt(
          Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
        )

        if (distance < closestDistance && distance < 50) {
          closestDistance = distance
          closestIndex = index
        }
      })

      if (closestIndex >= 0) {
        onNoteClick(closestIndex)
      }
    },
    [onNoteClick]
  )

  return (
    <div className="bg-white rounded-2xl shadow-cute overflow-hidden">
      {/* 标题栏 - 只在加载完成后显示 */}
      <AnimatePresence>
        {loadingState === 'ready' && (title || composer) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 border-b border-gray-100 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="font-medium text-gray-800 truncate">{title}</h3>
              )}
              {composer && (
                <p className="text-xs text-gray-500 truncate">{composer}</p>
              )}
            </div>
            {parsedNotes.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {parsedNotes.length} 音符
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 乐谱容器 - 始终渲染以便 OSMD 挂载 */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative overflow-x-auto overflow-y-hidden p-4"
        style={{
          minHeight: '200px',
          cursor: onNoteClick ? 'pointer' : 'default',
          display: loadingState === 'error' ? 'none' : 'block',
        }}
      >
        {/* OSMD 会在这里渲染 SVG */}
      </div>

      {/* 加载状态覆盖层 */}
      {loadingState === 'loading' && (
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-primary-500" />
          </motion.div>
          <p className="mt-4 text-gray-500">加载乐谱中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {loadingState === 'error' && (
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium mb-2">加载失败</p>
          <p className="text-gray-500 text-sm text-center">{error}</p>
          <button
            onClick={initOSMD}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* 自定义光标指示器 */}
      {showCursor && currentNoteIndex >= 0 && loadingState === 'ready' && (
        <div
          ref={cursorRef}
          className="pointer-events-none"
          style={{
            position: 'absolute',
            width: '4px',
            backgroundColor: highlightColor,
            opacity: 0.5,
            borderRadius: '2px',
            transition: 'all 0.15s ease-out',
          }}
        />
      )}

      {/* CSS for highlighting */}
      <style jsx global>{`
        .note-highlighted path,
        .note-highlighted ellipse,
        .note-highlighted circle {
          fill: ${highlightColor} !important;
          stroke: ${highlightColor} !important;
        }

        .cursor {
          background-color: ${highlightColor} !important;
          opacity: 0.3 !important;
        }
      `}</style>
    </div>
  )
}
