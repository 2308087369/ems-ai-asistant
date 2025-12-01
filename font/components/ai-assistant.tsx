"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, X, Send, Mic, MicOff, Loader2 } from "lucide-react"
import type { AllSitesData } from "@/lib/energy-data"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AIAssistantProps {
  siteData: AllSitesData
  lastUpdate: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialVoiceMode?: boolean
  onOpenRefresh?: () => void
}

export function AIAssistant({ siteData, lastUpdate, isOpen, onOpenChange, initialVoiceMode = false, onOpenRefresh }: AIAssistantProps) {
  // const [isOpen, setIsOpen] = useState(false) // Moved to props
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false) // 用户是否开启了语音交互模式
  const [isSpeaking, setIsSpeaking] = useState(false) // AI是否正在播报
  const [transcript, setTranscript] = useState("")
  const [voiceError, setVoiceError] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const pendingMessageRef = useRef<string | null>(null)
  const lastTranscriptRef = useRef<string>("")
  const recognitionRef = useRef<any | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dataReady = !!lastUpdate && siteData && Object.keys(siteData).length > 0
  const initialVoiceModeProcessedRef = useRef(false)

  // Refs for accessing latest state in event handlers
  const dataReadyRef = useRef(dataReady)
  const isLoadingRef = useRef(isLoading)
  const isListeningRef = useRef(isListening)
  const isVoiceModeRef = useRef(isVoiceMode)
  const isSpeakingRef = useRef(isSpeaking)
  const handleSendMessageRef = useRef<any>(null)
  const onOpenChangeRef = useRef(onOpenChange)

  // Tips state
  const [showWakeTip, setShowWakeTip] = useState(true)
  const [showExitTip, setShowExitTip] = useState(true)

  useEffect(() => {
    if (showWakeTip) {
      const timer = setTimeout(() => setShowWakeTip(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showWakeTip])

  useEffect(() => {
    if (isOpen && showExitTip) {
      const timer = setTimeout(() => setShowExitTip(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, showExitTip])

  useEffect(() => { dataReadyRef.current = dataReady }, [dataReady])
  useEffect(() => { isLoadingRef.current = isLoading }, [isLoading])
  useEffect(() => { isListeningRef.current = isListening }, [isListening])
  useEffect(() => { isVoiceModeRef.current = isVoiceMode }, [isVoiceMode])
  useEffect(() => { isSpeakingRef.current = isSpeaking }, [isSpeaking])
  useEffect(() => { onOpenChangeRef.current = onOpenChange }, [onOpenChange])

  // Handle initial voice mode when opened
  useEffect(() => {
    if (isOpen) {
      if (initialVoiceMode && !initialVoiceModeProcessedRef.current) {
        setIsVoiceMode(true)
        // Delay slightly to ensure DOM is ready or transitions are done
        setTimeout(() => {
           startListening()
        }, 500)
        initialVoiceModeProcessedRef.current = true
      }
    } else {
      // Reset when closed
      initialVoiceModeProcessedRef.current = false
      stopListening()
      stopSpeaking()
      setIsVoiceMode(false)
    }
  }, [isOpen, initialVoiceMode])

  // 语音播报函数
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    
    // 移除markdown符号以便朗读
    const cleanText = text.replace(/[#*`]/g, '')
    
    if ('speechSynthesis' in window) {
      // 停止之前的播报
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'zh-CN'
      utterance.rate = 1.2 // 稍微加快语速
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        // 播报时不要停止听写，而是保持听写以便随时打断
        // stopListening() 
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        // 如果在语音模式下，播报结束后确保继续听写
        if (isVoiceModeRef.current) {
          startListening()
        }
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        if (isVoiceModeRef.current) {
          startListening()
        }
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "zh-CN"

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          const currentTranscript = finalTranscript || interimTranscript
          setTranscript(currentTranscript)
          lastTranscriptRef.current = currentTranscript

          // 重置静默计时器
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }

          // 任何结果后设置静默检测（支持仅有临时结果的场景）
          silenceTimerRef.current = setTimeout(() => {
            const text = (lastTranscriptRef.current || "").trim()
            if (!text) return
            
            // 移除标点符号以便匹配
            const cleanText = text.replace(/[，,。.]/g, "")
            
            const END_WORDS = [
              "再见小鑫", "再见小心", "再见小新", "再见小星",
              "小鑫再见", "小心再见", "小新再见",
              "退出对话", "结束对话", "停止对话", "关闭对话",
              "停止语音", "关闭语音",
              "byebye小鑫","byebye小心","byebye小新", "byebye小星",
            ]
            const shouldEnd = END_WORDS.some((w) => cleanText.includes(w) || text.includes(w))
            
            // 如果正在加载或正在说话，不发送消息，但如果是语音模式，不要把消息暂存，直接丢弃
            // 只有非语音模式下才考虑暂存，或者简单点，只要忙碌就丢弃语音输入的自动发送，避免插嘴
            if (isLoadingRef.current || isSpeakingRef.current) {
              // 关键修改：如果是退出指令，即使在说话/加载中也要执行
              if (shouldEnd) {
                 console.log("Interrupted speech/loading with exit command:", text)
                 // 继续向下执行，让shouldEnd逻辑处理
              } else {
                 console.log("Ignored speech input during loading/speaking:", text)
                 // pendingMessageRef.current = text // Remove pending message logic for voice to avoid delayed send
                 return // 直接返回，忽略此次输入
              }
            } else if (!dataReadyRef.current) {
               pendingMessageRef.current = text
            } else {
              if (handleSendMessageRef.current) {
                // 如果是退出指令，就不发给AI了，直接处理退出
                if (shouldEnd) {
                  // do nothing, just stop below
                } else {
                  handleSendMessageRef.current(text)
                }
                setTranscript("")
                lastTranscriptRef.current = ""
              }
            }
            
            if (shouldEnd) {
              stopListening()
              setIsVoiceMode(false)
              stopSpeaking()
              if (onOpenChangeRef.current) {
                onOpenChangeRef.current(false)
              }
            }
          }, 1500)
        }

        recognition.onerror = (event: any) => {
          const err = (event as any).error
          console.error("Speech recognition error:", err)
          if (err === "aborted") {
            return
          }
          if (err === "network" || err === "no-speech") {
            setVoiceError("语音服务网络异常，正在重试…")
            if (isListeningRef.current) {
              try {
                recognition.stop()
              } catch {}
              setTimeout(() => {
                try {
                  recognition.start()
                  setVoiceError("")
                } catch {}
              }, 800)
            }
            return
          }
          if (err === "not-allowed") {
            setVoiceError("请允许麦克风权限以使用语音识别")
          } else if (err === "audio-capture") {
            setVoiceError("未检测到麦克风设备或被占用")
          } else {
            setVoiceError("语音识别不可用或浏览器扩展干扰，请稍后重试")
          }
          setIsListening(false)
          isListeningRef.current = false
        }

        recognition.onend = () => {
          if (isListeningRef.current) {
            setTimeout(() => {
              try {
                recognition.start()
              } catch (e) {
                setIsListening(false)
                isListeningRef.current = false
              }
            }, 200)
          } else {
            const text = (lastTranscriptRef.current || transcript).trim()
            if (!text) return
            
            if (isLoadingRef.current || isSpeakingRef.current) {
               console.log("Ignored speech input (onEnd) during loading/speaking:", text)
            } else if (!dataReadyRef.current) {
              pendingMessageRef.current = text
            } else {
              if (handleSendMessageRef.current) {
                handleSendMessageRef.current(text)
                setTranscript("")
                lastTranscriptRef.current = ""
              }
            }
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        isListeningRef.current = true
        setTranscript("")
        setVoiceError("")
        pendingMessageRef.current = null
      } catch (e) {
        console.error("Failed to start recognition:", e)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      isListeningRef.current = false
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }

  const toggleListening = () => {
    if (isListening || isVoiceMode) {
      stopListening()
      setIsVoiceMode(false)
      stopSpeaking()
    } else {
      startListening()
      setIsVoiceMode(true)
    }
  }

  const handleSendMessage = useCallback(
    async (messageContent: string) => {
      if (!messageContent.trim()) return
      if (isLoading) {
        pendingMessageRef.current = messageContent.trim()
        return
      }
      if (!dataReady) {
        pendingMessageRef.current = messageContent.trim()
        return
      }

      const userMessage: Message = { role: "user", content: messageContent }
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const debugPromptFlag =
          typeof window !== "undefined" &&
          (
            process.env.NEXT_PUBLIC_AI_DEBUG_PROMPT === "true" ||
            localStorage.getItem("AI_DEBUG_PROMPT") === "true" ||
            new URLSearchParams(window.location.search).get("aiDebug") === "1" ||
            (window as any).__AI_DEBUG_PROMPT__ === true
          )
        if (debugPromptFlag) {
          const outMessages = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))
          console.log("[AI PROMPT]", { lastUpdate, siteData, messages: outMessages })
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            siteData,
            lastUpdate,
            debug: debugPromptFlag === true,
          }),
        })

        if (!response.ok) throw new Error("Failed to fetch")

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        let assistantMessage = ""
        setMessages((prev) => [...prev, { role: "assistant", content: "" }])

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: assistantMessage,
            }
            return newMessages
          })
        }
        
        // 如果开启了语音模式，则播报回复
        if (isVoiceModeRef.current) {
          speak(assistantMessage)
        }
      } catch (error) {
        console.error("Chat error:", error)
        setMessages((prev) => [...prev, { role: "assistant", content: "抱歉，发生了错误，请稍后再试。" }])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, siteData, isLoading],
  )

  // Update ref for handleSendMessage
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  }, [handleSendMessage])


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoading) {
      handleSendMessage(input)
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el && autoScroll) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" })
    }
  }, [messages, isLoading, autoScroll])

  useEffect(() => {
    if (dataReady && pendingMessageRef.current && !isLoading) {
      const msg = pendingMessageRef.current
      pendingMessageRef.current = null
      handleSendMessage(msg)
    }
  }, [dataReady, isLoading])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollTop >= el.scrollHeight - el.clientHeight - 8
      setAutoScroll(nearBottom)
    }
    el.addEventListener("scroll", onScroll)
    return () => {
      el.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <>
      {/* 悬浮按钮 */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
        {/* 唤醒提示 */}
        {!isOpen && showWakeTip && (
          <div 
            className="bg-emerald-500/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-right-4 cursor-pointer backdrop-blur-sm"
            onClick={() => setShowWakeTip(false)}
          >
            尝试一下“你好小鑫”呼唤小鑫助手
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500/90 rotate-45 translate-x-[-4px]"></div>
          </div>
        )}
        
        <button
          onClick={() => {
            const next = !isOpen
            onOpenChange(next)
            if (next && onOpenRefresh) onOpenRefresh()
          }}
          className={`w-14 h-14 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all rounded-full ${
            isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
          aria-label="打开AI助手"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>

      {/* 助手面板 */}
      <div
        className={`fixed bottom-6 right-6 w-[400px] h-[600px] z-50 transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* 退出提示 */}
        {isOpen && showExitTip && (
          <div 
            className="absolute -top-10 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2"
            onClick={() => setShowExitTip(false)}
          >
            <div className="bg-zinc-800/90 text-zinc-300 text-xs px-3 py-1.5 rounded-full shadow-lg cursor-pointer backdrop-blur-sm border border-zinc-700/50">
              尝试“再见小鑫”退出AI交互
            </div>
          </div>
        )}

        <Card className="h-full flex flex-col bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-zinc-800 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2 text-zinc-100">
              <Bot className="w-5 h-5 text-emerald-400" />
              能源AI助手
              <span className="ml-2 relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full ${dataReady ? "bg-emerald-400" : "bg-amber-400"} opacity-75 animate-ping`}></span>
                <span className={`relative inline-flex h-2 w-2 ${dataReady ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
            </CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
              >
                清空
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-zinc-500">
                  <div>
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">你好！我是能源管理AI助手</p>
                    <p className="text-xs mt-1">可以询问我关于站点运行状态、功率数据、盈利分析等问题</p>
                    <p className="text-xs mt-2 text-emerald-400">💡 点击麦克风按钮可使用语音输入</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] px-3 py-2 text-sm ${
                          msg.role === "user" ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-table:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      </div>
                    </div>
                  )}
                  <div className="h-16" />
                  <div ref={endRef} />
                </div>
              )}
            </ScrollArea>

            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800">
              {isListening && (transcript || voiceError) && (
                <div className="px-4 py-2">
                  <p className="text-xs text-zinc-400">正在识别：</p>
                  {transcript && <p className="text-sm text-emerald-400">{transcript}</p>}
                  {voiceError && <p className="text-xs text-red-400 mt-1">{voiceError}</p>}
                </div>
              )}
              {isSpeaking && (
                 <div className="px-4 py-2">
                   <p className="text-xs text-emerald-400 flex items-center gap-2">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     正在回复播报中...
                   </p>
                 </div>
              )}
              <form onSubmit={handleSubmit} className="p-4 flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant={isListening || isSpeaking ? "destructive" : "outline"}
                  size="icon"
                  className={`shrink-0 ${
                    isListening
                      ? "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                      : isSpeaking 
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 animate-pulse"
                        : "border-zinc-700 text-zinc-400 hover:text-zinc-100"
                  }`}
                  onClick={toggleListening}
                  disabled={!dataReady}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "正在聆听..." : isSpeaking ? "正在播报回复..." : "输入问题..."}
                  className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  disabled={isLoading || isListening || isSpeaking || !dataReady}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isLoading || !input.trim() || !dataReady || isSpeaking}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
