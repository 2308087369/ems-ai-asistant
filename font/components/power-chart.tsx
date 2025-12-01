"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface DataPoint {
  time: string
  power: number
}

export function PowerChart() {
  const [data, setData] = useState<DataPoint[]>([])

  useEffect(() => {
    // 初始化历史数据
    const initialData: DataPoint[] = []
    for (let i = 59; i >= 0; i--) {
      const time = new Date(Date.now() - i * 1000)
      initialData.push({
        time: time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        power: 5000 + Math.random() * 1500,
      })
    }
    setData(initialData)

    // 每秒更新
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(1)]
        const time = new Date()
        newData.push({
          time: time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          power: 5000 + Math.random() * 1500,
        })
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-400">实时总功率趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] min-w-0 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="time"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}MW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "0",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(value: number) => [`${value.toFixed(0)} kW`, "功率"]}
              />
              <Line
                type="monotone"
                dataKey="power"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
