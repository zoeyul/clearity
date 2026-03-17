"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clearity/ui"
import { Badge } from "@clearity/ui"
import { Checkbox } from "@clearity/ui"
import { cn } from "@clearity/ui/lib/utils"
import { TrendingUp, Hash, ListTodo, Brain } from "lucide-react"
import type { SessionKeyword, SessionEmotion, ActionItem } from "@clearity/lib"

interface AnalysisPanelProps {
  keywords: SessionKeyword[]
  emotions: SessionEmotion[]
  actionItems: ActionItem[]
  messageCount: number
  sessionDuration?: number | null
  sessionStartedAt?: string | null
  onToggleActionItem: (itemId: string, isCompleted: boolean) => Promise<void>
  isLoading: boolean
}

function EmotionalTrendChart({ emotions }: { emotions: SessionEmotion[] }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [emotions])

  const primaryEmotion = emotions.length > 0
    ? emotions.reduce((max, e) => (e.value > max.value ? e : max), emotions[0])
    : null

  return (
    <div className="flex flex-col gap-3">
      {emotions.map((emotion) => (
        <div key={emotion.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/60">{emotion.label}</span>
            <span className="font-medium text-foreground">{emotion.value}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20 dark:bg-white/8">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                emotion.value > 60
                  ? "bg-foreground/70"
                  : emotion.value > 40
                  ? "bg-foreground/50"
                  : "bg-foreground/30"
              )}
              style={{ width: animated ? `${emotion.value}%` : "0%" }}
            />
          </div>
        </div>
      ))}
      {primaryEmotion && (
        <div className="glass-interactive mt-2 flex items-center gap-2 !rounded-xl px-3 py-2.5">
          <Brain className="h-4 w-4 text-foreground/70" />
          <p className="text-xs text-foreground/60">
            Primary emotion: <span className="font-medium text-foreground">{primaryEmotion.label}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export function AnalysisPanel({
  keywords,
  emotions,
  actionItems,
  messageCount,
  sessionDuration,
  sessionStartedAt,
  onToggleActionItem,
  isLoading,
}: AnalysisPanelProps) {
  const completedCount = actionItems.filter((item) => item.is_completed).length

  const displayDuration = sessionDuration
    ?? (sessionStartedAt
      ? Math.round((Date.now() - new Date(sessionStartedAt).getTime()) / 60000)
      : 0)

  if (isLoading) {
    return (
      <aside className="glass flex h-full w-full items-center justify-center">
        <p className="text-sm text-zinc-400">Loading insights...</p>
      </aside>
    )
  }

  return (
    <aside className="glass flex h-full w-full flex-col">
      <div className="relative z-10 flex items-center gap-2 px-5 py-6 border-b border-white/15">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Session Insights
        </h2>
      </div>

      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Live Keywords */}
          <Card className="glass-subtle !rounded-2xl border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <Hash className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                Live Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 ? (
                <p className="text-xs text-zinc-400">Keywords will appear as you chat...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword.id}
                      variant="secondary"
                      className={cn(
                        "glass-interactive cursor-default !rounded-xl",
                        keyword.intensity === "high" &&
                          "!bg-foreground/10 text-zinc-800 dark:text-zinc-200 !border-foreground/15",
                        keyword.intensity === "medium" &&
                          "!bg-white/15 text-zinc-700 dark:text-zinc-300 !border-white/20",
                        keyword.intensity === "low" &&
                          "!bg-white/8 text-zinc-500 dark:text-zinc-400 !border-white/10"
                      )}
                    >
                      {keyword.label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emotional Trend */}
          <Card className="glass-subtle !rounded-2xl border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                Emotional Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emotions.length === 0 ? (
                <p className="text-xs text-zinc-400">Emotions will be analyzed as you chat...</p>
              ) : (
                <EmotionalTrendChart emotions={emotions} />
              )}
            </CardContent>
          </Card>

          {/* Draft Action Items */}
          <Card className="glass-subtle !rounded-2xl border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  Draft Action Items
                </div>
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {completedCount}/{actionItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionItems.length === 0 ? (
                <p className="text-xs text-zinc-400">Action items will be suggested as you chat...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {actionItems.map((item) => (
                    <label
                      key={item.id}
                      className={cn(
                        "glass-interactive flex items-start gap-3 !rounded-xl !border-transparent !bg-transparent !shadow-none px-3 py-2.5 cursor-pointer",
                        item.is_completed && "opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={(checked) =>
                          onToggleActionItem(item.id, checked as boolean)
                        }
                        className="mt-0.5 rounded-md border-zinc-300 dark:border-zinc-600"
                      />
                      <span
                        className={cn(
                          "text-sm leading-relaxed text-zinc-700 dark:text-zinc-300",
                          item.is_completed && "line-through text-zinc-400 dark:text-zinc-500"
                        )}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Summary Footer */}
      <div className="relative z-10 border-t border-white/15 px-5 py-4">
        <div className="glass-subtle !rounded-2xl px-4 py-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Session duration: <span className="font-medium text-zinc-800 dark:text-zinc-200">{displayDuration} minutes</span>
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Messages exchanged: <span className="font-medium text-zinc-800 dark:text-zinc-200">{messageCount}</span>
          </p>
        </div>
      </div>
    </aside>
  )
}
