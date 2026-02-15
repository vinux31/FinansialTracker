'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function Navigation({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/', label: 'Today' },
    { href: '/history', label: 'History' },
    { href: '/monthly', label: 'Monthly' },
  ]

  async function handleLogout() {
    try {
      await signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          <div className="flex space-x-8 items-center">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    text-sm font-medium transition-colors
                    ${isActive
                      ? 'text-gray-900 border-b-2 border-gray-900 pb-[2px]'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
          {userEmail && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
