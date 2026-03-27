import { ClearityDashboard } from "@/pages/chat"

export const dynamic = "force-dynamic"

interface ChatPageProps {
  params: { id: string }
  searchParams: { keyword?: string; context?: string }
}

export default function ChatPage({ params, searchParams }: ChatPageProps) {
  return <ClearityDashboard sessionId={params.id} keyword={searchParams.keyword} context={searchParams.context} />
}
