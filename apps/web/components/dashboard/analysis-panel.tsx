"use client"

import { useState } from "react"
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

const keywords = [
  { label: "Work Stress", intensity: "high" },
  { label: "Boundaries", intensity: "medium" },
  { label: "Overwhelm", intensity: "high" },
  { label: "Manager", intensity: "medium" },
  { label: "Deadlines", intensity: "high" },
  { label: "Capacity", intensity: "low" },
  { label: "Projects", intensity: "medium" },
]

const emotionalData = [
  { label: "Stressed", value: 75 },
  { label: "Anxious", value: 60 },
  { label: "Hopeful", value: 35 },
  { label: "Calm", value: 25 },
]

interface ActionItem {
  id: string
  text: string
  completed: boolean
}

const initialActionItems: ActionItem[] = [
  {
    id: "1",
    text: "Schedule 1:1 meeting with manager to discuss workload",
    completed: false,
  },
  {
    id: "2",
    text: "List all current projects with realistic timelines",
    completed: false,
  },
  {
    id: "3",
    text: "Practice saying 'no' to new requests this week",
    completed: true,
  },
  {
    id: "4",
    text: "Take 15-minute breaks between deep work sessions",
    completed: false,
  },
  {
    id: "5",
    text: "Try a 10-minute wind-down routine before bed tonight",
    completed: false,
  },
  {
    id: "6",
    text: "Write down racing thoughts in a journal before sleep",
    completed: false,
  },
  {
    id: "7",
    text: "Block 30 minutes for deep breathing or meditation",
    completed: true,
  },
  {
    id: "8",
    text: "Identify top 3 priorities for this week only",
    completed: false,
  },
  {
    id: "9",
    text: "Set a hard stop time for work each evening",
    completed: false,
  },
  {
    id: "10",
    text: "Delegate or defer at least one low-priority task",
    completed: false,
  },
  {
    id: "11",
    text: "Prepare a workload summary document for manager",
    completed: false,
  },
  {
    id: "12",
    text: "Replace screen time with reading 30 min before bed",
    completed: true,
  },
  {
    id: "13",
    text: "Practice the 'not complaining, just aligning' framing",
    completed: false,
  },
  {
    id: "14",
    text: "Schedule a 20-minute walk during lunch break",
    completed: false,
  },
]

function EmotionalTrendChart() {
  return (
    <div className="flex flex-col gap-3">
      {emotionalData.map((emotion) => (
        <div key={emotion.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/60">{emotion.label}</span>
            <span className="font-medium text-foreground">{emotion.value}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20 dark:bg-white/8">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                emotion.value > 60
                  ? "bg-foreground/70"
                  : emotion.value > 40
                  ? "bg-foreground/50"
                  : "bg-foreground/30"
              )}
              style={{ width: `${emotion.value}%` }}
            />
          </div>
        </div>
      ))}
      <div className="glass-interactive mt-2 flex items-center gap-2 !rounded-xl px-3 py-2.5">
        <Brain className="h-4 w-4 text-foreground/70" />
        <p className="text-xs text-foreground/60">
          Primary emotion: <span className="font-medium text-foreground">Work-related stress</span>
        </p>
      </div>
    </div>
  )
}

export function AnalysisPanel() {
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems)

  const toggleActionItem = (id: string) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const completedCount = actionItems.filter((item) => item.completed).length

  return (
    <aside className="glass flex h-full w-full flex-col">
      <div className="relative z-10 flex items-center gap-2 px-5 py-6 border-b border-white/15">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Session Insights
        </h2>
      </div>

      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Real-time Keywords */}
          <Card className="glass-subtle !rounded-2xl border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <Hash className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                Live Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword.label}
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
              <EmotionalTrendChart />
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
              <div className="flex flex-col gap-2">
                {actionItems.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "glass-interactive flex items-start gap-3 !rounded-xl !border-transparent !bg-transparent !shadow-none px-3 py-2.5 cursor-pointer",
                      item.completed && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleActionItem(item.id)}
                      className="mt-0.5 rounded-md border-zinc-300 dark:border-zinc-600"
                    />
                    <span
                      className={cn(
                        "text-sm leading-relaxed text-zinc-700 dark:text-zinc-300",
                        item.completed && "line-through text-zinc-400 dark:text-zinc-500"
                      )}
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Summary Footer */}
      <div className="relative z-10 border-t border-white/15 px-5 py-4">
        <div className="glass-subtle !rounded-2xl px-4 py-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Session duration: <span className="font-medium text-zinc-800 dark:text-zinc-200">24 minutes</span>
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Messages exchanged: <span className="font-medium text-zinc-800 dark:text-zinc-200">5</span>
          </p>
        </div>
      </div>
    </aside>
  )
}
