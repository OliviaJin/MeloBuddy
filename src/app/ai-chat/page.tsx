'use client'

import { useState, useRef, useEffect } from 'react'
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
  '这个指法怎么按？',
  '如何拉出好听的声音？',
  '每天练习多久合适？',
  '什么是揉弦？',
]

// 模拟AI回复（后续可替换为真实API）
const mockAIResponses: Record<string, string> = {
  '小提琴怎么调音？': `调音是小提琴学习的基础！🎻

**四根弦的标准音高（从粗到细）：**
- G弦：Sol（G3）
- D弦：Re（D4）
- A弦：La（A4 = 440Hz）
- E弦：Mi（E5）

**调音步骤：**
1. 先用调音器或钢琴找到标准A音
2. 调整A弦到440Hz
3. 以A弦为基准，调其他三根弦
4. 用五度关系检查：相邻两弦同时拉，听起来要和谐

小贴士：新手建议用电子调音器，更准确哦~`,

  'G弦在哪里？': `G弦是小提琴最粗的那根弦！🎵

**位置：**
- 持琴时，G弦在最左边（最靠近你的脸）
- 从左到右依次是：G → D → A → E

**特点：**
- 声音最低沉、浑厚
- 弦最粗，振动最慢
- 音色温暖，适合表达深情的旋律

记住口诀：**"哥（G）弟（D）爱（A）饿（E）"**，从粗到细！`,

  '这个指法怎么按？': `指法是小提琴的核心技能！✋

**基本指法（第一把位）：**
- 0 = 空弦（不按）
- 1 = 食指
- 2 = 中指
- 3 = 无名指
- 4 = 小指

**按弦要点：**
1. 指尖垂直按弦，不要用指肚
2. 手指要弯曲成拱形
3. 拇指放松，轻贴琴颈
4. 每个手指有固定的"家"

**练习建议：**
先在A弦上练习1-2-3指，熟练后再换其他弦~`,

  '如何拉出好听的声音？': `好声音的秘诀在于运弓！🎶

**三个关键要素：**

1. **弓速** - 弓走得快慢
   - 快弓：明亮、有活力
   - 慢弓：深沉、抒情

2. **弓压** - 弓对弦的压力
   - 太轻：声音虚、飘
   - 太重：声音噪、刺耳
   - 刚好：饱满、圆润

3. **触弦点** - 弓在弦上的位置
   - 靠近琴桥：声音亮
   - 靠近指板：声音柔

**每日练习：**
用全弓拉长音，保持声音平稳不抖~`,

  '每天练习多久合适？': `练习时间因人而异，但质量比时长更重要！⏰

**建议时长：**
- 初学者：每天 15-30 分钟
- 进阶者：每天 45-60 分钟
- 专业方向：每天 2-4 小时

**高效练习法：**
1. 分段练习，每段10-15分钟
2. 中间休息，放松手腕
3. 先慢后快，先分后合
4. 专注难点，不要一遍遍从头拉

**记住：**
每天坚持练15分钟，比周末突击练3小时效果好！
在乐伴App保持连胜，养成习惯最重要~🔥`,

  '什么是揉弦？': `揉弦（Vibrato）是让音色更美的技巧！✨

**原理：**
手指在弦上微微摇动，让音高产生细微波动，声音听起来更有感情、更温暖。

**类型：**
1. **手腕揉弦** - 初学者常用，手腕带动手指
2. **手臂揉弦** - 声音更宽广，适合慢歌
3. **手指揉弦** - 最精细，适合快速乐句

**学习时机：**
建议先把音准和运弓练好（约学琴半年后），再开始学揉弦。

**练习方法：**
1. 先不拿弓，左手单独练摇动
2. 从慢速开始，用节拍器
3. 每个手指都要练到

揉弦是进阶技能，不用急，慢慢来~`,
}

// 默认回复
const defaultResponse = `这是个好问题！🤔

作为你的小提琴学习伙伴，我可以帮你解答：
- 乐理知识
- 指法技巧
- 练习方法
- 小提琴保养

你可以试试问我上面的快捷问题，或者直接输入你的疑问~

加油练琴！我相信你会越来越棒的！🎻✨`

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

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是喵Do，你的小提琴学习伙伴！🎻\n\n有什么想问的吗？可以点击下面的快捷问题，或者直接输入你的疑问~',
      timestamp: Date.now(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    // 显示打字动画
    setIsTyping(true)

    // 模拟AI思考时间
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    // 获取AI回复
    const aiResponse = mockAIResponses[content.trim()] || defaultResponse

    // 添加AI消息
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, aiMessage])
    setIsTyping(false)
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
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

        {/* 打字动画 */}
        <AnimatePresence>
          {isTyping && (
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
      {messages.length <= 2 && (
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
