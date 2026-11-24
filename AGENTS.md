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
   - `GpuGlitchOverlay.tsx` geometry must remain strictly orthogonal (100% $90^\circ$ right angles; zero diagonals/trapezoids).
   - Glitch effects must remain disabled when `prefers-reduced-motion: reduce` is active.
   - Keep `Tuner.tsx` at `z-[60]` so it stays interactive during glitch bursts.
5. **Mobile & Touch**: Keep `min-h-dvh`, `overscroll-behavior: none`, and `touch-action: none` on `SceneContainer` so touch drag raycasting works without scroll hijacking.
6. **Code Conventions**:
   - Use `@/` path aliases for all imports into `src/` (e.g., `import { useTheme } from '@/context/ThemeContext'`).
   - Preserve the minimalist cyber aesthetic; avoid superfluous marketing copy.
   - Keep `vite.config.ts` vendor chunks (`vendor-three`, `vendor-react`) and `index.html` font preloads intact.

---

## Testing Conventions

- **Unit & Component Tests**: Co-locate in `<feature>/__tests__/`. Add tests for every new feature, topology, or route.
- **`vmThreads` Hygiene**: Because Vitest runs in `vmThreads`, always restore mocked globals, timers, and DOM state in `afterEach` and reuse existing R3F mock patterns in `vitest.setup.ts`.
- **Deterministic Playwright E2E**: Use URL state params (`?paused=true&geo=<mode>&yaw=0&pitch=0`) to freeze and position 3D scenes deterministically instead of adding arbitrary timeouts.

---

## Architecture & Subsystem Pointers (Read Before Editing)

- **Core Layout**: `src/routes/Router.tsx` (pushState + hash fallback + URL query sync), `src/context/ThemeContext.tsx` (Volt Yellow `#e2f872` default, Purple `#d4adf0`, Teal `#83d4d4` via `--theme-primary` / `--theme-highlight`), `src/components/canvas/geometries/` (8 topologies dispatched by `GeometryDispatcher.tsx` via `geometryConfig.ts`), `src/pages/` (`/`, `/about`, `/more`, `/sonny`, `/videos`, plus external `dchc` at `https://dc-hardcore.com`).

| If you are modifying… | Read first |
| :--- | :--- |
| Topologies, math models (`halo`, `trefoil`, `astrolabe`, `lorenz`, `origami`, `slingshot`, `helix`) | `docs/chronicles/01-procedural-topologies-and-manifolds.md` |
| Mobile viewport, touch raycasting, hit targets | `docs/chronicles/02-mobile-touch-and-viewport-architecture.md` |
| Glitch VFX, orthogonality, memory photos (`GpuGlitchOverlay.tsx`) | `docs/chronicles/03-cyber-gpu-glitch-vfx-and-memory-corruption.md` |
| Theme palettes, luminance math, Tuner HUD (`Tuner.tsx`) | `docs/tuner-manual.md` & `docs/chronicles/04-dynamic-theming-color-science-and-tuner-hud.md` |
| `useFrame` performance, GPU sleep, DPR scaling, memory | `docs/chronicles/05-zero-allocation-and-energy-governance.md` |
| Sonny 3D containers (`capsule`, `diorama`, `pedestal`, `wirebox`, `crystal`, `none`) & turntable | `docs/chronicles/06-sonny-3d-containers-and-turntable-animation.md` |
| Perspective scaling & depth sorting | `docs/chronicles/07-pure-optical-perspective-scaling.md` |
| 4D Tesseract projection & Clifford quad (`[13, 7, 10, 0]`) | `docs/chronicles/08-tesseract-4d-degeneracy-and-clifford-quad.md` |
| Telemetry HUD, XYZ coordinates, camera elevation/orbit | `docs/chronicles/09-realtime-3d-telemetry-hud-and-coordinates.md` |
| Overall repo docs & architecture diagram | `docs/README.md` |

---

## Multi-File Checklists

### Adding a New 3D Menu Link & Route
1. *(Optional)* Add image asset to `public/images/<name>.png` (or flipbook frames to `public/images/<name>/frame-01.png`…).
2. Register the item (`label`, `path`, optional `imageUrl`) in `HaloMenuRing.tsx` and the other topology menus.
3. Add the path to `RoutePath` in `src/routes/Router.tsx`.
4. Create `src/pages/<Name>Page.tsx` (using `useRouter()` and `← home` back button) and wire the `case` in `src/App.tsx`.
5. Add an accessible `<button>` to `<nav className="sr-only">` in `src/pages/HomePage.tsx`.
6. Add `src/pages/__tests__/<Name>Page.test.tsx` and update `Routing.test.tsx`.

### Adding a Glitch Memory Photo
1. Add the JPG/PNG to `public/images/glitch/` or `public/images/`.
2. Append its public path to `GLITCH_MEMORY_IMAGES` in `src/components/effects/GpuGlitchOverlay.tsx`.
3. Verify the test in `src/components/effects/__tests__/GpuGlitchOverlay.test.tsx` covers `GLITCH_MEMORY_IMAGES`.
