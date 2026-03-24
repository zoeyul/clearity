"use client"

import { useChatHistory } from "@/shared/lib/use-chat-history"
import { useNewSession } from "@/shared/lib/use-new-session"
import { useRouter } from "next/navigation"
import { LeftSidebar } from "@/shared/ui/left-sidebar"
import { MobileSidebar } from "@/shared/ui/mobile-sidebar"

interface PageLayoutProps {
  children: React.ReactNode
  activeSessionId?: string | null
  header?: React.ReactNode
}

export function PageLayout({ children, activeSessionId = null, header }: PageLayoutProps) {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const handleNewSession = useNewSession()
  const handleSelectSession = (sessionId: string) => router.push(`/chat/${sessionId}`)

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#edf0f5] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d4dff0]/50 blur-[120px] dark:bg-[#2a3040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#dde3ed]/45 blur-[120px] dark:bg-[#252d38]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#e5eaf2]/60 blur-[100px] dark:bg-[#2d3342]/15" />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewSession}
            isLoading={chatHistory.isLoading}
          />
        </div>

        <main className="flex-1 min-w-0 h-full">
          {header && (
            <div className="flex items-center gap-3 mb-4">
              <MobileSidebar activeSessionId={activeSessionId} />
              {header}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
