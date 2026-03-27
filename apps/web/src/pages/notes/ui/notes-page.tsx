"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@clearity/lib"
import { Button } from "@clearity/ui"
import { StickyNote, Trash2, Save } from "lucide-react"
import { PageLayout } from "@/shared/ui/page-layout"

interface Note {
  id: string
  content: string
  session_title: string
  session_id: string | null
  updated_at: string
}

export function NotesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const loadNotes = async () => {
    const { data } = await supabase
      .from("session_notes")
      .select("id, content, session_id, updated_at, chat_sessions(title)")
      .order("updated_at", { ascending: false })

    if (data) {
      setNotes(data.map((n: Record<string, unknown>) => ({
        id: n.id as string,
        content: n.content as string,
        session_id: n.session_id as string | null,
        session_title: (n.chat_sessions as Record<string, unknown>)?.title as string ?? "",
        updated_at: n.updated_at as string,
      })))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadNotes()
  }, [supabase])

  const handleSave = async () => {
    if (!editingId) return
    await supabase
      .from("session_notes")
      .update({ content: editContent })
      .eq("id", editingId)
    setEditingId(null)
    loadNotes()
  }

  const handleDelete = async (id: string) => {
    if (editingId === id) setEditingId(null)
    setNotes(prev => prev.filter(n => n.id !== id))
    await supabase.from("session_notes").delete().eq("id", id)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <PageLayout header={
      <div>
        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Notes</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Save what matters during your conversations</p>
      </div>
    }>
      <div className="glass flex flex-col h-full !rounded-3xl p-8 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-zinc-400 text-center py-8">Loading...</p>
        ) : notes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <StickyNote className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 mb-2">No notes yet</p>
              <p className="text-xs text-zinc-400">Save what matters during your conversations</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="glass-subtle !rounded-2xl p-5 transition-all group"
              >
                {editingId === note.id ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                      rows={4}
                      className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none resize-none"
                      placeholder="Write your thoughts..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="!rounded-xl text-zinc-500"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="glass-solid !rounded-xl gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (note.session_id) {
                        router.push(`/chat/${note.session_id}`)
                      } else {
                        setEditingId(note.id)
                        setEditContent(note.content)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-3 whitespace-pre-wrap">
                          {note.content || "Empty note"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {note.session_title && (
                            <span className="text-[10px] text-zinc-400">
                              from &ldquo;{note.session_title}&rdquo;
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            {formatDate(note.updated_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(note.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 mt-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
