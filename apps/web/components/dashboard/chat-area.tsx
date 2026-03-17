"use client"

import { useState } from "react"
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
  Mic,
  Paperclip,
  Menu,
  BarChart3,
} from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"
import { LeftSidebar } from "./left-sidebar"
import { AnalysisPanel } from "./analysis-panel"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm Clara, your AI wellness companion. I'm here to provide a supportive space for you to explore your thoughts and feelings. What's on your mind today?",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    role: "user",
    content:
      "I've been feeling really overwhelmed at work lately. There's so much pressure to meet deadlines, and I feel like I can't keep up anymore.",
    timestamp: "10:32 AM",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "It sounds like you're carrying a heavy load right now. Feeling overwhelmed at work is incredibly common, especially when expectations feel unrealistic. Can you tell me more about what specifically is creating the most pressure? Is it the volume of work, the complexity of tasks, or perhaps something about the work environment itself?",
    timestamp: "10:33 AM",
  },
  {
    id: "4",
    role: "user",
    content:
      "I think it's mostly the volume. I have three major projects due this month, and each one requires my full attention. My manager keeps adding new tasks without considering my current workload.",
    timestamp: "10:35 AM",
  },
  {
    id: "5",
    role: "assistant",
    content:
      "That's a difficult position to be in. Having multiple high-priority projects competing for your attention can create a sense of fragmentation that's mentally exhausting. It also sounds like there might be a boundary issue with how work is being assigned to you. Have you had a conversation with your manager about your capacity, or does that feel difficult to do?",
    timestamp: "10:36 AM",
  },
  {
    id: "6",
    role: "user",
    content:
      "Honestly, I've been avoiding that conversation. I'm worried my manager will think I'm not capable or that I'm complaining. I just keep saying yes to everything and then stressing about it later.",
    timestamp: "10:38 AM",
  },
  {
    id: "7",
    role: "assistant",
    content:
      "That's a really common pattern — saying yes to avoid conflict, but then carrying the weight of overcommitment silently. It takes courage to set boundaries, and it doesn't mean you're incapable. In fact, being able to communicate your limits is a sign of self-awareness and professionalism. What would feel like a safe first step for you?",
    timestamp: "10:39 AM",
  },
  {
    id: "8",
    role: "user",
    content:
      "Maybe I could start by writing down everything on my plate and showing it to my manager? That way it's not about complaining, it's just facts.",
    timestamp: "10:41 AM",
  },
  {
    id: "9",
    role: "assistant",
    content:
      "That's an excellent approach. Making it objective and data-driven removes the emotional charge from the conversation. You could frame it as: 'I want to make sure I'm prioritizing the right things — here's what's currently on my plate. Can we align on what matters most?' This way, you're asking for guidance rather than pushing back. How does that framing feel to you?",
    timestamp: "10:42 AM",
  },
  {
    id: "10",
    role: "user",
    content:
      "That actually sounds really doable. I think I've been overthinking it. I also realize I haven't been sleeping well because of all this stress, which makes everything feel worse during the day.",
    timestamp: "10:44 AM",
  },
  {
    id: "11",
    role: "assistant",
    content:
      "Sleep and stress form a vicious cycle — stress disrupts sleep, and poor sleep makes you less resilient to stress. Breaking that cycle even slightly can make a big difference. Have you tried any wind-down routines before bed, or does your mind tend to race with work thoughts when you lie down?",
    timestamp: "10:45 AM",
  },
  {
    id: "12",
    role: "user",
    content:
      "My mind definitely races. I'll be lying in bed thinking about tomorrow's to-do list, replaying conversations from the day, worrying about things I might have missed. It can take me over an hour to fall asleep sometimes.",
    timestamp: "10:47 AM",
  },
]

export function ChatArea() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
    setMessages([...messages, newMessage])
    setInputValue("")
  }

  return (
    <div className="glass flex h-full flex-col">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/15 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="glass-interactive lg:hidden !rounded-2xl !border-transparent !bg-transparent text-zinc-700 dark:text-zinc-300">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-5 bg-transparent border-none">
              <LeftSidebar />
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
          {/* Mobile Insights Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="glass-interactive xl:hidden !rounded-2xl !border-transparent !bg-transparent text-zinc-700 dark:text-zinc-300">
                <BarChart3 className="h-5 w-5" />
                <span className="sr-only">Open insights</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-5 bg-transparent border-none">
              <AnalysisPanel />
            </SheetContent>
          </Sheet>

          <span className="glass-subtle hidden sm:flex items-center gap-1.5 !rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Session Active
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6">
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
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-white/15 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="glass-subtle relative flex-1 !rounded-2xl overflow-hidden">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Share what's on your mind..."
                className="pr-20 h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <Button variant="ghost" size="icon" className="glass-interactive h-8 w-8 !rounded-xl !border-transparent !bg-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="glass-interactive h-8 w-8 !rounded-xl !border-transparent !bg-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSend} size="lg" className="glass-solid h-12 px-5 !rounded-2xl border-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your conversations are private and secure
            </p>
            <Button
              variant="outline"
              size="sm"
              className="glass-interactive gap-2 !rounded-xl text-zinc-700 hover:text-zinc-800 dark:text-zinc-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finish & Summarize
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
