import React from 'react'
import { RouterProvider, useRouter } from './routes/Router'
import { ThemeProvider } from './context/ThemeContext'
import { SonnyContainerProvider } from './context/SonnyContainerContext'
import { DebugDistanceProvider } from './context/DebugDistanceContext'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { MorePage } from './pages/MorePage'
import { SonnyPage } from './pages/SonnyPage'

const AppContent: React.FC = () => {
  const { currentPath } = useRouter()

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/about':
        return <AboutPage />
      case '/more':
        return <MorePage />
      case '/sonny':
        return <SonnyPage />
      case '/':
      default:
        return <HomePage />
    }
  }

  return (
    <div className="relative w-full h-full min-h-dvh bg-[#1c1b22] text-[var(--theme-primary)] font-sans selection:bg-neutral-800">
      {renderCurrentPage()}
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <ThemeProvider>
        <SonnyContainerProvider>
          <DebugDistanceProvider>
            <AppContent />
          </DebugDistanceProvider>
        </SonnyContainerProvider>
      </ThemeProvider>
    </RouterProvider>
  )
}

export default App
