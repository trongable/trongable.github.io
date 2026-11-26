import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CyberTerminalLine } from '../CyberTerminalLine'
import { TunerProvider, useTuner } from '@/context/TunerContext'
import { RouterProvider } from '@/routes/Router'

function TunerStatusDisplay() {
  const { isTunerVisible } = useTuner()
  return <div data-testid="tuner-status">{isTunerVisible ? 'VISIBLE' : 'HIDDEN'}</div>
}

describe('CyberTerminalLine Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is initially hidden until keyboard input occurs', () => {
    render(
      <TunerProvider>
        <CyberTerminalLine />
        <TunerStatusDisplay />
      </TunerProvider>
    )

    expect(screen.queryByTestId('cyber-terminal-line')).not.toBeInTheDocument()
    expect(screen.getByTestId('tuner-status')).toHaveTextContent('HIDDEN')
  })

  it('wakes up when user types on the page and displays typed buffer', () => {
    render(
      <TunerProvider>
        <CyberTerminalLine />
        <TunerStatusDisplay />
      </TunerProvider>
    )

    fireEvent.keyDown(window, { key: 't' })
    fireEvent.keyDown(window, { key: 'e' })
    fireEvent.keyDown(window, { key: 's' })
    fireEvent.keyDown(window, { key: 't' })

    const terminal = screen.getByTestId('cyber-terminal-line')
    expect(terminal).toBeInTheDocument()
    expect(terminal).toHaveTextContent('test')
  })

  it('handles backspace and escape keys correctly', () => {
    render(
      <TunerProvider>
        <CyberTerminalLine />
      </TunerProvider>
    )

    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: 'b' })
    expect(screen.getByTestId('cyber-terminal-line')).toHaveTextContent('ab')

    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(screen.getByTestId('cyber-terminal-line')).toHaveTextContent('a')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('cyber-terminal-line')).not.toBeInTheDocument()
  })

  it('executes "tuner enable" and "tuner disable" on Enter', () => {
    render(
      <TunerProvider>
        <CyberTerminalLine />
        <TunerStatusDisplay />
      </TunerProvider>
    )

    // Type "tuner enable"
    const enableCmd = 'tuner enable'
    for (const char of enableCmd) {
      fireEvent.keyDown(window, { key: char })
    }
    expect(screen.getByTestId('cyber-terminal-line')).toHaveTextContent('tuner enable')

    // Press Enter
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('tuner-status')).toHaveTextContent('VISIBLE')

    // Type "tuner disable"
    const disableCmd = 'tuner disable'
    for (const char of disableCmd) {
      fireEvent.keyDown(window, { key: char })
    }
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('tuner-status')).toHaveTextContent('HIDDEN')
  })

  it('stops click propagation when clicking on the terminal line', () => {
    const parentClick = vi.fn()

    render(
      <div onClick={parentClick}>
        <TunerProvider>
          <CyberTerminalLine />
        </TunerProvider>
      </div>
    )

    fireEvent.keyDown(window, { key: 'h' })
    const terminal = screen.getByTestId('cyber-terminal-line')
    fireEvent.click(terminal)

    expect(parentClick).not.toHaveBeenCalled()
  })

  it('navigates to /ui-catalog when typing "ui-catalog" and pressing Enter', () => {
    window.location.hash = ''
    render(
      <RouterProvider>
        <TunerProvider>
          <CyberTerminalLine />
        </TunerProvider>
      </RouterProvider>
    )

    for (const char of 'ui-catalog') {
      fireEvent.keyDown(window, { key: char })
    }
    fireEvent.keyDown(window, { key: 'Enter' })

    expect(window.location.hash).toBe('#/ui-catalog')
  })
})
