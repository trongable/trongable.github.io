import React from 'react'
import * as THREE from 'three'

export interface MockThreeState {
  camera: THREE.PerspectiveCamera
  pointer: { x: number; y: number }
  viewport: { width: number; height: number; factor: number; distance: number; aspect: number }
  scene: THREE.Scene
  invalidate: () => void
}

export type FrameCallback = (state: MockThreeState, delta: number) => void

const frameRegistry = new Set<FrameCallback>()

export function createMockThreeState(): MockThreeState {
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1000)
  camera.position.set(0, 2.55, 5.45)
  camera.lookAt(0, 0, 0)

  return {
    camera,
    pointer: { x: 0, y: 0 },
    viewport: { width: 10, height: 10, factor: 1, distance: 5.45, aspect: 1 },
    scene: new THREE.Scene(),
    invalidate: () => {},
  }
}

export let currentThreeState: MockThreeState = createMockThreeState()

export function setMockThreeState(partial: Partial<MockThreeState>) {
  currentThreeState = { ...currentThreeState, ...partial }
}

export function resetMockThreeState() {
  currentThreeState = createMockThreeState()
}

export function registerFrameCallback(cb: FrameCallback): () => void {
  frameRegistry.add(cb)
  return () => {
    frameRegistry.delete(cb)
  }
}

export function stepFrame(delta = 0.016, customState?: Partial<MockThreeState>) {
  const state = customState ? { ...currentThreeState, ...customState } : currentThreeState
  frameRegistry.forEach((cb) => {
    cb(state, delta)
  })
}

export function runFrames(count: number, delta = 0.016, customState?: Partial<MockThreeState>) {
  for (let i = 0; i < count; i++) {
    stepFrame(delta, customState)
  }
}

export function clearFrameRegistry() {
  frameRegistry.clear()
}

export function getFrameCallbackCount(): number {
  return frameRegistry.size
}

/**
 * Augments HTMLElement prototype so DOM elements created for Three/R3F JSX tags
 * in jsdom behave like THREE.Object3D / THREE.Material / THREE.BufferGeometry instances.
 */
export function installThreeElementMock() {
  if (typeof window === 'undefined') return
  const proto = HTMLElement.prototype as any
  if (proto.__r3fMockInstalled) return
  proto.__r3fMockInstalled = true

  Object.defineProperty(proto, 'position', {
    get() {
      if (!this._mockPosition) {
        this._mockPosition = new THREE.Vector3()
      }
      return this._mockPosition
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'rotation', {
    get() {
      if (!this._mockRotation) {
        this._mockRotation = new THREE.Euler()
      }
      return this._mockRotation
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'scale', {
    get() {
      if (!this._mockScale) {
        this._mockScale = new THREE.Vector3(1, 1, 1)
      }
      return this._mockScale
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'color', {
    get() {
      if (!this._mockColor) {
        this._mockColor = new THREE.Color('#ffffff')
      }
      return this._mockColor
    },
    set(val: any) {
      if (typeof val === 'string' || typeof val === 'number') {
        this.color.set(val)
      } else if (val && typeof val.copy === 'function') {
        this.color.copy(val)
      }
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'opacity', {
    get() {
      return this._mockOpacity !== undefined ? this._mockOpacity : 1
    },
    set(v: number) {
      this._mockOpacity = v
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'fillOpacity', {
    get() {
      return this._mockFillOpacity !== undefined ? this._mockFillOpacity : 1
    },
    set(v: number) {
      this._mockFillOpacity = v
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'material', {
    get() {
      if (!this._mockMaterial) {
        this._mockMaterial = {
          color: new THREE.Color('#ffffff'),
          opacity: 1,
          toneMapped: false,
          dispose: () => {},
        }
      }
      return this._mockMaterial
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'geometry', {
    get() {
      if (!this._mockGeometry) {
        this._mockGeometry = {
          attributes: {
            position: { array: new Float32Array(600), needsUpdate: false },
            color: { array: new Float32Array(600), needsUpdate: false },
          },
          dispose: () => {},
        }
      }
      return this._mockGeometry
    },
    configurable: true,
  })

  Object.defineProperty(proto, 'attributes', {
    get() {
      if (!this._mockAttributes) {
        this._mockAttributes = {
          position: { array: new Float32Array(600), needsUpdate: false },
          color: { array: new Float32Array(600), needsUpdate: false },
        }
      }
      return this._mockAttributes
    },
    configurable: true,
  })

  proto.getWorldPosition = function (target: THREE.Vector3) {
    if (!target) return this.position
    return target.copy(this.position)
  }

  Object.defineProperty(proto, 'text', {
    get() {
      return this._mockText !== undefined ? this._mockText : this.textContent
    },
    set(v: string) {
      this._mockText = v
      this.textContent = v
    },
    configurable: true,
  })

  proto.computeLineDistances = function () {}
  proto.sync = function () {
    if (this._mockText !== undefined) {
      this.textContent = this._mockText
    }
  }
  proto.dispose = function () {}
}

installThreeElementMock()

/**
 * Standard Drei component mocks for jsdom unit tests
 */
export const MockDreiBillboard: React.FC<{ children: React.ReactNode; [key: string]: any }> = ({
  children,
  onClick,
  onPointerOver,
  onPointerOut,
  ...props
}) => (
  <div
    data-testid="billboard"
    onClick={onClick}
    onMouseEnter={onPointerOver}
    onMouseLeave={onPointerOut}
    {...props}
  >
    {children}
  </div>
)

export const MockDreiText = React.forwardRef<
  HTMLSpanElement,
  {
    children: React.ReactNode
    onClick?: (e: any) => void
    onPointerOver?: (e: any) => void
    onPointerOut?: (e: any) => void
    onSync?: (troika: any) => void
    [key: string]: any
  }
>(({ children, onClick, onPointerOver, onPointerOut, onSync, ...props }, ref) => {
  React.useEffect(() => {
    if (onSync) {
      onSync({ geometry: { boundingBox: { min: { x: 0 }, max: { x: 0.5 } } } })
    }
  }, [onSync])

  return (
    <span
      ref={ref}
      data-testid="badge-text"
      onClick={onClick}
      onMouseEnter={onPointerOver}
      onMouseLeave={onPointerOut}
      {...props}
    >
      {children}
    </span>
  )
})
MockDreiText.displayName = 'MockDreiText'
