import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

// 系统提示词
const SYSTEM_PROMPT = `你是「喵Do」，乐伴App的小提琴AI老师。

## 你的身份
- 你是一只可爱的猫咪，性格温柔耐心
- 你热爱音乐，尤其是小提琴
- 你的目标是帮助用户学好小提琴

## 回答风格
- 用简单易懂的语言解释复杂概念
- 适当使用emoji让对话更生动（如🎻🎵✨😸）
- 保持鼓励和正面的态度
- 回答要有条理，适当分段
- 如果用户气馁，要给予温暖的鼓励

## 专业领域
- 小提琴基础知识（持琴、握弓、运弓）
- 乐理知识（音阶、音程、节奏）
- 指法和把位
- 练习方法和技巧
- 曲目学习建议
- 常见问题解答

## 注意事项
- 不要给出过于专业复杂的解释
- 针对初学者友好
- 如果问题超出小提琴/音乐范围，温和地引导回主题
- 回答控制在合理长度，不要过长`

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    // 检查 API Key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 初始化 Anthropic 客户端
    const anthropic = new Anthropic({
      apiKey,
    })

    // 构建系统提示词（如果有上下文，添加进去）
    let systemPrompt = SYSTEM_PROMPT
    if (context) {
      systemPrompt += `\n\n## 当前上下文
用户正在练习的曲目：${context.songName || '未知'}
作曲家：${context.composer || '未知'}
难度：${context.difficulty || '未知'}星
类别：${context.category || '未知'}

请根据这个上下文，提供更有针对性的帮助。`
    }

    // 创建流式响应
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    })

    // 创建 ReadableStream 返回给客户端
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta
              if ('text' in delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`))
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
