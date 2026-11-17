import React from 'react'
import { useRouter } from '../../routes/Router'

export interface NavItem {
  label: string
  path: string
  isExternal?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'about', path: '/about' },
  { label: 'more', path: '/more' },
  { label: 'dchc', path: 'https://dc-hardcore.com', isExternal: true },
]

export const Navbar: React.FC = () => {
  const { currentPath, navigate } = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 backdrop-blur-xs">
      <button
        onClick={() => navigate('/?halo=true')}
        className="text-xs tracking-widest lowercase text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors duration-200 cursor-pointer font-mono"
        aria-label="Home"
      >
        trongable
      </button>

      <nav className="flex items-center gap-5 md:gap-8 text-xs tracking-wider lowercase font-mono">
        {NAV_ITEMS.map((item) => {
          if (item.isExternal) {
            return (
              <a
                key={item.label}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors duration-200"
              >
                {item.label}
              </a>
            )
          }

          const isActive = currentPath === item.path

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-[var(--theme-highlight)] font-medium underline underline-offset-4 decoration-[var(--theme-primary)]'
                  : 'text-[var(--theme-primary)] hover:text-[var(--theme-highlight)]'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
