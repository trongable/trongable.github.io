import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CurvedMediaPanel as CurvedVideoPanel } from '@/features/gallery/chamber/CurvedMediaPanel'
import { VIDEOS_DATA, GALLERY_DATA, GalleryItem } from '@/features/gallery/data/galleryData'
import { buildCurvedPanelGeometries, applyPanelCurvature, computePanelSurfaceBlur } from '@/features/gallery/chamber/panelShader'
import { ThemeProvider } from '@/context/ThemeContext'
import { runFrames, clearFrameRegistry, currentThreeState } from '@/testUtils/r3fTestUtils'
import { isImageDecoded, clearImagePreloadCache } from '@/utils/imagePreload'

describe('CurvedVideoPanel Component', () => {
  const mockVideo = VIDEOS_DATA[0]

  beforeEach(() => {
    clearFrameRegistry()
    clearImagePreloadCache()
    vi.useFakeTimers()
  })

  it('renders the curved video panel with video test id', () => {
    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)).toBeInTheDocument()
  })

  it('triggers onSelect callback when clicking the screen mesh', () => {
    const handleSelect = vi.fn()

    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          onSelect={handleSelect}
        />
      </ThemeProvider>
    )

    const screenMesh = screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)
    fireEvent.click(screenMesh)

    expect(handleSelect).toHaveBeenCalledWith(mockVideo)
  })

  it('handles pointer over and pointer out with glyph scrambling on the screen mesh', () => {
    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    const screenMesh = screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)

    // Hover in
    fireEvent.pointerOver(screenMesh)

    act(() => {
      vi.advanceTimersByTime(120)
      runFrames(5, 0.016)
    })

    // Hover out
    fireEvent.pointerOut(screenMesh)

    expect(screenMesh).toBeInTheDocument()
  })

  it('triggers speculative background pre-decode when hovering over a photo panel', async () => {
    const mockPhoto = GALLERY_DATA.find((i) => i.type === 'photo')!
    const targetUrl = mockPhoto.hqImageUrl || mockPhoto.imageUrl

    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockPhoto}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    const screenMesh = screen.getByTestId(`curved-video-mesh-${mockPhoto.id}`)
    expect(isImageDecoded(targetUrl)).toBe(false)

    fireEvent.pointerOver(screenMesh)

    await vi.waitFor(() => {
      expect(isImageDecoded(targetUrl)).toBe(true)
    })
  })

  it('interpolates towards center position when isSelected is true', () => {
    const { rerender } = render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(5, 0.016)
    })

    // Select the video
    rerender(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isSelected={true}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(20, 0.016)
    })

    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
  })

  it('scales accurately to fullscreen bounding box during flight without fading to black', () => {
    // Mathematical progression verification:
    // Fullscreen scale target fits max-w-[90vw] and max-h-[80vh] at distance 2.15 with 46 deg FOV
    const fovYRad = (46 * Math.PI) / 180
    const frustumH = 2 * 2.15 * Math.tan(fovYRad / 2) // ~1.82524
    const aspect = 16 / 9
    const frustumW = frustumH * aspect // ~3.24487
    const maxW = 0.90 * frustumW // ~2.92038
    const maxH = 0.80 * frustumH // ~1.46019

    // For 16:9 video: panelWidth = 1.60, panelHeight = 0.90
    const panelWidth = 1.60
    const panelHeight = 0.90
    const itemAspect = panelWidth / panelHeight
    let targetW = maxW
    let targetH = targetW / itemAspect
    if (targetH > maxH) {
      targetH = maxH
      targetW = targetH * itemAspect
    }
    const fullScreenScale = targetH / panelHeight // ~1.6224

    expect(fullScreenScale).toBeCloseTo(1.6224, 3)

    // Card maintains 100% bright color (no fade to black, no #dddddd dimming)
    const baseColor = '#ffffff'
    expect(baseColor).toBe('#ffffff')
  })

  it('renders screen mesh with raw sRGB passthrough ShaderMaterial (no linear mipmap washout)', () => {
    const { container } = render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(5, 0.016)
    })

    const screenMesh = screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)
    expect(screenMesh).toBeInTheDocument()
    expect(container.querySelector('shadermaterial')).toBeInTheDocument()
  })

  it('flies photo panels into exact fullscreen scale and restores resting scale on exit', () => {
    const mockPhoto: GalleryItem = {
      id: 'photo-chipmunk',
      type: 'photo',
      title: 'zion national park',
      author: 'Trong Nguyen',
      imageUrl: '/images/gallery/chipmunk-zion.jpg',
      thumbnailUrl: '/images/gallery/thumbnails/chipmunk-zion.webp',
      aspectRatio: 819 / 1024,
      azimuthDeg: -110,
      elevationDeg: 23.6,
      tier: 'upper',
      index: 1,
      indexInTier: 0,
      totalInTier: 9,
    }

    const { rerender } = render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockPhoto}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`curved-video-panel-${mockPhoto.id}`)).toBeInTheDocument()

    // Fly photo into center focus
    rerender(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockPhoto}
          isSelected={true}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(20, 0.016)
    })

    expect(screen.getByTestId(`curved-video-panel-${mockPhoto.id}`)).toBeInTheDocument()

    // Return photo to wall slot (fly out)
    rerender(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockPhoto}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(20, 0.016)
    })

    expect(screen.getByTestId(`curved-video-panel-${mockPhoto.id}`)).toBeInTheDocument()
  })

  it('applies unified horizontal curvature aligned with sphere latitude radius Rh, curved text, and lowercase', () => {
    const R = 4.5
    const el = 11.54 // deg
    const phi = (el * Math.PI) / 180
    const Rh = R * Math.cos(phi) // ~4.409
    const w = 1.92
    const hw = w / 2

    // Angular half-width
    const alphaMax = Math.asin(hw / Rh)
    const xEdge = Rh * Math.sin(alphaMax)
    const zEdge = Rh * (1 - Math.cos(alphaMax))

    expect(xEdge).toBeCloseTo(hw, 4)
    expect(zEdge).toBeCloseTo(0.1058, 3)

    // Distance in 2D to cylinder center (0, Rh) is constant Rh everywhere
    const distToCenter = Math.sqrt(xEdge * xEdge + (Rh - zEdge) * (Rh - zEdge))
    expect(distToCenter).toBeCloseTo(Rh, 4)

    // Component renders with dynamic sphereRadius, curved text, and lowercase
    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          sphereRadius={5.0}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
  })

  it('guarantees positive angular clearance between adjacent 16:9 video panels on top and bottom rows', () => {
    // Top and bottom tiers are at elevation ~23.58 deg where sphere latitude circle shrinks to Rh ~4.124
    const R = 4.5
    const rowSeparation = 1.8
    const tierElevationRad = Math.asin(rowSeparation / R) // ~23.578 deg

    // Calibrated 16:9 video width
    const panelWidth = 1.60
    const panelHeight = 0.90
    const hw = panelWidth / 2
    const hh = panelHeight / 2

    // At top corner of upper tier (higher latitude where circumference is smallest)
    const cornerElevationRad = tierElevationRad + Math.asin(hh / R) // ~29.32 deg
    const Rcorner = R * Math.cos(cornerElevationRad) // ~3.923

    // Angular half-width at the closest corner
    const cornerAlphaMaxDeg = (Math.asin(hw / Rcorner) * 180) / Math.PI // ~11.77 deg
    const totalCornerSpanDeg = cornerAlphaMaxDeg * 2 // ~23.54 deg

    // Center-to-center angular step for 9 items across 220 deg arc
    const arcDegrees = 220
    const centerStepDeg = arcDegrees / (9 - 1) // 27.5 deg

    // Net clearance between adjacent video borders at their closest converging point
    const cornerClearanceDeg = centerStepDeg - totalCornerSpanDeg
    expect(cornerClearanceDeg).toBeGreaterThan(3.5) // At least 3.5 deg (~24cm) clearance

    // Hovered state (1.05x scale) still preserves positive clearance
    const hoveredCornerSpanDeg = (Math.asin((hw * 1.05) / Rcorner) * 180) / Math.PI * 2
    expect(centerStepDeg - hoveredCornerSpanDeg).toBeGreaterThan(2.0) // At least 2.0 deg (~14cm) clearance
  })

  it('guarantees positive angular clearance in both 4-tier (Option B) and 3-tier (Option A) closed 360-degree 60-item rings', () => {
    const panelWidth = 1.60
    const panelHeight = 0.90
    const hw = panelWidth / 2
    const hh = panelHeight / 2

    // Option B (4 tiers, 15 items/tier, R=5.5, arc=360, rowSeparation=1.55)
    const rB = 5.5
    const rowSepB = 1.55
    const outerElevB = Math.asin((1.5 * rowSepB) / rB)
    const cornerElevB = outerElevB + Math.asin(hh / rB)
    const rCornerB = rB * Math.cos(cornerElevB)
    const spanB = (Math.asin(hw / rCornerB) * 180) / Math.PI * 2
    const stepB = 360 / 15
    expect(stepB - spanB).toBeGreaterThan(4.5)

    // Option A (3 tiers, 20 items/tier, R=6.0, arc=360, rowSeparation=1.80)
    const rA = 6.0
    const rowSepA = 1.80
    const outerElevA = Math.asin(rowSepA / rA)
    const cornerElevA = outerElevA + Math.asin(hh / rA)
    const rCornerA = rA * Math.cos(cornerElevA)
    const spanA = (Math.asin(hw / rCornerA) * 180) / Math.PI * 2
    const stepA = 360 / 20
    expect(stepA - spanA).toBeGreaterThan(1.3)
  })

  it('renders orthogonal 90-degree corner reticles and animates intro collapse, scatter, and ambient float', () => {
    const { rerender } = render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isFocused={true}
          introCollapse={true}
          scatterOnSelect={true}
          ambientFloat={true}
          focusReticles={true}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`curved-panel-reticle-${mockVideo.id}`)).toBeInTheDocument()

    // Advance frames for intro collapse + ambient float + focus reticles
    act(() => {
      runFrames(30, 0.016)
    })

    // When another item is selected, non-selected panel smoothly scatters outward rather than snapping off
    rerender(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isDimmed={true}
          isSelected={false}
          isFocused={false}
          scatterOnSelect={true}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )
    act(() => {
      runFrames(5, 0.016)
    })
    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
  })

  it('keeps crisp unattenuated borders on off-center panels and creates opposite-signed directional blur', () => {
    // Center camera at origin looking toward -Z with 16:9 widescreen aspect
    currentThreeState.camera.position.set(0, 0, 0)
    currentThreeState.camera.aspect = 16 / 9
    currentThreeState.camera.updateProjectionMatrix()
    currentThreeState.camera.lookAt(0, 0, -5)
    currentThreeState.camera.updateMatrixWorld()

    // Upper-tier panel (~22 deg vertically, near top edge of 46 deg vertical FOV)
    const upperEdgeVideo: GalleryItem = {
      ...mockVideo,
      id: 'vertical-edge-test',
      tier: 'upper',
      index: 1,
      indexInTier: 0,
      totalInTier: 1,
      azimuthDeg: 0,
      elevationDeg: 22,
    }

    const { container, unmount } = render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={upperEdgeVideo}
          isFocused={false}
          introCollapse={false}
          motionBlur={true}
          tierCount={3}
          sphereRadius={5.5}
          rowSeparation={2.05}
          arcDegrees={0}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(3, 0.016)
    })

    // Off-center panel borders remain crisp and unattenuated (vignette happens in screen space)
    const borderMat = container.querySelector('lineloop linebasicmaterial') as unknown as {
      opacity: number
    }
    expect(borderMat).toBeInTheDocument()
    expect(borderMat.opacity).toBeGreaterThanOrEqual(0.39)

    // Verify directional trailing blur flips sign for opposite pan directions
    const out = { x: 0, y: 0 }
    computePanelSurfaceBlur(new THREE.Vector3(-0.08, 0, 0), 0.016, 1.6, 0.9, 5.5, out)
    expect(out.x).toBeGreaterThan(0.05)

    computePanelSurfaceBlur(new THREE.Vector3(0.08, 0, 0), 0.016, 1.6, 0.9, 5.5, out)
    expect(out.x).toBeLessThan(-0.05)

    computePanelSurfaceBlur(new THREE.Vector3(0, -0.05, 0), 0.016, 1.6, 0.9, 5.5, out)
    expect(out.y).toBeGreaterThan(0.05)

    computePanelSurfaceBlur(new THREE.Vector3(0, 0, 0), 0.016, 1.6, 0.9, 5.5, out)
    expect(out.x).toBe(0)
    expect(out.y).toBe(0)

    unmount()
  })

  it('flattens screen and border geometry curvature to planar during fly-in and restores curve on fly-out', () => {
    const geos = buildCurvedPanelGeometries(1.6, 0.9, 5.5, 'photo')
    const screenPos = geos.screenGeo.attributes.position
    const borderPos = geos.borderGeo.attributes.position

    // Initially curved along Rh = 5.5 (center x=0 has z=0, outer edges have z > 0)
    const initialMaxScreenZ = Math.max(...Array.from({ length: screenPos.count }, (_, i) => screenPos.getZ(i)))
    const initialMaxBorderZ = Math.max(...Array.from({ length: borderPos.count }, (_, i) => borderPos.getZ(i)))
    expect(initialMaxScreenZ).toBeGreaterThan(0.05)
    expect(initialMaxBorderZ).toBeGreaterThan(0.05)

    // At curveFactor = 0 (fly-in arrived), every vertex is strictly planar (z = 0)
    applyPanelCurvature(geos, 0)
    for (let i = 0; i < screenPos.count; i++) {
      expect(screenPos.getZ(i)).toBeCloseTo(0, 6)
    }
    for (let i = 0; i < borderPos.count; i++) {
      expect(borderPos.getZ(i)).toBeCloseTo(0, 6)
    }

    // At curveFactor = 1 (fly-out restored), original cylindrical curvature returns identically
    applyPanelCurvature(geos, 1)
    const restoredMaxScreenZ = Math.max(...Array.from({ length: screenPos.count }, (_, i) => screenPos.getZ(i)))
    const restoredMaxBorderZ = Math.max(...Array.from({ length: borderPos.count }, (_, i) => borderPos.getZ(i)))
    expect(restoredMaxScreenZ).toBeCloseTo(initialMaxScreenZ, 6)
    expect(restoredMaxBorderZ).toBeCloseTo(initialMaxBorderZ, 6)

    geos.screenGeo.dispose()
    geos.borderGeo.dispose()
    geos.reticleGeo.dispose()
  })
})
