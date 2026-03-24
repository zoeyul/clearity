"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@clearity/ui"
import { createClient } from "@clearity/lib"
import {
  Send,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"
import { ClarifyModal } from "@/shared/ui/clarify-modal"
import { MobileSidebar } from "@/shared/ui/mobile-sidebar"

interface ChatAreaProps {
  sessionId: string
  sessionStatus: "active" | "completed"
  onFinishSession: () => Promise<unknown>
  isLoading: boolean
  keyword?: string
}

export function ChatArea(props: ChatAreaProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [aboutMe, setAboutMe] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ interests: string; patterns: string; threshold: string; assets: string } | null>(null)
  const [initialMessages, setInitialMessages] = useState<{ id: string; role: "user" | "assistant"; parts: { type: "text"; text: string }[] }[] | null>(null)
  const [loadedKeyword, setLoadedKeyword] = useState<{ main: string | null; subs: string[] }>({ main: null, subs: [] })
  const [isReady, setIsReady] = useState(false)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    setApiKey(localStorage.getItem("clearity-api-key"))
    setAboutMe(localStorage.getItem("clearity-about-me"))

    const loadData = async () => {
      const [messagesRes, profileRes, keywordsRes, sessionRes] = await Promise.all([
        supabaseRef.current
          .from("messages")
          .select("id, role, content")
          .eq("session_id", props.sessionId)
          .order("created_at", { ascending: true }),
        supabaseRef.current
          .from("user_profiles")
          .select("interests, patterns, threshold, assets")
          .single(),
        supabaseRef.current
          .from("session_keywords")
          .select("label, intensity")
          .eq("session_id", props.sessionId),
        supabaseRef.current
          .from("chat_sessions")
          .select("title")
          .eq("id", props.sessionId)
          .single(),
      ])

      setInitialMessages(
        (messagesRes.data ?? []).map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        }))
      )
      if (profileRes.data) {
        setUserProfile(profileRes.data as { interests: string; patterns: string; threshold: string; assets: string })
      }
      // Load keywords for this session (fallback to session title)
      const kws = keywordsRes.data ?? []
      const mainKw = kws.find(k => k.intensity === "high")
      const subKws = kws.filter(k => k.intensity !== "high").map(k => k.label)
      const sessionTitle = sessionRes.data?.title ?? null
      const mainLabel = mainKw?.label ?? (sessionTitle && sessionTitle !== "New conversation" ? sessionTitle : null)
      setLoadedKeyword({ main: mainLabel, subs: subKws })

      setIsReady(true)
    }
    loadData()
  }, [props.sessionId])

  if (!isReady || initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    )
  }

  return <ChatAreaInner {...props} apiKey={apiKey} aboutMe={aboutMe} userProfile={userProfile} initialMessages={initialMessages} loadedKeyword={loadedKeyword} />
}

type InitialMessage = { id: string; role: "user" | "assistant"; parts: { type: "text"; text: string }[] }

type ProfileData = { interests: string; patterns: string; threshold: string; assets: string }

function ChatAreaInner({
  sessionId,
  sessionStatus,
  onFinishSession,
  isLoading,
  keyword,
  apiKey,
  aboutMe,
  userProfile,
  initialMessages,
  loadedKeyword,
}: ChatAreaProps & { apiKey: string | null; aboutMe: string | null; userProfile: ProfileData | null; initialMessages: InitialMessage[]; loadedKeyword: { main: string | null; subs: string[] } }) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState("")
  const [headerKeyword, setHeaderKeyword] = useState<string | null>(loadedKeyword.main ?? keyword ?? null)
  const [subKeywords, setSubKeywords] = useState<string[]>(loadedKeyword.subs)
  const [showClarifyModal, setShowClarifyModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const lastSavedIdRef = useRef<string | null>(null)
  const noApiKey = !apiKey

  const dbMessageIdsRef = useRef(new Set(initialMessages.map(m => m.id)))

  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: sessionId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { apiKey, aboutMe, userProfile },
    }),
  })

  // Hydrate useChat with DB messages on mount, then scroll to bottom
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages as Parameters<typeof setMessages>[0])
      // Wait for React to render the messages before scrolling
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isStreaming = status === "streaming" || status === "submitted"

  // Show rate limit error
  useEffect(() => {
    if (error?.message?.includes("429") || error?.message?.includes("rate") || error?.message?.includes("quota")) {
      setErrorMessage("API rate limit reached. Please wait a moment and try again.")
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }, [error])

  // Greeting card is always shown separately — skip duplicate from initialMessages
  const displayMessages = messages.length > 0 && messages[0].role === "assistant"
    ? messages.slice(1)
    : messages

  // Save assistant response to DB when streaming completes
  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== "assistant") return
    if (lastMsg.id === lastSavedIdRef.current) return
    if (dbMessageIdsRef.current.has(lastMsg.id)) return

    const content = lastMsg.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join("") ?? ""
    if (!content) return

    const save = async () => {
      const { error } = await supabase
        .from("messages")
        .insert({ session_id: sessionId, role: "assistant", content })
      console.log("[saveAssistant]", { content: content.slice(0, 50), error })
      if (!error) lastSavedIdRef.current = lastMsg.id
    }
    save()
  }, [status, messages.length, sessionId, supabase])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, status])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || sessionStatus === "completed" || noApiKey) return

    const messageText = inputValue
    const isFirstMessage = messages.length === 0

    // Save greeting + first user message, or just user message for subsequent
    if (isFirstMessage) {
      const greeting = keyword
        ? `I see you're focusing on '${keyword}'. Want to dig deeper, or is there something specific about it that's been stuck?`
        : "What's been on your mind lately? No need to organize it — just start wherever feels right."
      const { error } = await supabase.from("messages").insert([
        { session_id: sessionId, role: "assistant", content: greeting },
        { session_id: sessionId, role: "user", content: messageText },
      ])
      console.log("[firstMessage]", { error })
    } else {
      const { error } = await supabase
        .from("messages")
        .insert({ session_id: sessionId, role: "user", content: messageText })
      console.log("[userMessage]", { error })
    }

    sendMessage({ text: messageText })
    setInputValue("")

    // Extract keywords from first message via Gemini
    if (!headerKeyword && isFirstMessage) {
      try {
        const res = await fetch("/api/extract-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText, apiKey, sessionId }),
        })
        if (res.ok) {
          const data = await res.json()
          setHeaderKeyword(data.main)
          setSubKeywords(data.subs?.map((s: { label: string }) => s.label) ?? [])

          // Update session title in DB
          const supabase = (await import("@clearity/lib")).createClient()
          await supabase
            .from("chat_sessions")
            .update({ title: data.sessionTitle })
            .eq("id", sessionId)
        }
      } catch {
        // Fallback: use simple extraction
        const words = messageText.trim().split(/\s+/)
        const extracted = words.filter(w => w.length > 3).sort((a, b) => b.length - a.length)[0] ?? words[0]
        setHeaderKeyword(extracted)
      }
    }
  }

  const handleFinish = () => {
    setShowClarifyModal(true)
  }

  return (
    <div className="glass flex h-full flex-col">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/15 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <MobileSidebar activeSessionId={sessionId} />

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
        ) : (
          <div className="flex flex-col gap-6 py-6">
            {/* Greeting card — always visible */}
            <div className="flex justify-start px-2">
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

            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "user" ? (
                  <div className="relative glass-subtle !rounded-3xl px-5 py-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 max-w-[70%] w-fit !bg-white/20 dark:!bg-white/8">
                    {message.parts.map((part, i) => {
                      if (part.type === "text") return <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                      return null
                    })}
                  </div>
                ) : (
                  <div className="relative text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-[85%] w-fit px-2 py-1">
                    <Sparkles className="absolute -top-3 -left-3 h-4 w-4 text-[#a8b8c8] dark:text-[#8899aa]" />
                    {message.parts.map((part, i) => {
                      if (part.type === "text") return <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                      return null
                    })}
                  </div>
                )}
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
          <div className="flex items-end gap-3">
            <div className="glass-subtle relative flex-1 !rounded-2xl overflow-hidden">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(e.target.scrollHeight, 500) + "px"
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && inputValue.trim()) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={sessionStatus === "completed" ? "Session ended" : noApiKey ? "Add API key in Settings first" : "Share what's on your mind..."}
                disabled={sessionStatus === "completed" || noApiKey}
                rows={1}
                className="block w-full max-h-[500px] px-4 py-3 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none resize-none overflow-y-auto"
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
            {errorMessage ? (
              <span className="text-red-500">{errorMessage}</span>
            ) : (
              "Your conversations are private and secure"
            )}
          </p>
        </div>
      </div>
      <ClarifyModal
        open={showClarifyModal}
        onOpenChange={setShowClarifyModal}
        sessionId={sessionId}
        onConfirm={async () => { await onFinishSession(); router.push("/") }}
      />
    </div>
  )
}
