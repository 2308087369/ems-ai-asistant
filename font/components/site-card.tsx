"use client"

import type { SiteData } from "@/lib/energy-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, TrendingUp, Thermometer, Droplets } from "lucide-react"

interface SiteCardProps {
  site: SiteData
}

export function SiteCard({ site }: SiteCardProps) {
  const statusColors = {
    online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    offline: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  const statusLabels = {
    online: "在线",
    warning: "告警",
    offline: "离线",
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-zinc-100">{site.name}</CardTitle>
          <Badge variant="outline" className={statusColors[site.status]}>
            {statusLabels[site.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <Zap className="w-3 h-3" />
              <span>实时功率</span>
            </div>
            <p className="text-xl font-mono text-emerald-400">
              {site.currentPower.toLocaleString()}
              <span className="text-xs text-zinc-500 ml-1">kW</span>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>当日盈利</span>
            </div>
            <p className="text-xl font-mono text-amber-400">¥{site.profit.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-zinc-500">发电量</span>
              <p className="text-zinc-300 font-mono">{site.dailyEnergy}kWh</p>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-300 font-mono">{site.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-300 font-mono">{site.humidity}%</span>
            </div>
          </div>
        </div>

        <div className="relative h-1.5 bg-zinc-800 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-500 to-emerald-400"
            style={{ width: `${site.efficiency}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">运行效率</span>
          <span className="text-zinc-300 font-mono">{site.efficiency}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
