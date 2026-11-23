import React from 'react'
import { RouterProvider, useRouter } from './routes/Router'
import { ThemeProvider } from './context/ThemeContext'
import { TunerProvider } from './context/TunerContext'
import { SonnyContainerProvider } from './context/SonnyContainerContext'
import { DebugDistanceProvider } from './context/DebugDistanceContext'
import { CyberTerminalLine } from './components/ui/CyberTerminalLine'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { MorePage } from './pages/MorePage'
import { SonnyPage } from './pages/SonnyPage'
import { VideosPage } from './pages/VideosPage'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ANTIGRAVITY CRITICAL ERROR]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1c1b22] text-[#ff0055] p-6 font-mono select-none">
          <div className="max-w-md w-full border border-[#ff0055]/40 rounded-xl p-5 bg-[#131217] shadow-2xl">
            <span className="text-xs uppercase tracking-widest block font-bold text-[#ff0055] mb-2">
              ⚠️ Diagnostic Recovery Error
            </span>
            <p className="text-xs text-[var(--theme-primary)]/80 mb-4">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="px-3 py-1.5 rounded border border-[#ff0055]/50 hover:bg-[#ff0055]/20 text-xs font-semibold text-[#ff0055] cursor-pointer transition-colors"
            >
              ↺ Reload Application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
      case '/videos':
        return <VideosPage />
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
    <RootErrorBoundary>
      <RouterProvider>
        <ThemeProvider>
          <TunerProvider>
            <SonnyContainerProvider>
              <DebugDistanceProvider>
                <AppContent />
                <CyberTerminalLine />
              </DebugDistanceProvider>
            </SonnyContainerProvider>
          </TunerProvider>
        </ThemeProvider>
      </RouterProvider>
    </RootErrorBoundary>
  )
}

export default App
