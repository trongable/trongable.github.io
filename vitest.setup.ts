import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, vi } from 'vitest'
import {
  clearFrameRegistry,
  resetMockThreeState,
  registerFrameCallback,
  currentThreeState,
  MockDreiBillboard,
  MockDreiText,
} from './src/testUtils/r3fTestUtils'

// Mock browser APIs for jsdom environment
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}

  window.matchMedia =
    window.matchMedia ||
    function (query: string) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
    }
}

// Global default mocks for React Three Fiber and Drei in jsdom
vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: any) => {
    registerFrameCallback(cb)
  },
  useThree: () => currentThreeState,
  Canvas: ({ children, onPointerMissed, onClick, frameloop }: any) =>
    React.createElement(
      'div',
      {
        'data-testid': 'r3f-canvas',
        'data-frameloop': frameloop,
        onClick: (e: any) => {
          onClick?.(e)
          onPointerMissed?.(e)
        },
      },
      children
    ),
}))

vi.mock('@react-three/drei', () => ({
  Billboard: MockDreiBillboard,
  Text: MockDreiText,
}))

// Suppress known React unknown-tag warnings for Three.js / R3F intrinsic elements in jsdom
const originalError = console.error
const r3fTags = [
  'mesh',
  'group',
  'color',
  'ambientLight',
  'pointLight',
  'planeGeometry',
  'meshBasicMaterial',
  'bufferGeometry',
  'bufferAttribute',
  'lineLoop',
  'lineDashedMaterial',
  'points',
  'pointsMaterial',
  'torusGeometry',
  'cylinderGeometry',
  'sphereGeometry',
]

console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    r3fTags.some(
      (tag) =>
        msg.includes(`The tag <${tag}> is unrecognized in this browser`) ||
        msg.includes(`<${tag} /> is using incorrect casing`)
    )
  ) {
    return
  }
  originalError(...args)
}

afterEach(() => {
  clearFrameRegistry()
  resetMockThreeState()
})
