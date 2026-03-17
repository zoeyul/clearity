import { ClearityDashboard } from "@/components/dashboard/clearity-dashboard"

export const dynamic = "force-dynamic"

interface ChatPageProps {
  params: { id: string }
}

export default function ChatPage({ params }: ChatPageProps) {
  return <ClearityDashboard sessionId={params.id} />
}
