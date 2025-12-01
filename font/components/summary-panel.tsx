"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Zap, Battery, CircleDollarSign, Activity, Server } from "lucide-react"

interface SummaryPanelProps {
  data: {
    totalPower: number
    totalEnergy: number
    totalProfit: number
    avgEfficiency: number
    onlineCount: number
    totalCount: number
  }
}

export function SummaryPanel({ data }: SummaryPanelProps) {
  const metrics = [
    {
      label: "总功率",
      value: data.totalPower.toLocaleString(),
      unit: "kW",
      icon: Zap,
      color: "text-emerald-400",
    },
    {
      label: "日发电量",
      value: data.totalEnergy.toLocaleString(),
      unit: "kWh",
      icon: Battery,
      color: "text-cyan-400",
    },
    {
      label: "当日盈利",
      value: `¥${data.totalProfit.toLocaleString()}`,
      unit: "",
      icon: CircleDollarSign,
      color: "text-amber-400",
    },
    {
      label: "平均效率",
      value: data.avgEfficiency,
      unit: "%",
      icon: Activity,
      color: "text-purple-400",
    },
    {
      label: "在线站点",
      value: `${data.onlineCount}/${data.totalCount}`,
      unit: "",
      icon: Server,
      color: "text-zinc-300",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
              <metric.icon className="w-4 h-4" />
              <span>{metric.label}</span>
            </div>
            <p className={`text-2xl font-mono ${metric.color}`}>
              {metric.value}
              {metric.unit && <span className="text-sm text-zinc-500 ml-1">{metric.unit}</span>}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
