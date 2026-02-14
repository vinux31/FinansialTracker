'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Today' },
    { href: '/history', label: 'History' },
    { href: '/monthly', label: 'Monthly' },
  ]

  return (
    <nav className="border-b bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex space-x-8 h-14 items-center">
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
      </div>
    </nav>
  )
}
