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

// HTMLImageElement decode stub for jsdom
if (typeof HTMLImageElement !== 'undefined' && !('decode' in HTMLImageElement.prototype)) {
  ;(HTMLImageElement.prototype as any).decode = function () {
    return Promise.resolve()
  }
}

// Canvas 2D Context stub for ParticleField and CurvedVideoPanel in jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType: string) {
    if (contextType === '2d') {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: new Array(4) }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
        createRadialGradient: () => ({
          addColorStop: () => {},
        }),
        createLinearGradient: () => ({
          addColorStop: () => {},
        }),
      } as any
    }
    return null
  }
}

// Global default mocks for React Three Fiber and Drei in jsdom
vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: any) => {
    registerFrameCallback(cb)
  },
  useThree: () => currentThreeState,
  Canvas: ({ children, onPointerMissed, onClick, frameloop, gl }: any) =>
    React.createElement(
      'div',
      {
        'data-testid': 'r3f-canvas',
        'data-frameloop': frameloop,
        'data-tone-mapping': gl?.toneMapping,
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

// Suppress known React unknown-tag and prop warnings for Three.js / R3F intrinsic elements in jsdom
const originalError = console.error
const r3fTags = [
  'mesh',
  'group',
  'color',
  'ambientLight',
  'pointLight',
  'planeGeometry',
  'meshBasicMaterial',
  'shaderMaterial',
  'bufferGeometry',
  'bufferAttribute',
  'lineLoop',
  'lineBasicMaterial',
  'lineDashedMaterial',
  'points',
  'pointsMaterial',
  'torusGeometry',
  'cylinderGeometry',
  'sphereGeometry',
]

const r3fPropWarningKeywords = [
  'Invalid value for prop `raycast`',
  'React does not recognize the `curveRadius` prop',
  'React does not recognize the `maxWidth` prop',
  'React does not recognize the `lineHeight` prop',
  'React does not recognize the `textAlign` prop',
  'React does not recognize the `anchorX` prop',
  'React does not recognize the `anchorY` prop',
  'Received `true` for a non-boolean attribute `transparent`',
  'Received `true` for a non-boolean attribute `visible`',
  'React does not recognize the `vertexShader` prop',
  'React does not recognize the `fragmentShader` prop',
  'React does not recognize the `depthWrite` prop',
  'React does not recognize the `toneMapped` prop',
]

console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    r3fTags.some(
      (tag) =>
        msg.includes(`The tag <${tag}> is unrecognized in this browser`) ||
        msg.includes(`<${tag} /> is using incorrect casing`)
    ) ||
    r3fPropWarningKeywords.some((propWarning) => msg.includes(propWarning))
  ) {
    return
  }
  originalError(...args)
}

afterEach(() => {
  clearFrameRegistry()
  resetMockThreeState()
})
