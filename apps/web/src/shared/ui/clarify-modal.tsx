"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Checkbox,
  Skeleton,
  ScrollArea,
} from "@clearity/ui"
import { CheckCircle2, Sparkles, RotateCcw, X, Plus, Pencil, MessageSquare } from "lucide-react"
import { createClient } from "@clearity/lib"
import { cn } from "@clearity/ui/lib/utils"
import type { ActionItem, SessionSummary } from "@clearity/lib"

interface ClarifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  onConfirm: () => Promise<unknown>
  onViewChat?: () => void
}

export function ClarifyModal({ open, onOpenChange, sessionId, onConfirm, onViewChat }: ClarifyModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [editedNote, setEditedNote] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    setError(null)

    const generate = async () => {
      const apiKey = localStorage.getItem("clearity-api-key")
      if (!apiKey) {
        setError("No API key configured")
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/sessions/${sessionId}/clarify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Failed to generate summary")
          setIsLoading(false)
          return
        }

        const data = await res.json()
        setSummary(data.summary)
        setActionItems(data.actionItems)
        setEditedNote("")
      } catch {
        setError("Network error")
      } finally {
        setIsLoading(false)
      }
    }

    generate()
  }, [open, sessionId])

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    setActionItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, is_completed: checked } : item)
    )
    await supabaseRef.current
      .from("action_items")
      .update({ is_completed: checked })
      .eq("id", itemId)
  }

  const handleEditItem = (itemId: string, text: string) => {
    setActionItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, text } : item)
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setActionItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleAddItem = () => {
    setActionItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        text: "",
        is_completed: false,
        sort_order: prev.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    const supabase = supabaseRef.current

    // Save user note
    if (summary) {
      await supabase
        .from("session_summaries")
        .update({ user_note: editedNote })
        .eq("session_id", sessionId)
    }

    // Sync action items: delete old, insert current
    await supabase.from("action_items").delete().eq("session_id", sessionId)
    const validItems = actionItems.filter(item => item.text.trim())
    if (validItems.length > 0) {
      await supabase.from("action_items").insert(
        validItems.map((item, i) => ({
          session_id: sessionId,
          text: item.text,
          is_completed: item.is_completed,
          sort_order: i,
        }))
      )
    }

    await onConfirm()
    onOpenChange(false)
    setIsConfirming(false)
  }

  const handleRetry = () => {
    setSummary(null)
    setActionItems([])
    setError(null)
    setIsLoading(true)

    const apiKey = localStorage.getItem("clearity-api-key")
    if (!apiKey) {
      setError("No API key configured")
      setIsLoading(false)
      return
    }

    fetch(`/api/sessions/${sessionId}/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setSummary(data.summary)
          setActionItems(data.actionItems)
          setEditedNote("")
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setIsLoading(false))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "sm:max-w-[540px] !rounded-2xl !p-0 overflow-hidden",
          "!bg-white/30 dark:!bg-white/8",
          "backdrop-blur-[48px]",
          "!border-white/20",
          "!shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]"
        )}
      >
        <DialogTitle className="sr-only">Session Summary</DialogTitle>

        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <p className="text-sm text-zinc-500">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="glass-interactive !rounded-xl gap-2 text-zinc-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[70vh]">
              <div className="flex flex-col gap-3 p-5">
                {/* Header */}
                <div className="flex items-center gap-2 px-1 pb-1">
                  <Sparkles className="h-4 w-4 text-white dark:text-white" />
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Session Summary
                  </p>
                </div>

                {/* Section 1: Context Summary */}
                <SectionCard index={0} isLoading={isLoading} label="Context Summary">
                  {summary && (
                    <>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {summary.contradiction}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {summary.main_keywords.map(kw => (
                          <span
                            key={kw}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </SectionCard>

                {/* Section 2: Insight & Diagnosis */}
                <SectionCard index={1} isLoading={isLoading} label="Insight & Diagnosis">
                  {summary && (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {summary.personality_insight}
                      </p>
                      <div className="border-l-2 border-zinc-300/40 dark:border-zinc-600/40 pl-3">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Reframing</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                          {summary.reframing}
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Section 3: User's Commitment */}
                <SectionCard index={2} isLoading={isLoading} label="My Takeaway" hint="Write your own">
                  {summary && (
                    <textarea
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      className="w-full bg-transparent text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
                      rows={3}
                      placeholder="What did you realize? What will you do differently?"
                    />
                  )}
                </SectionCard>

                {/* Section 4: Next Steps */}
                <SectionCard index={3} isLoading={isLoading} label="Next Steps" hint="Tap to edit">
                  {actionItems.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {actionItems.map(item => (
                        <div key={item.id} className="group flex items-start gap-2">
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                            className="mt-1 shrink-0"
                          />
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => handleEditItem(item.id, e.target.value)}
                            className={cn(
                              "flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed focus:outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors",
                              item.is_completed && "line-through text-zinc-400"
                            )}
                          />
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleAddItem}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mt-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add step
                      </button>
                    </div>
                  )}
                </SectionCard>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/15 px-5 py-3">
              {onViewChat ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewChat}
                  className="glass-interactive !rounded-xl text-zinc-500 gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  View Conversation
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="glass-interactive !rounded-xl text-zinc-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || isConfirming}
                size="sm"
                className="glass-solid gap-2 !rounded-xl"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isConfirming ? "Saving..." : "Confirm"}
              </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SectionCard({
  index,
  isLoading,
  label,
  hint,
  children,
}: {
  index: number
  isLoading: boolean
  label: string
  hint?: string
  children: React.ReactNode
}) {
  if (isLoading) {
    return (
      <div className="glass-subtle !rounded-xl p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          {label}
        </p>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass-subtle !rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        {hint && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            <Pencil className="h-2.5 w-2.5" />
            {hint}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  )
}
