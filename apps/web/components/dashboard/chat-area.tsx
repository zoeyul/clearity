"use client"

import { useState, useRef, useEffect } from "react"
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
import type { Message } from "@clearity/lib"

interface ChatAreaProps {
  messages: Message[]
  sessionStatus: "active" | "completed"
  onSendMessage: (content: string) => Promise<Message | null | undefined>
  onFinishSession: () => Promise<unknown>
  isLoading: boolean
}

export function ChatArea({
  messages,
  sessionStatus,
  onSendMessage,
  onFinishSession,
  isLoading,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || sessionStatus === "completed") return
    setIsSending(true)
    const content = inputValue
    setInputValue("")
    await onSendMessage(content)
    setIsSending(false)
  }

  const handleFinish = async () => {
    await onFinishSession()
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
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
            <SheetContent side="left" className="w-[280px] p-5 bg-transparent border-none">
              {/* Mobile sidebar handled by parent */}
            </SheetContent>
          </Sheet>

          <div className="glass-solid flex h-10 w-10 items-center justify-center !rounded-2xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Clara</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Analytical & Empathetic
            </p>
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
            <SheetContent side="right" className="w-[320px] p-5 bg-transparent border-none">
              {/* Mobile analysis panel handled by parent */}
            </SheetContent>
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
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400">Start a conversation...</p>
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
                <Avatar
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-2xl",
                    message.role === "assistant" && "shadow-[0_4px_16px_rgba(31,38,135,0.1)]"
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      "rounded-2xl",
                      message.role === "assistant"
                        ? "glass-solid !rounded-2xl"
                        : "glass-subtle !rounded-2xl text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "flex max-w-[70%] flex-col gap-1",
                    message.role === "user" && "items-end"
                  )}
                >
                  <div
                    className={cn(
                      "glass-subtle !rounded-3xl px-5 py-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200",
                      message.role === "user" && "!bg-white/20 dark:!bg-white/8"
                    )}
                  >
                    {message.content}
                  </div>
                  <span className="px-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-white/15 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="glass-subtle relative flex-1 !rounded-2xl overflow-hidden">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={sessionStatus === "completed" ? "Session ended" : "Share what's on your mind..."}
                disabled={sessionStatus === "completed"}
                className="h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={isSending || sessionStatus === "completed"}
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
