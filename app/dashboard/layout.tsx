'use client'

import { DashboardNav } from '@/components/dashboard-nav'
import { AuthWrapper } from '@/components/auth-wrapper'
import { SimpleProfileSwitcher } from '@/components/simple-profile-switcher'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto">
        {/* Header with Profile Switcher */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            </div>
            <SimpleProfileSwitcher />
          </div>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
