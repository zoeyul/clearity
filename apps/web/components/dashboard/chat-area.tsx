"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { motion } from "framer-motion"
import { Button } from "@clearity/ui"
import { Input } from "@clearity/ui"
import { Avatar, AvatarFallback } from "@clearity/ui"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@clearity/ui"
import {
  Send,
  Sparkles,
  CheckCircle2,
  User,
  Menu,
  BarChart3,
} from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"

interface ChatAreaProps {
  sessionId: string
  sessionStatus: "active" | "completed"
  onFinishSession: () => Promise<unknown>
  isLoading: boolean
  keyword?: string
}

export function ChatArea({
  sessionId,
  sessionStatus,
  onFinishSession,
  isLoading,
  keyword,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const apiKey = typeof window !== "undefined" ? localStorage.getItem("clearity-api-key") : null
  const aboutMe = typeof window !== "undefined" ? localStorage.getItem("clearity-about-me") : null
  const noApiKey = !apiKey

  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { apiKey, aboutMe },
    }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, status])

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming || sessionStatus === "completed" || noApiKey) return
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  const handleFinish = async () => {
    await onFinishSession()
  }

  return (
    <div className="glass flex h-full flex-col">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/15 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="glass-interactive lg:hidden !rounded-2xl !border-transparent !bg-transparent text-zinc-700 dark:text-zinc-300">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-5 bg-transparent border-none" />
          </Sheet>

          <div className="glass-solid flex h-10 w-10 items-center justify-center !rounded-2xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Clara</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Analytical & Empathetic</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="glass-interactive xl:hidden !rounded-2xl !border-transparent !bg-transparent text-zinc-700 dark:text-zinc-300">
                <BarChart3 className="h-5 w-5" />
                <span className="sr-only">Open insights</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-5 bg-transparent border-none" />
          </Sheet>

          <Button
            onClick={handleFinish}
            disabled={sessionStatus === "completed"}
            className="glass-solid gap-2 !rounded-2xl px-5 py-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Clarify
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400">Loading messages...</p>
          </div>
        ) : noApiKey ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-zinc-500 mb-2">No API key configured</p>
              <p className="text-xs text-zinc-400">Go to Settings in the sidebar to add your Gemini API key</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col py-6 px-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex gap-3"
            >
              <Avatar className="h-9 w-9 shrink-0 rounded-2xl shadow-[0_4px_16px_rgba(31,38,135,0.1)]">
                <AvatarFallback className="glass-solid !rounded-2xl">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex max-w-[70%] flex-col gap-1">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="glass-subtle !rounded-3xl px-5 py-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                >
                  {keyword ? (
                    <>
                      I see you&apos;re focusing on &apos;
                      <span className="font-semibold text-sky-600 dark:text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]">
                        {keyword}
                      </span>
                      &apos;. Want to dig deeper, or is there something specific about it that&apos;s been stuck?
                    </>
                  ) : (
                    "What's been on your mind lately? No need to organize it — just start wherever feels right."
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <Avatar className={cn("h-9 w-9 shrink-0 rounded-2xl", message.role === "assistant" && "shadow-[0_4px_16px_rgba(31,38,135,0.1)]")}>
                  <AvatarFallback className={cn("rounded-2xl", message.role === "assistant" ? "glass-solid !rounded-2xl" : "glass-subtle !rounded-2xl text-zinc-700 dark:text-zinc-300")}>
                    {message.role === "assistant" ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex max-w-[70%] flex-col gap-1", message.role === "user" && "items-end")}>
                  <div className={cn(
                    "glass-subtle !rounded-3xl px-5 py-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200",
                    message.role === "user" && "!bg-white/20 dark:!bg-white/8"
                  )}>
                    {message.parts.map((part, i) => {
                      if (part.type === "text") return <span key={i}>{part.text}</span>
                      return null
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <Avatar className="h-9 w-9 shrink-0 rounded-2xl">
                  <AvatarFallback className="glass-solid !rounded-2xl">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </AvatarFallback>
                </Avatar>
                <div className="glass-subtle !rounded-3xl px-5 py-3.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="relative z-10 border-t border-white/15 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="glass-subtle relative flex-1 !rounded-2xl overflow-hidden">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={sessionStatus === "completed" ? "Session ended" : noApiKey ? "Add API key in Settings first" : "Share what's on your mind..."}
                disabled={sessionStatus === "completed" || noApiKey}
                className="h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={isStreaming || sessionStatus === "completed" || noApiKey}
              size="lg"
              className="glass-subtle h-12 px-5 !rounded-2xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Your conversations are private and secure
          </p>
        </div>
      </div>
    </div>
  )
}
