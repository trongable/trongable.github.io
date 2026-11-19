# AGENTS.md

> Guide for AI agents and developers working on this repository (`trongable.github.io`).

## Project Overview

This repository hosts a personal web platform and interactive 3D mathematical geometry laboratory deployed statically to **GitHub Pages** via GitHub Actions.
- **URL**: `https://trongngyn.com` (`https://trongable.github.io`)
- **Core Stack**: React 19, Vite 8 (Rolldown), React Three Fiber (R3F) v9, `@react-three/drei` v10, Three.js 0.187, Tailwind CSS v4, TypeScript 7.
- **Routing**: Minimalist client-side router (`src/routes/Router.tsx`) with HTML5 pushState, hash routing fallback for GitHub Pages, and URL query parameter state synchronization (`?geo=...`, `?tuner=...`, `?halo=...`).
- **Pages**:
  - `/` (Home): Minimalist, understated `"welcome"` prompt that dynamically expands on hover into one of 8 interactive 3D mathematical topologies.
  - `/about`: Clean minimalist page shell.
  - `/more`: Clean minimalist page shell.
  - `dchc`: External direct navigation link to `https://dc-hardcore.com`.

---

## 3D Topologies & Geometry Engine

The site features 8 procedural mathematical topologies dispatched dynamically via `GeometryDispatcher.tsx` and tuned in real time via `Tuner.tsx`:

| Topology Mode | Description | Mathematical Model |
| :--- | :--- | :--- |
| **`halo`** | Planar orbital ring | Flat horizontal ring in the X-Z plane with constant angular velocity, 3D upright tilt, and 7 procedural guide styles. |
| **`trefoil`** | Torus Knot | Non-trivial $(2, 3)$ Torus Knot in $\mathbb{R}^3$ parameterized along a closed periodic loop. |
| **`tesseract`** | 4D Hypercube Projection | 16 vertices and 32 edges of a 4-dimensional hypercube projected into 3D via 4D plane rotations ($X$-$W$ and $Y$-$Z$) and perspective division. |
| **`astrolabe`** | Tri-Axial Astrolabe | 3 concentric tilted gimbal rings with orbital velocities and magnetic locking alignment on hover. |
| **`lorenz`** | Strange Attractor | Deterministic differential chaos manifold modeled via the Lorenz attractor system ($\sigma=10, \beta=8/3, \rho=28$) with particle trail ribbons. |
| **`origami`** | Polyhedral Blossom | 20-faced icosahedral crystal core that mechanically unfolds into floating facet panels. |
| **`slingshot`** | Gravitational Slingshot | Eccentric Keplerian elliptical orbits ($r = \frac{a(1-e^2)}{1 + e\cos\theta}$) with inverse-square periapsis whip acceleration. |
| **`helix`** | Toroidal Helix | Corkscrew accelerator tube wrapped endlessly around a toroidal manifold with variable coil frequency. |

---

## Design Systems & Visual FX

### 1. Procedural Theme Palettes (`ThemeContext.tsx`)
The app features 3 palettes dynamically injected via document root CSS custom variables (`--theme-primary`, `--theme-highlight`):
- **Volt Yellow**: `#e2f872` (highlight: `#f5ff9e`) — Default
- **Purple** (`purple`): `#d4adf0` (highlight: `#eddcf9`)
- **Teal** (`teal`): `#83d4d4` (highlight: `#afe5e5`)

Themes mutate randomly following fullscreen glitch events or can be controlled programmatically via `useTheme()`.

### 2. Cyber GPU Glitch VFX (`GpuGlitchOverlay.tsx`)
- Fullscreen procedural VRAM corruption bursts occurring every 4–15 seconds (lasting 400ms–3,000ms, adjustable via the Tuner HUD).
- Renders strictly orthogonal (100% 90° right angles, zero diagonals/trapezoids) stepped staircases, horizontal slice displacements, scanlines, and momentary difference/exclusion inversions.
- **Glitch Memory Photos**: Features a configurable chance (default 100%) of distorted, high-contrast, difference-blended nostalgic memory photos appearing masked within the glitch boundary.
- **Accessibility**: Automatically disabled when the user has `prefers-reduced-motion: reduce` enabled in their operating system.

### 3. Developer System Tuner HUD (`Tuner.tsx`)
A secret diagnostic and tuning HUD positioned in the bottom-right corner, elevated at `z-[60]` to remain interactive during glitch bursts:
- **Unlock via Browser Console**:
  - `tuner()`: Toggle HUD visibility (persisted in `localStorage` as `trongngyn_tuner_visible`).
  - `glitch()` / `triggerGlitch()`: Immediately trigger a procedural glitch burst.
  - `setTheme(id)`: Force active preset theme (`yellow`, `purple`, `teal`).
  - `setColor(hex)` / `setCustomColor(hex)`: Set a custom primary hex color with auto-computed companion highlight.
  - `lockTheme(boolean?)`: Toggle or set theme locking to prevent glitch bursts from mutating custom colors.
  - `setGlitchInterval(seconds)`: Adjust glitch frequency interval.
  - `setImageRate(rate)`: Adjust memory picture chance (0.0 to 1.0).
  - `setPowerMode('auto' | 'eco' | 'uncapped')`: Change power governance mode.
  - `powerMode()`: Print active power state, FPS cap, DPR, and battery status.
  - `setGeo('trefoil')`: Switch active topology.
  - `geoList()`: Output all 8 topologies to console.
  - `hideTuner()`: Dismiss HUD.
- **Unlock via URL**: Append `?tuner=true` or `?tuner=1` to the URL.
- **Tuning Drawer**:
  - **`3D Topologies` Tab**: Real-time sliders for animation speeds, radii, scales, chaos parameters, wireframe toggles, and dedicated `↺ Reset {name} to Defaults` buttons for every topology.
  - **`VFX & Glitch` Tab**: Preset theme palettes, custom hex text entry + native color picker with real-time auto-computed highlight color preview, theme locking toggle, glitch frequency interval slider (2s–20s), memory picture appearance rate slider (0%–100%), manual `⚡ Trigger Glitch` button, and **Power & Performance Manager** with 3 modes (`Auto` [default: uncapped FPS, managed DPR], `Eco` [Tuner only: uncapped FPS, reduced DPR 1.0], and `Uncapped` [Tuner only: uncapped FPS, forced DPR 2.0 on battery]).

---

## Performance, Energy & Memory Management Rules

1. **Zero-Allocation in `useFrame`**:
   Never allocate objects (`new THREE.Vector3()`, arrays, coordinate objects) inside the 60/120 Hz render loop. Mathematical functions (`project4D`, `stepLorenz`, `computeToroidalHelixPoint`, `computeKeplerPosition`, `getTrefoilPoint`) accept pre-allocated target vectors/objects and mutate them in-place.
2. **Page Visibility 0% GPU Sleep**:
   When the browser tab is hidden or minimized (`document.visibilityState === 'hidden'`), R3F Canvas switches to `frameloop="never"` and periodic glitch timeout loops pause completely, reducing GPU and CPU consumption to **0.0%**.
3. **Uncapped Native High-Refresh Animation**:
   All visible modes run at native display refresh rates (60Hz, 120Hz ProMotion on MacBooks, 144Hz on gaming/creator screens) with zero artificial FPS judder. Energy conservation is managed via intelligent DPR scaling rather than frame rate throttling.
4. **Collapsed Geometry Computation Sleep**:
   When `isExpanded === false` and scale <= 0.051, all 8 topology engines immediately bypass 100% of mathematical projections, differential equation steps, and GPU buffer updates (`needsUpdate = true`), sleeping until expanded.
5. **Dynamic DPR Scaling**:
   In default `Auto` mode on battery or when `Eco` mode is selected in the Tuner, Device Pixel Ratio drops from 2.0 to 1.0, slashing fragment shader pixel shading and VRAM memory bandwidth by **75%** while keeping high-refresh 120/144Hz motion perfectly fluid. `Uncapped` mode allows forcing full DPR 2.0 on battery.
6. **Explicit WebGL Resource Disposal**:
   Every procedural `BufferGeometry`, `TubeGeometry`, `TorusGeometry`, `WireframeGeometry`, `Material`, and `CanvasTexture` created in `useMemo` must have a corresponding disposal cleanup hook (`geometry.dispose()`, `material.dispose()`, `texture.dispose()`) to prevent GPU VRAM leaks on parameter changes, theme shifts, or route transitions.
7. **Idle Particle Settling Guard**:
   In `ParticleField.tsx`, star color transitions use an `isSettled` ref guard. Once colors converge within epsilon of target theme colors, the 2,250-element float iteration is bypassed entirely until the next theme change.
8. **Damped Camera Parallax**:
   `CameraController` in `SceneContainer.tsx` uses an epsilon sleep threshold (`0.0002`) to halt camera matrix recalculations when the mouse pointer is stationary.
9. **Pixel Ratio Clamping**: Always cap `dpr` to `[1, 2]`. Rendering at DPR 3+ on mobile devices provides no perceptual benefit and degrades frame rates.
10. **Code Splitting & Bundle Chunking**:
   Rollup `manualChunks` in `vite.config.ts` isolates vendor libraries:
   - `vendor-three`: `three`, `@react-three/fiber`, `@react-three/drei` (~1 MB)
   - `vendor-react`: `react`, `react-dom` (~220 KB)
   - Application code chunk remains lightweight (<60 KB).
11. **Font Preloading**:
   Editorial fonts (`Newsreader-Italic.ttf`, `JetBrainsMono-Regular.ttf`) are preloaded in `index.html` to eliminate FOUT (Flash of Unstyled Text).
12. **Mobile Viewport & Touch Architecture**:
   - Containers use `min-h-dvh` and `h-full` (dynamic viewport height) to eliminate iOS Safari / Android Chrome URL bar vertical overflows.
   - `html, body, #root` enforce `overscroll-behavior: none` to prevent elastic rubber-band bouncing.
   - `SceneContainer` uses `touch-action: none` (`touch-none`) to prevent browser scroll hijacking and enable continuous touch drag raycasting (`pointermove`) across 3D meshes.
   - The central `"welcome"` prompt expands its hit target to >80px × 200px via `after:absolute after:-inset-8 md:after:inset-0 touch-manipulation`, keeping the visible text compact and elegant.
   - Touchscreens trigger real-time tactile hover feedback on `"welcome"` via `onTouchStart` (neon highlight glow + cyber glyph scrambling) and expand into 3D on `onTouchEnd`. In the 3D scene, gliding a finger acts as an interactive radar sweep triggering live mesh hover and glyph scrambling.

---

## Architecture & Code Structure

```
trongable.github.io/
├── .github/workflows/deploy.yml   # CI/CD: Lint -> Typecheck -> Test (Coverage) -> Build -> Deploy
├── public/
│   ├── 404.html                   # GitHub Pages SPA redirect fallback
│   └── fonts/
│       ├── JetBrainsMono-Regular.ttf  # Monospace UI typography
│       └── Newsreader-Italic.ttf      # Editorial 3D badge typography
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── geometries/
│   │   │   │   ├── AstrolabeMenu.tsx       # 3-ring gimbal celestial topology
│   │   │   │   ├── geometryConfig.ts       # Topologies registry, params schema, defaults
│   │   │   │   ├── GeometryDispatcher.tsx  # Dynamic topology router
│   │   │   │   ├── HaloMenuRing.tsx        # Planar orbital ring topology
│   │   │   │   ├── HelixMenu.tsx           # Toroidal corkscrew accelerator
│   │   │   │   ├── index.ts                # Geometries barrel export
│   │   │   │   ├── LorenzMenu.tsx          # Chaotic strange attractor
│   │   │   │   ├── MenuItemBadge.tsx       # Standardized 3D billboard text badge
│   │   │   │   ├── OrigamiMenu.tsx         # Unfolding crystalline polyhedron
│   │   │   │   ├── ProceduralGuide.tsx     # Unified 7-style procedural guide renderer
│   │   │   │   ├── SlingshotMenu.tsx       # Keplerian gravitational slingshot
│   │   │   │   ├── TrefoilMenu.tsx         # Non-trivial Torus knot
│   │   │   │   └── __tests__/              # Geometry dispatch, badges, and math tests
│   │   │   ├── HaloMenuRing.tsx            # Backwards-compatible re-export
│   │   │   ├── ParticleField.tsx           # Ambient background starfield with theme lerping
│   │   │   ├── SceneContainer.tsx          # R3F Canvas wrapper with camera & DPR cap
│   │   │   └── __tests__/                  # Canvas & particle unit tests
│   │   ├── effects/
│   │   │   ├── GpuGlitchOverlay.tsx        # Fullscreen orthogonal GPU glitch VFX
│   │   │   └── __tests__/                  # Glitch orthogonality & reduced motion tests
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                  # Top header navigation
│   │   │   └── __tests__/                  # Navbar routing tests
│   │   └── ui/
│   │       ├── Tuner.tsx                   # Developer HUD system parameter tuner (topologies & VFX)
│   │       ├── GeometryTuner.tsx           # Backwards-compatible re-export
│   │       └── __tests__/                  # Tuner drawer & control tests
│   ├── context/
│   │   ├── ThemeContext.tsx                # Multi-palette theme state & CSS variable injector
│   │   └── __tests__/                      # Theme switching & persistence tests
│   ├── pages/
│   │   ├── HomePage.tsx                    # Welcome prompt, 3D scene & secret tuner hooks
│   │   ├── AboutPage.tsx                   # Clean minimal page shell
│   │   ├── MorePage.tsx                    # Clean minimal page shell
│   │   └── __tests__/                      # Page rendering & back-navigation tests
│   ├── routes/
│   │   ├── Router.tsx                      # SPA router with query param sync
│   │   └── __tests__/                      # Routing & navigation tests
│   ├── utils/
│   │   ├── glyphUtils.ts                   # Procedural cyber glyph scrambling utilities
│   │   └── __tests__/                      # Glyph scrambling unit tests
│   ├── App.tsx                             # Root application provider wrapper
│   ├── main.tsx                            # React DOM entry root
│   ├── index.css                           # Tailwind CSS v4, fonts & keyframe animations
│   └── vite-env.d.ts
├── AGENTS.md                               # This document
├── index.html                              # Shell with font preloading & OpenGraph SEO tags
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.setup.ts
```

---

## Development & Test Commands

```bash
# Start local development server
npm run dev

# Run fast Rust-based linter (Oxlint)
npm run lint

# Run strict TypeScript 7 check
npm run typecheck

# Run unit & component test suite
npm test

# Run test suite with V8 coverage report
npm run test:coverage

# Build production bundle (tsc + vite)
npm run build

# Preview production build locally
npm run preview
```

---

## Agent Guidelines

- **Path Aliasing**: Always use the `@/` alias for imports pointing into `src/` (e.g. `import { useTheme } from '@/context/ThemeContext'`).
- **Minimalist Aesthetic**: Maintain the clean, understated typography and neon cyber aesthetic. Avoid superfluous marketing copy.
- **Zero Allocations in Loops**: When modifying animation frames, write in-place to pre-allocated vectors and cached targets.
- **Preserve Tests**: Whenever adding new features, topologies, or routes, add corresponding unit and component tests in `<feature>/__tests__/`.
- **Verify Before Finishing**: Always ensure `npm run lint`, `npm run typecheck`, `npm run test:coverage`, and `npm run build` pass with zero errors.
