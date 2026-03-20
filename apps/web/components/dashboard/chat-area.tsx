"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { motion } from "framer-motion"
import { Button } from "@clearity/ui"
import { Input } from "@clearity/ui"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@clearity/ui"
import {
  Send,
  CheckCircle2,
  Menu,
  Sparkles,
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
  const [headerKeyword, setHeaderKeyword] = useState<string | null>(keyword ?? null)
  const [subKeywords, setSubKeywords] = useState<string[]>([])
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

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || sessionStatus === "completed" || noApiKey) return

    const messageText = inputValue
    sendMessage({ text: messageText })
    setInputValue("")

    // Extract keywords from first message via Gemini
    if (!headerKeyword && messages.length === 0) {
      try {
        const res = await fetch("/api/extract-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText, apiKey }),
        })
        if (res.ok) {
          const data = await res.json()
          setHeaderKeyword(data.main)
          setSubKeywords(data.subs ?? [])

          // Update session title in DB
          const supabase = (await import("@clearity/lib")).createClient()
          await supabase
            .from("chat_sessions")
            .update({ title: data.sessionTitle })
            .eq("id", sessionId)

          // Save keywords to DB
          const keywordsToInsert = [
            { session_id: sessionId, label: data.main, intensity: "high" as const },
            ...(data.subs ?? []).map((sub: string) => ({
              session_id: sessionId,
              label: sub,
              intensity: "medium" as const,
            })),
          ]
          await supabase.from("session_keywords").insert(keywordsToInsert)
        }
      } catch {
        // Fallback: use simple extraction
        const words = messageText.trim().split(/\s+/)
        const extracted = words.filter(w => w.length > 3).sort((a, b) => b.length - a.length)[0] ?? words[0]
        setHeaderKeyword(extracted)
      }
    }
  }

  const handleFinish = async () => {
    await onFinishSession()
  }

  return (
    <div className="glass flex h-full flex-col">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/15 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="glass-interactive lg:hidden !rounded-2xl !border-transparent !bg-transparent text-zinc-700 dark:text-zinc-300">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-5 bg-transparent border-none" />
          </Sheet>

          {/* Dynamic keyword header */}
          {headerKeyword ? (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Focusing on</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{headerKeyword}</p>
                {subKeywords.length > 0 && (
                  <div className="flex gap-1">
                    {subKeywords.map((sub, i) => (
                      <motion.span
                        key={sub}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 + i * 0.15 }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400"
                      >
                        {sub}
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">New conversation</p>
          )}
        </div>

        {/* Clarify button — appears with keyword */}
        {headerKeyword && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            <Button
              onClick={handleFinish}
              disabled={sessionStatus === "completed"}
              variant="outline"
              size="sm"
              className="glass-subtle gap-2 !rounded-xl text-zinc-600 dark:text-zinc-300 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Clarify
            </Button>
          </motion.div>
        )}
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
          <div className="flex flex-col pt-12 pb-6 px-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative glass-subtle !rounded-3xl px-5 py-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 w-fit border-l-2 border-l-zinc-300/40 dark:border-l-zinc-600/40"
            >
              <Sparkles className="absolute -top-3.5 -left-3.5 h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              {keyword ? (
                <>
                  I see you&apos;re focusing on &apos;
                  <span className="font-semibold">
                    {keyword}
                  </span>
                  &apos;. Want to dig deeper, or is there something specific about it that&apos;s been stuck?
                </>
              ) : (
                "What's been on your mind lately? No need to organize it — just start wherever feels right."
              )}
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative glass-subtle !rounded-3xl px-5 py-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 max-w-[70%] w-fit",
                    message.role === "user"
                      ? "!bg-white/20 dark:!bg-white/8"
                      : "border-l-2 border-l-zinc-300/40 dark:border-l-zinc-600/40",
                  )}
                >
                  {message.role === "assistant" && (
                    <Sparkles className="absolute -top-3.5 -left-3.5 h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                  )}
                  {message.parts.map((part, i) => {
                    if (part.type === "text") return <span key={i}>{part.text}</span>
                    return null
                  })}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="glass-subtle !rounded-3xl px-5 py-3.5 border-l-2 border-l-zinc-300/40 dark:border-l-zinc-600/40">
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
