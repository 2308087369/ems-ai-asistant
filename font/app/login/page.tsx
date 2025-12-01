"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Zap, Lock, User, ArrowRight, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if already logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn === "true") {
      router.push("/")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("isLoggedIn", "true")
      router.push("/")
    } else {
      setError("账号或密码错误")
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-zinc-800/30 rounded-full blur-[80px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Login Card */}
      <div className="w-full max-w-md z-10 p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden group">
          {/* Top Highlight */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner mb-4 group-hover:border-emerald-500/50 transition-colors duration-500">
              <Zap className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">EMS 能源管理系统</h1>
            <p className="text-zinc-400 text-sm mt-2">Intelligent Energy Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative group/input">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/input:text-emerald-400 transition-colors" />
                <Input
                  type="text"
                  placeholder="账号"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-100 focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-zinc-600 h-11 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/input:text-emerald-400 transition-colors" />
                <Input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-100 focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-zinc-600 h-11 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs text-center bg-red-500/10 py-2 rounded-md border border-red-500/20 animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-11 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 mt-2 group/btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  登录系统
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">
              Powered by <span className="text-emerald-500/80 font-medium">AI Core Engine</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
