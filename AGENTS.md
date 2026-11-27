# AGENTS.md

> Agent & developer guide for `trongable.github.io` (`https://trongngyn.com`) — a static React + R3F 3D mathematical geometry lab deployed to GitHub Pages via `.github/workflows/deploy.yml`.

## Stack & Verification Loop

- **Stack**: React 19, Vite 8 (Rolldown), React Three Fiber (R3F) v9, `@react-three/drei` v10, Three.js 0.187, Tailwind CSS v4, TypeScript 7, Oxlint, Vitest (`vmThreads`), Playwright CLI.
- **Always use the tiered verification loop** to minimize latency and console noise:

```bash
# Tier 1 — Inner loop while coding (<1.5s, fail-fast)
npm run test:fast -- <test-file>       # Single file with --bail=1
npm run test:related -- <source-file>  # Tests related to modified source file

# Tier 2 — Pre-completion gate (<4.5s, dot reporter, zero console spam)
npm run verify:agent                   # Oxlint + TypeScript 7 + full Vitest suite

# Pre-Push / CI Parity Gate (mirrors .github/workflows/deploy.yml)
npm run verify:ci                      # lint + typecheck + test:coverage + build (auto-run by .githooks/pre-push on master)

# Tier 3 — E2E WebGL verification (<4s single spec / ~20s full)
npm run e2e:agent -- e2e/<spec>        # Targeted Desktop Chromium runner

# Standard / CI Commands (use when explicitly requested)
npm run dev            # Local dev server
npm run lint           # Oxlint
npm run typecheck      # Strict TypeScript 7 check
npm run test:agent     # Full Vitest suite (vmThreads + dot reporter)
npm run test:coverage  # Vitest with V8 coverage & threshold gates
npm run test:e2e       # Full Playwright suite (Desktop + Mobile Chrome)
npm run build          # Production bundle (tsc + vite)
npm run preview        # Preview production build
npm run prepare        # Configure git core.hooksPath to .githooks
```

---

## Non-Negotiable Engineering Invariants

1. **Zero Allocations in `useFrame`**: Never allocate `THREE.Vector3`, arrays, or objects inside render loops. Mutate pre-allocated targets in-place (`project4D`, `stepLorenz`, `computeToroidalHelixPoint`, `computeKeplerPosition`, `getTrefoilPoint`).
2. **Explicit WebGL Disposal**: Every `BufferGeometry`, `Material`, or `CanvasTexture` created in `useMemo` must be disposed in a cleanup hook (`.dispose()`).
3. **Sleep & Energy Governance**:
   - Hidden tabs (`document.visibilityState === 'hidden'`) must set R3F `frameloop="never"` and pause glitch timers (0% GPU/CPU).
   - Collapsed geometries (`isExpanded === false` and scale `<= 0.051`) must skip all math and `needsUpdate = true` buffer writes.
   - Never throttle FPS artificially; manage energy via dynamic DPR scaling and always clamp `dpr` to `[1, 2]`.
   - Preserve idle guards (`isSettled` in `ParticleField.tsx`, `0.0002` epsilon in `CameraController`).
4. **Glitch VFX & Accessibility**:
   - `GpuGlitchOverlay.tsx` / `glitchGenerators.ts` geometry must remain strictly orthogonal (100% $90^\circ$ right angles; zero diagonals/trapezoids).
   - Glitch effects must remain disabled when `prefers-reduced-motion: reduce` is active.
   - Keep `Tuner.tsx` at `z-[60]` so it stays interactive during glitch bursts.
5. **Gallery Color & Rendering**:
   - `CerebroChamber.tsx` must keep `toneMapping: THREE.NoToneMapping`, and `CurvedMediaPanel.tsx` / `panelShader.ts` must keep their raw sRGB `ShaderMaterial` passthrough (`NoColorSpace` textures with `anisotropy` and `-0.75` LOD bias, `toneMapped={false}`) to prevent `GL_SRGB8_ALPHA8` linear-light mipmap contrast washout and match the 2D viewer 1:1.
   - Gallery WebP thumbnails must be sRGB-converted via `npm run gallery:thumbnails` (`scripts/generate-gallery-thumbnails.py`) so Display P3 photos do not wash out in WebGL.
6. **Mobile & Touch**: Keep `min-h-dvh`, `overscroll-behavior: none`, and `touch-action: none` on `SceneContainer` so touch drag raycasting works without scroll hijacking.
7. **Code Conventions**:
   - Use `@/` path aliases for all imports into `src/` (e.g., `import { useTheme } from '@/context/ThemeContext'`).
   - Preserve the minimalist cyber aesthetic; avoid superfluous marketing copy.
   - Keep `vite.config.ts` vendor chunks (`vendor-three`, `vendor-react`) and `index.html` font preloads intact.

---

## Testing Conventions

- **Unit & Component Tests**: Co-locate in `<feature>/__tests__/`. Add tests for every new feature, topology, or route.
- **`vmThreads` Hygiene**: Because Vitest runs in `vmThreads`, always restore mocked globals, timers, and DOM state in `afterEach`, reuse existing R3F/Drei mocks in `vitest.setup.ts` via `vi.mocked(...).mockImplementation(...)` in `beforeEach`, and never reference top-level variables or `importOriginal` inside hoisted `vi.mock(...)` factories.
- **Deterministic Playwright E2E**: Use URL state params (`?paused=true&geo=<mode>&yaw=0&pitch=0`) to freeze and position 3D scenes deterministically instead of adding arbitrary timeouts.

---

## Architecture & Subsystem Pointers (Read Before Editing)

- **Core Layout**: `src/routes/Router.tsx` (pushState + hash fallback + URL query sync), `src/context/ThemeContext.tsx` (Volt Yellow `#e2f872` default, Purple `#d4adf0`, Teal `#83d4d4` via `--theme-primary` / `--theme-highlight`), `src/features/scene/` (`SceneContainer.tsx`, `CameraController.tsx`, `ParticleField.tsx`, `FrameGovernor.tsx`), `src/features/topologies/` (8 topologies dispatched by `GeometryDispatcher.tsx` via `config/geometryConfig.ts`, pure math in `math/`, badges in `badge/`), `src/features/gallery/` (`chamber/CerebroChamber.tsx`, `chamber/CurvedMediaPanel.tsx`, `theater/GalleryTheaterOverlay.tsx`, `data/galleryCatalog.ts`, `data/galleryLayout.ts`, `data/galleryTunerConfig.ts`), `src/features/angel/` (`AngelContainerContext.tsx`, `AngelContainers.tsx`, `AngelStudioCanvas.tsx`, `AngelCustomizerPanel.tsx`), `src/features/tuner/` (`Tuner.tsx`, `TunerContext.tsx`, `CyberTerminalLine.tsx`), `src/features/effects/` (`GpuGlitchOverlay.tsx`, `glitchGenerators.ts`), `src/pages/` (`/`, `/about`, `/more`, `/angel`, `/gallery`, `/ui-catalog` via `ui-catalog` terminal command, plus external `dchc` at `https://dc-hardcore.com`).

| If you are modifying… | Read first |
| :--- | :--- |
| Topologies, math models (`halo`, `trefoil`, `astrolabe`, `lorenz`, `origami`, `slingshot`, `helix`) | `docs/chronicles/01-procedural-topologies-and-manifolds.md` |
| Mobile viewport, touch raycasting, hit targets | `docs/chronicles/02-mobile-touch-and-viewport-architecture.md` |
| Glitch VFX, orthogonality, memory photos (`GpuGlitchOverlay.tsx`) | `docs/chronicles/03-cyber-gpu-glitch-vfx-and-memory-corruption.md` |
| Theme palettes, luminance math, Tuner HUD (`Tuner.tsx`) | `docs/tuner-manual.md` & `docs/chronicles/04-dynamic-theming-color-science-and-tuner-hud.md` |
| `useFrame` performance, GPU sleep, DPR scaling, memory | `docs/chronicles/05-zero-allocation-and-energy-governance.md` |
| Angel 3D containers (`capsule`, `diorama`, `pedestal`, `wirebox`, `crystal`, `none`) & turntable | `docs/chronicles/06-sonny-3d-containers-and-turntable-animation.md` |
| Perspective scaling & depth sorting | `docs/chronicles/07-pure-optical-perspective-scaling.md` |
| 4D Tesseract projection & Clifford quad (`[13, 7, 10, 0]`) | `docs/chronicles/08-tesseract-4d-degeneracy-and-clifford-quad.md` |
| Telemetry HUD, XYZ coordinates, camera elevation/orbit | `docs/chronicles/09-realtime-3d-telemetry-hud-and-coordinates.md` |
| Overall repo docs & architecture diagram | `docs/README.md` |

---

## Multi-File Checklists

### Adding a New 3D Menu Link & Route
1. *(Optional)* Add image asset to `public/images/<name>.png` (or flipbook frames to `public/images/<name>/frame-01.png`…).
2. Register the item (`label`, `path`, optional `imageUrl`) in `src/features/topologies/config/menuItems.ts` (`MENU_ITEMS`) and add any topology-specific metadata (`AstrolabeMenu.tsx`, `LorenzMenu.tsx`, `OrigamiMenu.tsx`, `SlingshotMenu.tsx`, `TesseractMenu.tsx` in `src/features/topologies/menus/`).
3. Add the path to `RoutePath` in `src/routes/Router.tsx`.
4. Create `src/pages/<Name>Page.tsx` (using `useRouter()` and `← home` back button) and wire the `case` in `src/App.tsx`.
5. Add an accessible `<button>` to `<nav className="sr-only">` in `src/pages/home/HomeScreenReaderNav.tsx`.
6. Add `src/pages/__tests__/<Name>Page.test.tsx` and update `Routing.test.tsx`.

### Adding a Glitch Memory Photo
1. Add the JPG/PNG to `public/images/glitch/` or `public/images/`.
2. Append its public path to `GLITCH_MEMORY_IMAGES` in `src/features/effects/GpuGlitchOverlay.tsx`.
3. Verify the test in `src/features/effects/__tests__/GpuGlitchOverlay.test.tsx` covers `GLITCH_MEMORY_IMAGES`.

### Adding a Gallery Photo
1. Drop the full-resolution `.jpg` into `public/images/gallery/<slug>.jpg`.
2. Run `npm run gallery:thumbnails` (`python scripts/generate-gallery-thumbnails.py`) to generate the sRGB 640px WebP thumbnail in `public/images/gallery/thumbnails/<slug>.webp` and print the `aspectRatio` snippet.
3. Append the item (`id`, `type: 'photo'`, lowercase `title`, `author`, `imageUrl`, `hqImageUrl`, `aspectRatio`) to `RAW_GALLERY_DATA` in `src/features/gallery/data/galleryCatalog.ts` (`layoutGalleryTiers` in `galleryLayout.ts` distributes items across the spherical tiers automatically).
4. Update the total item count assertions in `src/features/gallery/__tests__/galleryData.test.ts` and `e2e/gallery.spec.ts`.
