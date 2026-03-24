"use client"

import { Sparkles } from "lucide-react"

export function LoadingScreen({ message = "Loading your reflections..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#edf0f5] dark:bg-[#1a1d1d]">
      <div className="flex flex-col items-center gap-3">
        <div className="glass-solid flex h-12 w-12 items-center justify-center !rounded-2xl animate-pulse">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  )
}
