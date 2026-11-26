import React from 'react'

interface HomeScreenReaderNavProps {
  onSelect: (path: string) => void
}

/**
 * Accessible screen-reader navigation landmarks mirroring the 3D topology links.
 */
export const HomeScreenReaderNav: React.FC<HomeScreenReaderNavProps> = ({ onSelect }) => {
  return (
    <nav className="sr-only" aria-label="Direct Destinations">
      <button onClick={() => onSelect('/about')}>about</button>
      <button onClick={() => onSelect('/gallery')}>gallery</button>
      <button onClick={() => onSelect('/more')}>more</button>
      <button onClick={() => onSelect('/sonny')}>sonny</button>
      <a href="https://dc-hardcore.com" target="_blank" rel="noopener noreferrer">
        dchc
      </a>
    </nav>
  )
}
