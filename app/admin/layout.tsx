'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BarChart3, FileText, Users, Settings, Shield, LogOut } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Applications', href: '/admin/applications', icon: FileText },
  { name: 'SEIS/EIS', href: '/admin/seis-eis', icon: Shield },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm">
        <div className="flex items-center px-6 py-4 border-b">
          <Shield className="w-6 h-6 mr-3 text-red-600" />
          <span className="text-xl font-bold text-gray-900">Admin Panel</span>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {(() => {
                  const IconComponent = item.icon
                  return <IconComponent className="mr-3 w-5 h-5" />
                })()}
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 w-64 p-3 border-t">
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            <LogOut className="mr-3 w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
