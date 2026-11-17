import React from 'react'
import { RouterProvider, useRouter } from './routes/Router'
import { ThemeProvider } from './context/ThemeContext'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { MorePage } from './pages/MorePage'

const AppContent: React.FC = () => {
  const { currentPath } = useRouter()

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/about':
        return <AboutPage />
      case '/more':
        return <MorePage />
      case '/':
      default:
        return <HomePage />
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#1c1b22] text-[var(--theme-primary)] font-sans selection:bg-neutral-800">
      {renderCurrentPage()}
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </RouterProvider>
  )
}

export default App
