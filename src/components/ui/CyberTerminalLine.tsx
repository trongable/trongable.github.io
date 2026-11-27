import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTuner } from '@/context/TunerContext'
import { useRouter } from '@/routes/Router'

export const CyberTerminalLine: React.FC = () => {
  const { setIsTunerVisible, toggleTuner, setIsTerminalOpen } = useTuner()
  const { navigate } = useRouter()
  const [buffer, setBuffer] = useState('')
  const bufferRef = useRef('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTerminalShowing = isVisible || Boolean(statusMessage)

  useEffect(() => {
    setIsTerminalOpen(isTerminalShowing)
    return () => setIsTerminalOpen(false)
  }, [isTerminalShowing, setIsTerminalOpen])

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      setIsVisible(false)
      bufferRef.current = ''
      setBuffer('')
      setStatusMessage(null)
    }, 4500)
  }, [])

  const executeCommand = useCallback(
    (rawCmd: string) => {
      const cmd = rawCmd.trim().toLowerCase()
      if (cmd === 'tuner enable' || cmd === 'tuner on') {
        setIsTunerVisible(true)
        setStatusMessage('[tuner enabled]')
      } else if (cmd === 'tuner disable' || cmd === 'tuner off') {
        setIsTunerVisible(false)
        setStatusMessage('[tuner disabled]')
      } else if (cmd === 'tuner' || cmd === 'tuner toggle') {
        toggleTuner()
        setStatusMessage('[tuner toggled]')
      } else if (cmd === 'ui-catalog') {
        navigate('/ui-catalog')
        setStatusMessage('[navigating to ui-catalog]')
      } else if (cmd.length > 0) {
        setStatusMessage(`[unknown command: "${rawCmd}"]`)
      }

      bufferRef.current = ''
      setBuffer('')
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => {
        setIsVisible(false)
        setStatusMessage(null)
      }, 1600)
    },
    [setIsTunerVisible, toggleTuner, navigate]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside a form input/textarea/editable
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      // Ignore if control keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return

      if (e.key === 'Escape') {
        setIsVisible(false)
        bufferRef.current = ''
        setBuffer('')
        setStatusMessage(null)
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
        return
      }

      if (e.key === 'Enter') {
        const cmd = bufferRef.current
        if (cmd.length > 0) {
          e.preventDefault()
          bufferRef.current = ''
          setBuffer('')
          executeCommand(cmd)
        }
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        bufferRef.current = bufferRef.current.slice(0, -1)
        setBuffer(bufferRef.current)
        if (bufferRef.current.length === 0 && !statusMessage) {
          setIsVisible(false)
        }
        resetIdleTimer()
        return
      }

      // Printable single character keystrokes
      if (e.key.length === 1) {
        if (statusTimerRef.current) {
          clearTimeout(statusTimerRef.current)
          statusTimerRef.current = null
        }
        setIsVisible(true)
        setStatusMessage(null)
        bufferRef.current += e.key
        setBuffer(bufferRef.current)
        resetIdleTimer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [executeCommand, resetIdleTimer, statusMessage])

  if (!isTerminalShowing) return null

  return (
    <aside
      data-testid="cyber-terminal-line"
      className="fixed bottom-3 left-4 right-4 md:left-8 md:right-8 z-[75] flex items-center justify-between px-3.5 py-2 rounded-lg border border-[var(--theme-primary)]/40 bg-[#0c0b10]/95 backdrop-blur-md font-mono text-xs text-[var(--theme-primary)] shadow-2xl transition-all duration-150 select-none pointer-events-auto"
      onClick={(e) => {
        // Prevent clicking the terminal from triggering underlying canvas/page clicks
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-[var(--theme-highlight)] font-bold select-none">&gt;</span>
        {statusMessage ? (
          <span className="text-[var(--theme-highlight)] tracking-wider font-semibold">
            {statusMessage}
          </span>
        ) : (
          <span className="tracking-wide">
            {buffer}
            <span className="inline-block w-2 text-[var(--theme-highlight)] animate-pulse">█</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[var(--theme-primary)]/40 tracking-widest hidden sm:flex">
        <span>[esc to close]</span>
      </div>
    </aside>
  )
}
