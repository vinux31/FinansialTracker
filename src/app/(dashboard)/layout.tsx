import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import MigrationDetector from '@/components/migration-detector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // CRITICAL: Use getUser() not getSession() - validates token with Supabase Auth
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MigrationDetector userId={data.user.id} />
      <Navigation userEmail={data.user.email} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
