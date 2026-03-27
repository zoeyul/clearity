"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@clearity/lib"
import { X, Save } from "lucide-react"
import { Button } from "@clearity/ui"

interface NotePanelProps {
  sessionId: string
  onClose: () => void
}

export function NotePanel({ sessionId, onClose }: NotePanelProps) {
  const supabase = createClient()
  const [content, setContent] = useState("")
  const [noteId, setNoteId] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const contentRef = useRef(content)
  const noteIdRef = useRef(noteId)
  const isSavedRef = useRef(isSaved)

  // Keep refs in sync
  contentRef.current = content
  noteIdRef.current = noteId
  isSavedRef.current = isSaved

  // Load existing note
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("session_notes")
        .select("id, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setNoteId(data.id)
        setContent(data.content)
        noteIdRef.current = data.id
      }
      setIsLoading(false)
    }
    load()
  }, [sessionId, supabase])

  const saveNote = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (noteIdRef.current) {
      await supabase
        .from("session_notes")
        .update({ content: contentRef.current })
        .eq("id", noteIdRef.current)
    } else {
      const { data } = await supabase
        .from("session_notes")
        .insert({ session_id: sessionId, user_id: user.id, content: contentRef.current })
        .select("id")
        .single()
      if (data) {
        setNoteId(data.id)
        noteIdRef.current = data.id
      }
    }

    setIsSaved(true)
  }, [sessionId, supabase])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSavedRef.current) saveNote()
    }, 30000)
    return () => clearInterval(interval)
  }, [saveNote])

  // Save on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isSavedRef.current) {
        navigator.sendBeacon?.(`/api/sessions/${sessionId}/save-note`, JSON.stringify({
          noteId: noteIdRef.current,
          content: contentRef.current,
        }))
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (!isSavedRef.current) saveNote()
    }
  }, [sessionId, saveNote])

  return (
    <div className="glass flex flex-col h-full !rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Notes</h3>
          {isSaved ? (
            <span className="text-[10px] text-zinc-400">Saved</span>
          ) : (
            <span className="text-[10px] text-amber-500">Unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={saveNote}
            disabled={isSaved}
            className="h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-700 disabled:opacity-30"
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-700"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setIsSaved(false)
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
              e.preventDefault()
              saveNote()
            }
          }}
          placeholder="Write your thoughts here..."
          className="flex-1 w-full px-4 py-3 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none resize-none overflow-y-auto"
        />
      )}
    </div>
  )
}
