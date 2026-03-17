import { LeftSidebar } from "@/components/dashboard/left-sidebar"
import { ChatArea } from "@/components/dashboard/chat-area"
import { AnalysisPanel } from "@/components/dashboard/analysis-panel"

export default function ClearityDashboard() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Base: light neutral with teal hint */}
      <div className="absolute inset-0 bg-[#f0f4f4] dark:bg-[#1a1d1d]" />

      {/* Pastel teal blobs - low saturation, high lightness */}
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d0e4e4]/50 blur-[120px] dark:bg-[#2a4040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#c8dede]/45 blur-[120px] dark:bg-[#253838]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#dceaea]/60 blur-[100px] dark:bg-[#2d4242]/15" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Content */}
      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        {/* Left Sidebar */}
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar />
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 min-h-0 h-full">
          <ChatArea />
        </main>

        {/* Right Analysis Panel */}
        <div className="hidden w-[320px] shrink-0 xl:block h-full">
          <AnalysisPanel />
        </div>
      </div>
    </div>
  )
}
