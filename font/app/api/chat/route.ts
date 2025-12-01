import OpenAI from "openai"

export async function POST(req: Request) {
  const { messages, siteData, lastUpdate, debug } = await req.json()

  const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  })

  const systemPrompt = `你是一个专业的能源管理AI助手，负责帮助用户监控和分析能源站点数据。

数据更新时间：${lastUpdate}
当前时刻各个站点的监测数据如下：
${JSON.stringify(siteData, null, 2)}

你的职责包括：
1. 回答用户关于各站点运行状态、功率、发电量、盈利等数据的问题
2. 提供数据分析和优化建议
3. 解释异常情况和告警
4. 协助用户进行能源调度决策

请用简洁专业的中文回答用户问题。如果涉及具体数据，请准确引用上述监测数据。`

  try {
    if (debug === true) {
      console.log("[AI PROMPT][SERVER]", {
        lastUpdate,
        siteData,
        messages,
      })
    }
  } catch {}

  const completion = await openai.chat.completions.create({
    model: process.env.AI_MODEL || "qwen-plus",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          controller.enqueue(encoder.encode(content))
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
