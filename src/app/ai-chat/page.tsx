'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'

// 消息类型
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// 快捷问题
const quickQuestions = [
  '小提琴怎么调音？',
  'G弦在哪里？',
  '初学者应该怎么练习？',
  '如何拉出好听的声音？',
  '每天练习多久合适？',
  '什么是揉弦？',
]

// 打字动画组件
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

// 消息气泡组件
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 头像 */}
      {!isUser && (
        <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center text-lg flex-shrink-0">
          😸
        </div>
      )}

      {/* 消息内容 */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-primary text-white rounded-br-sm'
            : 'bg-white shadow-cute rounded-bl-sm'
        }`}
      >
        <p className={`text-sm whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-700'}`}>
          {message.content}
        </p>
      </div>
    </motion.div>
  )
}

// 流式消息气泡（正在生成中）
function StreamingBubble({ content }: { content: string }) {
  return (
    <motion.div
      className="flex items-end gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center text-lg flex-shrink-0">
        😸
      </div>
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white shadow-cute rounded-bl-sm">
        <p className="text-sm whitespace-pre-wrap text-gray-700">
          {content}
          <motion.span
            className="inline-block w-2 h-4 bg-primary-500 ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </p>
      </div>
    </motion.div>
  )
}

interface AIChatPageProps {
  context?: {
    songName?: string
    composer?: string
    difficulty?: number
    category?: string
  }
  isModal?: boolean
  onClose?: () => void
}

export default function AIChatPage({ context, isModal = false }: AIChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: context
        ? `你好！我是喵Do~😸\n\n我看到你正在练习「${context.songName}」，有什么问题想问我吗？`
        : '你好！我是喵Do，你的小提琴学习伙伴！🎻\n\n有什么想问的吗？可以点击下面的快捷问题，或者直接输入你的疑问~',
      timestamp: Date.now(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, streamingContent, scrollToBottom])

  // 发送消息（流式）
  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsTyping(true)
    setStreamingContent('')

    try {
      // 创建 AbortController 用于取消请求
      abortControllerRef.current = new AbortController()

      // 准备发送给 API 的消息（不包括初始欢迎消息）
      const apiMessages = newMessages
        .filter((_, index) => index > 0) // 跳过初始欢迎消息
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          context,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullContent += parsed.text
                setStreamingContent(fullContent)
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 添加完整的 AI 消息
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent || '抱歉，我暂时无法回答这个问题。请稍后再试~',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      // 如果是取消请求，不显示错误
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      // API 错误时显示友好提示
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '喵呜...我暂时遇到了一点问题 😿\n\n请稍后再试，或者换个问题问我吧~',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }

  // 处理快捷问题点击
  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const containerHeight = isModal ? 'h-[70vh]' : 'h-[calc(100vh-8rem)]'

  return (
    <div className={`flex flex-col ${containerHeight}`}>
      {/* 标题栏 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-xl">
            😸
          </div>
          <div>
            <h1 className="font-bold text-gray-800">喵Do老师</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI小提琴助手
            </p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* 流式内容 */}
        {streamingContent && <StreamingBubble content={streamingContent} />}

        {/* 打字动画（无流式内容时显示） */}
        <AnimatePresence>
          {isTyping && !streamingContent && (
            <motion.div
              className="flex items-end gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center text-lg">
                😸
              </div>
              <div className="bg-white shadow-cute rounded-2xl rounded-bl-sm">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题 */}
      {messages.length <= 2 && !isTyping && (
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500 mb-2">快捷问题：</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.slice(0, 4).map((question) => (
              <button
                key={question}
                onClick={() => handleQuickQuestion(question)}
                className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
          disabled={isTyping}
        />
        <motion.button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  )
}
