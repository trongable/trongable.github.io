import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SceneContainer } from '@/features/scene/SceneContainer'
import {
  stepFrame,
  runFrames,
  currentThreeState,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('SceneContainer Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
    currentThreeState.pointer.x = 0
    currentThreeState.pointer.y = 0
    currentThreeState.camera.position.set(0, 2.55, 5.45)
  })

  describe('Canvas Rendering & Hierarchy', () => {
    it('renders scene container, Canvas, and child content', () => {
      // Given & When: rendering SceneContainer with a child
      render(
        <SceneContainer>
          <div data-testid="child-content">test child</div>
        </SceneContainer>
      )

      // Then: all wrapper components are in the document
      expect(screen.getByTestId('scene-container')).toBeInTheDocument()
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('applies glitch translation CSS class when isGlitching is true', () => {
      // Given & When: rendered with isGlitching = true
      render(
        <SceneContainer isGlitching={true}>
          <div>content</div>
        </SceneContainer>
      )

      // Then: micro-translation styling is applied
      const container = screen.getByTestId('scene-container')
      expect(container.className).toContain('translate-x-[1.5px]')
    })

    it('triggers onBackgroundClick when clicking the scene container background', () => {
      // Given: click spy
      const handleBackgroundClick = vi.fn()
      render(
        <SceneContainer onBackgroundClick={handleBackgroundClick}>
          <div>content</div>
        </SceneContainer>
      )

      // When: clicking container directly
      const container = screen.getByTestId('scene-container')
      container.click()

      // Then: background click callback is invoked
      expect(handleBackgroundClick).toHaveBeenCalledTimes(1)
    })

    it('sets Canvas data-frameloop to "demand" when isPaused is true', () => {
      // Given & When: rendering SceneContainer with isPaused = true
      render(
        <SceneContainer isPaused={true}>
          <div>content</div>
        </SceneContainer>
      )

      // Then: Canvas frameloop mode is "demand" for interactive on-demand slider scrubbing
      const canvas = screen.getByTestId('r3f-canvas')
      expect(canvas.getAttribute('data-frameloop')).toBe('demand')
    })

    it('sets Canvas data-frameloop to "never" when isSleeping is true', () => {
      // Given & When: rendering SceneContainer with isSleeping = true
      render(
        <SceneContainer isSleeping={true}>
          <div>content</div>
        </SceneContainer>
      )

      // Then: Canvas frameloop mode is "never"
      const canvas = screen.getByTestId('r3f-canvas')
      expect(canvas.getAttribute('data-frameloop')).toBe('never')
    })

    it('sets Canvas data-frameloop to "always" when uncapped and not paused', () => {
      // Given & When: rendering SceneContainer with targetFps = null
      render(
        <SceneContainer targetFps={null} isPaused={false} isSleeping={false}>
          <div>content</div>
        </SceneContainer>
      )

      // Then: Canvas frameloop mode is "always"
      const canvas = screen.getByTestId('r3f-canvas')
      expect(canvas.getAttribute('data-frameloop')).toBe('always')
    })

    it('sets Canvas data-frameloop to "demand" when targetFps is set and not paused', () => {
      // Given & When: rendering SceneContainer with targetFps = 60
      render(
        <SceneContainer targetFps={60} isPaused={false} isSleeping={false}>
          <div>content</div>
        </SceneContainer>
      )

      // Then: Canvas frameloop mode is "demand"
      const canvas = screen.getByTestId('r3f-canvas')
      expect(canvas.getAttribute('data-frameloop')).toBe('demand')
    })
  })

  describe('CameraController Damped Parallax & Convergence', () => {
    it('lerps camera position toward target angle when mouse pointer moves', () => {
      // Given: mounted SceneContainer
      render(
        <SceneContainer>
          <div>content</div>
        </SceneContainer>
      )

      // Initial camera position is at center [0, 2.55, 5.45]
      expect(currentThreeState.camera.position.x).toBe(0)

      // When: mouse moves to pointer x = 1.0, y = 1.0
      currentThreeState.pointer.x = 1.0
      currentThreeState.pointer.y = 1.0

      // And stepping frames to simulate camera parallax lerp
      act(() => {
        runFrames(10, 0.016)
      })

      // Then: camera position has moved toward targetX (1.0 * 0.35 = 0.35)
      expect(currentThreeState.camera.position.x).toBeGreaterThan(0)
      expect(currentThreeState.camera.position.x).toBeLessThanOrEqual(0.35)
    })

    it('halts camera recalculations once converged within EPSILON threshold', () => {
      // Given: mounted SceneContainer
      render(
        <SceneContainer>
          <div>content</div>
        </SceneContainer>
      )

      // When: running frames until convergence
      act(() => {
        runFrames(60, 0.016)
      })

      const settledX = currentThreeState.camera.position.x

      // And stepping an additional frame
      act(() => {
        stepFrame(0.016)
      })

      // Then: camera position remains stable
      expect(currentThreeState.camera.position.x).toBe(settledX)
    })

    it('positions and lerps camera at eye level (y ~ 0, z ~ 6.0) when cameraElevation="eye-level"', () => {
      // Given: SceneContainer with eye-level elevation starting from elevated camera
      currentThreeState.camera.position.set(0, 2.55, 5.45)
      const updateMatrixSpy = vi.spyOn(currentThreeState.camera, 'updateMatrixWorld')

      render(
        <SceneContainer cameraElevation="eye-level">
          <div>content</div>
        </SceneContainer>
      )

      // When: pointer is centered at (0, 0)
      currentThreeState.pointer.x = 0
      currentThreeState.pointer.y = 0

      act(() => {
        runFrames(100, 0.016)
      })

      // Then: camera converges toward Y = 0 and Z = 6.0, and updateMatrixWorld is called
      expect(currentThreeState.camera.position.y).toBeCloseTo(0, 1)
      expect(currentThreeState.camera.position.z).toBeCloseTo(6.0, 1)
      expect(updateMatrixSpy).toHaveBeenCalled()

      updateMatrixSpy.mockRestore()
    })

    it('positions and lerps camera at elevated angle (y ~ 2.55, z ~ 5.45) when cameraElevation="elevated"', () => {
      // Given: SceneContainer with elevated elevation starting from eye-level camera
      currentThreeState.camera.position.set(0, 0, 6.0)
      const updateMatrixSpy = vi.spyOn(currentThreeState.camera, 'updateMatrixWorld')

      render(
        <SceneContainer cameraElevation="elevated">
          <div>content</div>
        </SceneContainer>
      )

      // When: pointer is centered at (0, 0)
      currentThreeState.pointer.x = 0
      currentThreeState.pointer.y = 0

      act(() => {
        runFrames(100, 0.016)
      })

      // Then: camera converges toward Y = 2.55 and Z = 5.45
      expect(currentThreeState.camera.position.y).toBeCloseTo(2.55, 1)
      expect(currentThreeState.camera.position.z).toBeCloseTo(5.45, 1)
      expect(updateMatrixSpy).toHaveBeenCalled()

      updateMatrixSpy.mockRestore()
    })

    it('positions camera along spherical orbit from yaw, pitch, and distance when isPaused is true', () => {
      // Given: SceneContainer paused with yaw=90°, pitch=0°, distance=6.0
      currentThreeState.camera.position.set(0, 0, 0)
      const updateMatrixSpy = vi.spyOn(currentThreeState.camera, 'updateMatrixWorld')

      render(
        <SceneContainer
          isPaused={true}
          cameraAngles={{ yaw: 90, pitch: 0, distance: 6.0 }}
        >
          <div>content</div>
        </SceneContainer>
      )

      // When: stepping 1 frame on demand
      act(() => {
        stepFrame(0.016)
      })

      // Then: camera is positioned at (X=6.0, Y=0, Z=0)
      expect(currentThreeState.camera.position.x).toBeCloseTo(6.0, 2)
      expect(currentThreeState.camera.position.y).toBeCloseTo(0, 2)
      expect(currentThreeState.camera.position.z).toBeCloseTo(0, 2)
      expect(updateMatrixSpy).toHaveBeenCalled()

      updateMatrixSpy.mockRestore()
    })

    it('positions camera at birds-eye top down angle when pitch is 85°', () => {
      // Given: SceneContainer paused with yaw=0°, pitch=85°, distance=6.0
      render(
        <SceneContainer
          isPaused={true}
          cameraAngles={{ yaw: 0, pitch: 85, distance: 6.0 }}
        >
          <div>content</div>
        </SceneContainer>
      )

      act(() => {
        stepFrame(0.016)
      })

      // Y = 6.0 * sin(85°) ~ 5.977, Z = 6.0 * cos(85°) ~ 0.523
      expect(currentThreeState.camera.position.x).toBeCloseTo(0, 2)
      expect(currentThreeState.camera.position.y).toBeCloseTo(5.98, 1)
      expect(currentThreeState.camera.position.z).toBeCloseTo(0.52, 1)
    })
  })
})
