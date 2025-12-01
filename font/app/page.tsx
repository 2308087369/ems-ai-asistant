"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { SiteCard } from "@/components/site-card"
import { SummaryPanel } from "@/components/summary-panel"
import { PowerChart } from "@/components/power-chart"
import { AIAssistant } from "@/components/ai-assistant"
import { type SiteData, generateSiteData, formatSitesDataForAI, calculateSummary } from "@/lib/energy-data"
import { Activity, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EnergyDashboard() {
  const router = useRouter()
  const [sites, setSites] = useState<SiteData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [initialVoiceMode, setInitialVoiceMode] = useState(false)
  
  // 语音唤醒相关
  const wakeWordRecognitionRef = useRef<any | null>(null)
  const isAIOpenRef = useRef(isAIOpen)

  useEffect(() => {
    isAIOpenRef.current = isAIOpen
    // 如果AI助手打开了，停止唤醒词监听，避免干扰
    if (isAIOpen) {
      stopWakeWordListening()
    } else {
      startWakeWordListening()
    }
  }, [isAIOpen])

  const startWakeWordListening = () => {
    if (typeof window !== "undefined") {
       const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
       if (SpeechRecognitionCtor && !wakeWordRecognitionRef.current) {
         const recognition = new SpeechRecognitionCtor()
         recognition.continuous = true
         recognition.interimResults = false
         recognition.lang = "zh-CN"
         
         recognition.onresult = (event: any) => {
           const lastResult = event.results[event.results.length - 1]
           if (lastResult.isFinal) {
              const transcript = lastResult[0].transcript.trim()
              console.log("Wake word listener heard:", transcript)
              // 移除标点符号以便匹配
              const cleanTranscript = transcript.replace(/[，,。.]/g, "")
              const WAKE_WORDS = [
                "你好小鑫", "你好小心", "你好小新", "你好小星", "你好小行", "你好小兴", "你好小信", "你好小芯",
                "小鑫你好", "小心你好", "小新你好", 
                "小鑫小鑫", "小心小心", "小新小新",
              ]
              if (WAKE_WORDS.some(w => cleanTranscript.includes(w) || transcript.includes(w))) {
                if (!isAIOpenRef.current) {
                  setIsAIOpen(true)
                  setInitialVoiceMode(true)
                }
              }
            }
         }
         
         recognition.onend = () => {
           // 如果AI没开，就重启监听
           if (!isAIOpenRef.current) {
             try {
               recognition.start()
             } catch {}
           }
         }
         
         recognition.onerror = (e: any) => {
           console.log("Wake word error", e)
         }
         
         wakeWordRecognitionRef.current = recognition
         try {
           recognition.start()
         } catch {}
       } else if (wakeWordRecognitionRef.current) {
         try {
           wakeWordRecognitionRef.current.start()
         } catch {}
       }
    }
  }

  const stopWakeWordListening = () => {
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop()
      } catch {}
    }
  }

  useEffect(() => {
    // Check auth
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn !== "true") {
      router.push("/login")
    } else {
      setIsAuthorized(true)
    }

    // 初始化数据
    setSites(generateSiteData())
    setLastUpdate(new Date().toLocaleTimeString("zh-CN"))

    // 每5秒更新数据模拟实时变化
    const interval = setInterval(() => {
      setSites(generateSiteData())
      setLastUpdate(new Date().toLocaleTimeString("zh-CN"))
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    router.push("/login")
  }

  const summary = calculateSummary(sites)
  const siteDataForAI = formatSitesDataForAI(sites)

  if (!isAuthorized) {
    return null // Prevent flashing
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* 头部 */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">能源管理系统</h1>
                <p className="text-xs text-zinc-500">Energy Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-zinc-500">实时监控中</span>
              </div>
              <div className="text-xs text-zinc-500 font-mono">更新于 {lastUpdate}</div>
              <div className="h-4 w-[1px] bg-zinc-800 mx-2"></div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={handleLogout}
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 汇总面板 */}
        <SummaryPanel data={summary} />

        {/* 功率趋势图 */}
        <PowerChart />

        {/* 站点卡片网格 */}
        <div>
          <h2 className="text-sm text-zinc-400 mb-4">站点监控</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => (
              <SiteCard key={site.name} site={site} />
            ))}
          </div>
        </div>
      </main>

      {/* AI 助手 */}
      <AIAssistant
        siteData={siteDataForAI}
        lastUpdate={lastUpdate}
        isOpen={isAIOpen}
        onOpenChange={(open) => {
           setIsAIOpen(open)
           if (!open) {
             setInitialVoiceMode(false)
           }
        }}
        initialVoiceMode={initialVoiceMode}
        onOpenRefresh={() => {
          setSites(generateSiteData())
          setLastUpdate(new Date().toLocaleTimeString("zh-CN"))
        }}
      />
    </div>
  )
}
