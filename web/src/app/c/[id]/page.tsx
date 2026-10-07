import { Suspense } from 'react'
import { HomeScreen } from '@/modules/home'

export const metadata = {
  title: 'Citizen Welfare Consultation | AI Assistant',
  description: 'Personalized government scheme discovery and citizen assistance.',
}

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const sessionKey = resolvedParams.id

  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#F8FAFC] text-slate-500 items-center justify-center font-sans font-semibold text-xs gap-3">
          <div className="h-5 w-5 border-2 border-[#0E6245]/20 border-t-[#0E6245] rounded-full animate-spin" />
          <span>Loading consultation session...</span>
        </div>
      }
    >
      <HomeScreen initialSessionId={sessionKey} />
    </Suspense>
  )
}
