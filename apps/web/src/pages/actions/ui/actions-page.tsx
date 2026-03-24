"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@clearity/lib"
import { Button, Checkbox } from "@clearity/ui"
import { Plus, Trash2, ListChecks } from "lucide-react"
import { PageLayout } from "@/shared/ui/page-layout"

interface ActionItem {
  id: string
  text: string
  is_completed: boolean
  session_title: string
  created_at: string
}

export function ActionsPage() {
  const supabase = createClient()
  const [actions, setActions] = useState<ActionItem[]>([])
  const [newText, setNewText] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadActions = useCallback(async () => {
    const { data } = await supabase
      .from("action_items")
      .select("id, text, is_completed, created_at, chat_sessions(title)")
      .order("created_at", { ascending: false })

    if (data) {
      setActions(data.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        text: item.text as string,
        is_completed: item.is_completed as boolean,
        session_title: (item.chat_sessions as Record<string, unknown>)?.title as string ?? "",
        created_at: item.created_at as string,
      })))
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    loadActions()
  }, [loadActions])

  const handleAdd = async () => {
    if (!newText.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("action_items").insert({
      text: newText.trim(),
      is_completed: false,
      user_id: user.id,
    })
    if (!error) {
      setNewText("")
      loadActions()
    }
  }

  const handleToggle = async (id: string, isCompleted: boolean) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, is_completed: isCompleted } : a))
    await supabase.from("action_items").update({ is_completed: isCompleted }).eq("id", id)
  }

  const handleDelete = async (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id))
    await supabase.from("action_items").delete().eq("id", id)
  }

  const pending = actions.filter(a => !a.is_completed)
  const completed = actions.filter(a => a.is_completed)

  return (
    <PageLayout header={<h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Actions</h1>}>
      <div className="glass flex flex-col h-full !rounded-3xl p-8 overflow-y-auto">
        {/* Add new action */}
        <div className="flex gap-2 mb-6">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a new action..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-700/60 text-sm text-zinc-800 dark:text-white placeholder:text-zinc-400 focus:outline-none"
          />
          <Button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="glass-solid !rounded-2xl px-4"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-400 text-center py-8">Loading...</p>
        ) : actions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ListChecks className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 mb-2">No actions yet</p>
              <p className="text-xs text-zinc-400">Add actions above or they&apos;ll appear from your chat sessions</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Pending ({pending.length})</p>
                <div className="space-y-2">
                  {pending.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-700/30 group">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggle(item.id, true)}
                        className="mt-0.5 rounded-md border-slate-300 dark:border-slate-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 dark:text-zinc-200">{item.text}</p>
                        {item.session_title && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">from &ldquo;{item.session_title}&rdquo;</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Completed ({completed.length})</p>
                <div className="space-y-2">
                  {completed.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-700/20 group">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggle(item.id, false)}
                        className="mt-0.5 rounded-md border-slate-300 dark:border-slate-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-400 line-through">{item.text}</p>
                        {item.session_title && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">from &ldquo;{item.session_title}&rdquo;</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
