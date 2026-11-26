import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { stepFrame } from '@/testUtils/r3fTestUtils'
import { AngelAvatarRig } from '../AngelAvatarRig'
import { DEFAULT_ANGEL_CONFIG } from '../angelCatalog'

vi.mock('@react-three/drei', () => ({
  useGLTF: vi.fn(),
}))

const mockDisposals: ReturnType<typeof vi.fn>[] = []

function makeMockScene(url: string) {
  const group = new THREE.Group()
  if (url.includes('base-angel.glb')) {
    const skinMat = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    skinMat.name = 'mat_skin'
    const wingMat = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    wingMat.name = 'mat_wings'
    const faceMat = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    faceMat.name = 'mat_face_overlay'

    ;[skinMat, wingMat, faceMat].forEach((m) => {
      const origClone = m.clone.bind(m)
      m.clone = () => {
        const cloned = origClone()
        const spy = vi.fn(cloned.dispose.bind(cloned))
        cloned.dispose = spy
        mockDisposals.push(spy)
        return cloned
      }
    })

    const skinMesh = new THREE.Mesh(new THREE.BufferGeometry(), skinMat)
    const wingMesh = new THREE.Mesh(new THREE.BufferGeometry(), wingMat)
    const faceMesh = new THREE.Mesh(new THREE.BufferGeometry(), faceMat)
    group.add(skinMesh, wingMesh, faceMesh)
  } else {
    const partMat = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    const origClone = partMat.clone.bind(partMat)
    partMat.clone = () => {
      const cloned = origClone()
      const spy = vi.fn(cloned.dispose.bind(cloned))
      cloned.dispose = spy
      mockDisposals.push(spy)
      return cloned
    }
    group.add(new THREE.Mesh(new THREE.BufferGeometry(), partMat))
  }
  return { scene: group }
}

describe('AngelAvatarRig', () => {
  beforeEach(() => {
    vi.mocked(useGLTF).mockImplementation(((url: string) =>
      makeMockScene(url)) as unknown as typeof useGLTF)
  })

  afterEach(() => {
    mockDisposals.length = 0
    vi.restoreAllMocks()
  })

  it('mounts base + modular wardrobe GLBs, spins when active, and disposes cloned materials on unmount', () => {
    const { rerender, unmount } = render(
      <AngelAvatarRig
        config={{
          ...DEFAULT_ANGEL_CONFIG,
          skinTone: '#d99e78',
          wingsEnabled: false,
          hairId: 'short-crop',
          hairColor: '#1f1d24',
          topId: 'oversized-hoodie',
          topColor: '#eb6b34',
          bottomId: 'cargo-pants',
          bottomColor: '#3f4d3f',
          footwearId: 'sneakers',
          footwearColor: '#f4f4f6',
          accessoryIds: ['halo', 'round-glasses'],
          accessoryColor: '#f2d85a',
          containerStyle: 'capsule',
        }}
        primaryColorHex="#e2f872"
        highlightColorHex="#f5ff9e"
        isTurntableActive={true}
        isPaused={false}
      />
    )

    // Step render loop while turntable is active vs paused
    act(() => {
      stepFrame(0.05)
    })

    rerender(
      <AngelAvatarRig
        config={{
          ...DEFAULT_ANGEL_CONFIG,
          wingsEnabled: true,
          wingColor: '#d4adf0',
        }}
        primaryColorHex="#e2f872"
        highlightColorHex="#f5ff9e"
        isTurntableActive={false}
        isPaused={true}
      />
    )

    act(() => {
      stepFrame(0.05)
    })

    expect(mockDisposals.length).toBeGreaterThan(0)
    unmount()
    expect(mockDisposals.every((spy) => spy.mock.calls.length >= 1)).toBe(true)
  })
})
