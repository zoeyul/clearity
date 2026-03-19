import { ClearityDashboard } from "@/components/dashboard/clearity-dashboard"

export const dynamic = "force-dynamic"

interface ChatPageProps {
  params: { id: string }
  searchParams: { keyword?: string }
}

export default function ChatPage({ params, searchParams }: ChatPageProps) {
  return <ClearityDashboard sessionId={params.id} keyword={searchParams.keyword} />
}
