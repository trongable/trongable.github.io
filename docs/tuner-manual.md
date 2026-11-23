# Developer System Tuner HUD: Complete Calibration Manual & Settings Reference

> **Repository**: `trongngyn.com` (`trongable.github.io`)  
> **Component Target**: `src/components/ui/Tuner.tsx`  
> **Elevated Z-Index**: `z-[60]` (remains fully interactive above active GPU glitch overlays)

---

## 1. Overview & Unlocking the Tuner

The **Developer System Tuner HUD** is an in-browser diagnostic and calibration instrument embedded in the personal portfolio and 3D mathematical geometry laboratory. It allows developers and designers to fine-tune 3D topologies, adjust parametric animations, test visual effects (VFX), switch 3D character containers, toggle real-time spatial telemetry, and profile device energy consumption on the fly.

### 1.1 Methods to Unlock the Tuner

The Tuner is collapsed by default to preserve the site's minimalist aesthetic. It can be unlocked through three distinct pathways:

1. **Browser Console**:
   Open Developer Tools (F12 or Cmd+Option+I) and execute:
   ```javascript
   tuner()
   ```
   This toggles the HUD on screen and persists its state to `localStorage`.
2. **URL Query Parameters**:
   Load any page with the `?tuner=true` query parameter:
   ```
   https://trongngyn.com/?tuner=true
   ```
   Additional query flags can be chained (e.g., `?tuner=true&geo=trefoil&dist=true&metric=depth`).
3. **Secret Keyboard Shortcut**:
   Pressing the backtick key (`` ` `` / `~`) toggles HUD visibility when not focusing a text input.

---

## 2. HUD Layout & Controls Architecture

The Tuner interface is split into two primary operational tabs:
- **`3D Topologies` Tab**: Parametric mathematical variables, wireframe/guide styles, reset buttons, Sonny 3D container selection, and real-time distance telemetry controls.
- **`VFX & Glitch` Tab**: Color science presets, custom hex pickers, real-time luminance highlight preview, theme locking, glitch interval sliders, memory photo rate sliders, manual trigger bursts, and power governance profiling.

---

## 3. 3D Topologies & Parametric Settings

The site features 8 procedural mathematical topologies. Each topology has dedicated real-time sliders and render style selectors.

### 3.1 Topology Modes Quick Reference

| Topology ID | Name | Mathematical Category | Governing Form |
| :--- | :--- | :--- | :--- |
| **`halo`** | Halo Ring | Planar Orbital Ring | Horizontal ring with Euler tilt and azimuth yaw. |
| **`trefoil`** | Trefoil Knot | Non-trivial Torus Knot | $(2, 3)$ periodic Torus Knot closed loop in $\mathbb{R}^3$. |
| **`tesseract`** | 4D Tesseract | Higher-Dimensional Projection | 4D hypercube projected via dual-plane $SO(4)$ rotations. |
| **`astrolabe`** | Tri-Axial Astrolabe | Concentric Gimbal Rings | 3 nested celestial rings with magnetic locking alignment. |
| **`lorenz`** | Strange Attractor | Deterministic Chaos Manifold | Lorenz differential system ($\sigma=10, \beta=8/3, \rho=28$). |
| **`origami`** | Origami Polyhedron | Blossoming Crystal | 20-faced icosahedron mechanically blossoming into facet panels. |
| **`slingshot`** | Gravitational Slingshot | Keplerian Orbital Mechanics | Eccentric Kepler ellipse with inverse-square whip acceleration. |
| **`helix`** | Toroidal Helix | Toroidal Accelerator Tube | Dual-frequency corkscrew coils wrapped around a torus. |

---

### 3.2 Exhaustive Topology Parameters Table

| Mode | Parameter Key | Label in UI | Type | Default | Range | Step | Visual Impact & Description |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`halo`** | `speed` | Speed | `number` | `0.0825` | `0.01` – `0.50` | `0.005` | Angular orbital velocity of menu badges. |
| | `radius` | Radius | `number` | `1.0` | `0.5` – `2.5` | `0.05` | Radial distance from origin to orbital ring. |
| | `tilt` | Tilt | `number` | `0` | `-90` – `90` | `1` | Ring elevation angle in degrees ($0^\circ$ = flat horizontal, $90^\circ$ = vertical upright). |
| | `yaw` | Yaw | `number` | `0` | `0` – `360` | `1` | Azimuth orientation heading around Y axis in degrees. |
| | `guideWidth` | Guide Width | `number` | `0.015` | `0.005` – `0.045` | `0.001` | Tube thickness of the guide track. |
| | `showGuide` | Show Guide | `boolean` | `true` | `true` / `false` | — | Toggles visibility of the orbital guide ring. |
| | `guideStyle` | Guide Style | `GuideStyle` | `'solid'` | 7 styles | — | Render style of the orbital track (see Section 4). |
| **`trefoil`** | `speed` | Speed | `number` | `0.20` | `0.02` – `0.80` | `0.01` | Travel velocity along the knot curve $\theta(t)$. |
| | `scale` | Scale | `number` | `1.1` | `0.5` – `2.2` | `0.05` | Overall spatial bounding scale in 3D scene. |
| | `tubeRadius` | Tube Radius | `number` | `0.015` | `0.004` – `0.040` | `0.001` | Cross-sectional tube radius of the knot curve. |
| | `showTrack` | Show Track | `boolean` | `true` | `true` / `false` | — | Toggles the 3D tube geometry path. |
| | `trackStyle` | Track Style | `GuideStyle` | `'wireframe'` | 7 styles | — | Surface rendering mode of the torus knot tube. |
| **`tesseract`** | `speed4D` | 4D Speed | `number` | `0.25` | `0.05` – `1.00` | `0.01` | Angular rotation rate in 4D planes ($X$-$W$ and $Y$-$Z$). |
| | `distance` | Projection Dist | `number` | `2.2` | `1.5` – `4.0` | `0.1` | 4D camera projection pole distance $d_w$ (perspective divisor). |
| | `cubeSize` | Cube Size | `number` | `1.15` | `0.5` – `2.5` | `0.05` | Half-edge length $L$ of the 4D hypercube in $\mathbb{R}^4$. |
| | `showWires` | Show Wires | `boolean` | `true` | `true` / `false` | — | Toggles the 32 hypercube edges in 3D projection. |
| | `wireStyle` | Wire Style | `LineStyle` | `'solid'` | 3 styles | — | Line style for the 32 edges (`solid`, `dash`, `dots`). |
| **`astrolabe`** | `speed` | Speed | `number` | `1.0` | `0.1` – `3.0` | `0.1` | Multiplier for individual ring orbital velocities. |
| | `ringSpread` | Ring Spread | `number` | `1.0` | `0.4` – `2.0` | `0.05` | Radial gap multiplier between the 3 concentric gimbal rings. |
| | `tiltAngle` | Tilt Angle | `number` | `45` | `10` – `80` | `1` | Relative inclination angle between adjacent gimbal rings in degrees. |
| | `ringWidth` | Ring Width | `number` | `0.012` | `0.004` – `0.035` | `0.001` | Tube thickness of each gimbal ring. |
| | `showRings` | Show Rings | `boolean` | `true` | `true` / `false` | — | Toggles visibility of all 3 gimbal rings. |
| | `ringStyle` | Ring Style | `GuideStyle` | `'solid'` | 7 styles | — | Surface rendering mode of the gimbal rings. |
| **`lorenz`** | `speed` | Speed | `number` | `0.008` | `0.001` – `0.030` | `0.001` | Differential integration timestep $dt$ per frame. |
| | `scale` | Scale | `number` | `0.065` | `0.02` – `0.15` | `0.005` | Coordinate normalization multiplier mapping attractor bounds into scene. |
| | `rho` | Chaos ($\rho$) | `number` | `28` | `10` – `50` | `1` | Rayleigh number $\rho$ governing transition into chaotic manifold. |
| | `showParticles` | Show Ribbon | `boolean` | `true` | `true` / `false` | — | Toggles visibility of the historical trajectory trail. |
| | `trailStyle` | Trail Style | `LineStyle` | `'solid'` | 3 styles | — | Rendering mode of the attractor trajectory trail. |
| **`origami`** | `unfold` | Blossom Spread | `number` | `1.0` | `0.0` – `2.5` | `0.05` | Radial distance facets displace outwards along normal vectors. |
| | `tumbleSpeed` | Tumble Speed | `number` | `0.12` | `0.01` – `0.50` | `0.01` | 3-axis rotational velocity of the central crystalline core. |
| | `facetScale` | Facet Size | `number` | `0.60` | `0.2` – `1.2` | `0.05` | Relative scale of the 20 triangular facet panels. |
| | `showWires` | Show Facets | `boolean` | `true` | `true` / `false` | — | Toggles the 20 triangular facet panels. |
| | `wireStyle` | Facet Style | `GuideStyle` | `'wireframe'` | 3 styles | — | Surface rendering mode of the facets (`cage`, `solid`, `dots`). |
| **`slingshot`** | `eccentricity` | Eccentricity ($e$) | `number` | `0.68` | `0.10` – `0.92` | `0.01` | Keplerian orbital eccentricity ($0$ = circular, $\to 1$ = highly eccentric). |
| | `axis` | Semi-Major Axis ($a$) | `number` | `2.0` | `1.0` – `3.5` | `0.1` | Semi-major orbital radius in world units. |
| | `acceleration` | Whip Velocity | `number` | `1.0` | `0.2` – `3.0` | `0.1` | Multiplier for angular momentum periapsis whip acceleration. |
| | `orbitWidth` | Orbit Width | `number` | `0.012` | `0.004` – `0.035` | `0.001` | Tube thickness of the elliptical guide rails. |
| | `showOrbits` | Show Rails | `boolean` | `true` | `true` / `false` | — | Toggles elliptical orbit guide rails. |
| | `orbitStyle` | Orbit Style | `GuideStyle` | `'solid'` | 7 styles | — | Surface rendering mode of the orbital rails. |
| **`helix`** | `speed` | Speed | `number` | `0.22` | `0.02` – `0.80` | `0.01` | Travel speed along the toroidal helix tunnel. |
| | `coils` | Coil Count ($N$) | `number` | `6` | `2` – `16` | `1` | Number of corkscrew revolutions wrapped around the toroidal axis. |
| | `radius` | Torus Radius ($R$) | `number` | `1.8` | `0.8` – `3.0` | `0.1` | Major radius of the parent torus manifold. |
| | `coilWidth` | Tube Width | `number` | `0.012` | `0.004` – `0.035` | `0.001` | Tube thickness of the corkscrew accelerator tube. |
| | `showCoil` | Show Tube | `boolean` | `true` | `true` / `false` | — | Toggles visibility of the helical tube. |
| | `coilStyle` | Tube Style | `GuideStyle` | `'solid'` | 7 styles | — | Surface rendering mode of the helical tube. |

---

## 4. Procedural Guide Styles Reference

The site uses a unified guide rendering pipeline (`ProceduralGuide.tsx`) providing 7 procedural shader styles:

| Style ID | UI Label | Visual Description | Shader / Geometry Architecture |
| :---: | :---: | :--- | :--- |
| **`solid`** | `solid` | Smooth, continuous neon emissive cylinder. | Standard `meshBasicMaterial` with solid primary theme color and anti-aliased edge smoothing. |
| **`wireframe`** | `cage` | Orthogonal cyber wireframe polygon lattice. | `WireframeGeometry` overlay with low polygon segment count creating a structural cyber cage. |
| **`glow`** | `glow` | Translucent pulsing neon plasma aura. | Dual-layer rendering: inner dense core surrounded by an additive blended outer shell (`depthWrite: false`). |
| **`hex`** | `hex` | Procedural hexagonal honeycomb tube. | Radial segment count clamped to 6 with flat-shaded normals generating hexagonal prism edges. |
| **`dashed`** | `dash` | Segmented cyber runway strobe lines. | `LineDashedMaterial` with dynamic `computeLineDistances()` running at periodic pulse intervals. |
| **`points`** | `dots` | Constellation of discrete glowing point vertices. | `Points` primitive utilizing `PointsMaterial` with custom point attenuation sizing. |
| **`ribbed`** | `ribbed` | Accordion-folded corrugated conduit rings. | High-frequency sinusoidal radius modulation along the curve Frenet-Serret normal vector. |

---

## 5. Sonny 3D Character Containers Reference

When displaying character badge items (such as the `/sonny` route badge), `MenuItemBadge.tsx` supports **6 switchable 3D container styles**:

| Container ID | Name | Architectural Anatomy | Ideal Visual Context |
| :---: | :---: | :--- | :--- |
| **`capsule`** *(Default)* | Cryo Stasis Pod | Translucent cylindrical glass shell ($r=0.28, h=0.78$), upper/lower chamfered metallic end-caps, glowing mounting brackets. | High-tech sci-fi stasis chamber; protects sprite inside a physical glass vessel. |
| **`diorama`** | L-Shaped Display | Vertical back wall ($0.39 \times 0.69$) joined orthogonally to a horizontal floor platform ($0.39 \times 0.39$) at $z=0.19$. | Architectural museum diorama; provides ground and backdrop shadows. |
| **`pedestal`** | Hologram Projector | Floating circular projector disc ($r=0.24$) with concentric outer glowing neon emitter ring. | Minimalist hologram projection platform without obstructing walls. |
| **`wirebox`** | Neon Vitrine | 3D orthogonal neon wireframe hypercube box ($0.44 \times 0.72 \times 0.44$). | Cyberpunk display case; matches orthogonal glitch aesthetics. |
| **`crystal`** | Polyhedral Lattice | Faceted icosahedral crystalline cage with glowing structural gem lattice and translucent facets. | Magical/crystalline aesthetic; refracts light around the sprite. |
| **`none`** | Floating Sprite | Pure floating holographic billboard sprite with zero surrounding geometry. | Completely unconstrained minimalist character floating in empty space. |

---

## 6. Real-Time 3D Telemetry HUD Controls

To assist in debugging depth coordinates and spatial positioning, the Tuner provides real-time telemetry overlays rendered as cyber monospace pills directly above all 3D menu badges:

### 6.1 Telemetry Controls in the Tuner
- **`Distance Labels (HUD)` Toggle**: Globally enables or disables telemetry labels. When enabled, **Telemetry Probe Mode** activates:
  - All standard link badges (text cards and Sonny 3D containers/sprites) are hidden.
  - Replaced with interactive translucent 3D spheres ($r = 0.15$) encased in glowing geometric wireframe cages ($r = 0.152$).
  - Spheres retain full interactivity: clicking navigates to the target route (`onSelect`), and hovering triggers neon highlight glow and pointer cursor state.
  - Floating distance telemetry pills float directly above each sphere.
- **`Metric Switcher` (`Euclid (d:)` vs `View Depth (depth:)`)**:
  - **`Euclid (d:)`**: True 3D radial Euclidean distance from camera eye $\vec{C}$ to object center $\vec{P}$:
    $$d = \|\vec{P} - \vec{C}\| = \sqrt{(P_x - C_x)^2 + (P_y - C_y)^2 + (P_z - C_z)^2}$$
  - **`View Depth (depth:)`**: Perpendicular distance from camera focal plane along the optical axis vector $\hat{f}$:
    $$d_{\text{depth}} = (\vec{P} - \vec{C}) \cdot \hat{f} = -0.4238 y - 0.9058 z + 6.017$$
- **`Coords (XYZ)` Toggle**: Toggles real-time 3D coordinates $(x, y, z)$ on the second row of the telemetry pill.
- **`Coord Frame Switcher` (`View (Screen)` vs `World (Global)`)**:
  - **`View (Screen)`** (Default): Camera-relative screen space $(x_v, y_v, z_v)$ normalized to scene origin $(0, 0, 0)$:
    - $x$: Screen horizontal position ($-$: left, $+$: right)
    - $y$: Screen vertical position ($-$: down, $+$: up)
    - $z$: Relative optical depth ($z_{\text{rel}} = \text{viewPos}.z - \text{originView}.z$). Objects in front are mathematically guaranteed to strictly have higher Z values than objects behind them ($Z_{\text{front}} > Z_{\text{back}}$). Positive values are explicitly prefixed with `+` (e.g. `z: +0.91` vs `z: -0.48`) to make depth unambiguous.
  - **`World (Global)`**: Raw global manifold coordinates $(x_w, y_w, z_w)$ before camera perspective projection.
- **`Camera Angle Switcher` (`Elevated (25°)` vs `Eye-Level (0°)`)**:
  - **`Elevated (25°)`** (Default): Camera perched at $[0, 2.55, 5.45]$ looking downward at $25.07^\circ$. Gives depth perspective across the orbital plane, but introduces downward optical skew where lower vertices drop further from the eye.
  - **`Eye-Level (0°)`**: Camera dropped to $[0, 0, 6.0]$ with horizontal $0^\circ$ pitch. Eliminates vertical elevation distortion, allowing direct verification of 4D symmetry and relative distances along the optical axis.
- **`Tesseract 4D Vertex Tagging`**:
  - In Tesseract mode, telemetry pills dynamically display vertex indices and cell status:
    - `[V13 outer]`: Vertex 13 (`about`), binary `1101` ($w=+1$), outer cell.
    - `[V7 inner]`: Vertex 7 (`more`), binary `0111` ($w=-1$), inner cell.
    - `[V10 outer]`: Vertex 10 (`sonny`), binary `1010` ($w=+1$), outer cell.
    - `[V0 inner]`: Vertex 0 (`dchc`), binary `0000` ($w=-1$), inner cell.

### 6.2 Visual Layout & Formatting
```
┌──────────────────────────────────────────────┐
│             [V10 outer] depth: 7.50          │  ← Row 1: Vertex Tag & Camera Distance
│       x: -0.39   y: -2.81   z: -0.48         │  ← Row 2: 3D Coordinates (View or World)
└──────────────────────────────────────────────┘
```
- **Pill Dimensions**: Width dynamically adjusted (`0.30`–`0.66`) based on vertex tag presence and coordinates mode.
- **Throttling**: Values update at ~16 Hz (60ms) and require a spatial delta $|\Delta| \ge 0.01$ to trigger re-triangulation, preserving zero-allocation performance.

---

## 7. VFX, Theming & Glitch Controls

### 7.1 Palette Presets
- **Volt Yellow** (`yellow`): `#e2f872` (highlight: `#f5ff9e`) — Repository default.
- **Purple** (`purple`): `#d4adf0` (highlight: `#eddcf9`)
- **Teal** (`teal`): `#83d4d4` (highlight: `#afe5e5`)

### 7.2 Custom Hex & Real-Time Highlight Computation
- **Hex Text Field & Native Color Picker**: Allows inputting any valid 6-character hex code (`#rrggbb`).
- **Auto-Highlight Preview**: As you type or pick a color, the system automatically computes a high-contrast companion highlight color based on CIE relative luminance:
  - High luminance base colors receive a deepened, saturated highlight.
  - Low luminance base colors receive an ultra-bright neon tint boost.
- **Theme Lock Toggle**: When locked, procedural fullscreen glitch bursts will **not** randomize the color palette, keeping your custom colors active indefinitely.

### 7.3 Glitch Frequency & Memory Photos
- **Glitch Frequency Slider**: Adjusts periodic burst interval from **2 seconds** (chaotic) to **20 seconds** (subtle). Default is **8 seconds**.
- **Memory Picture Appearance Rate**: Adjusts probability of nostalgic masked memory photos appearing inside glitch boundaries from **0%** (pure scanlines) to **100%** (photo in every burst).
- **`⚡ Trigger Glitch` Button**: Immediately triggers an instantaneous procedural VRAM corruption burst for testing.

---

## 8. Power & Performance Governance Modes

The Tuner exposes a 3-way Power Governance manager (`usePowerManager.ts`) to simulate and optimize client resource consumption:

| Mode | FPS Behavior | Device Pixel Ratio (DPR) | Battery Detection | Recommended Use |
| :---: | :---: | :---: | :---: | :--- |
| **`Auto`** *(Default)* | Uncapped (60 / 120 / 144 Hz) | Automatically scales between `[1.0, 2.0]`. When on battery power, drops to `1.0`. | Active (`navigator.getBattery`) | Production default. Balances maximum fluidity with energy conservation. |
| **`Eco`** | Uncapped (60 / 120 / 144 Hz) | Forced to `1.0` at all times (cuts fragment shader load by 75%). | Overridden | Low-spec hardware, laptops on low battery, thermal management. |
| **`Uncapped`** | Uncapped (60 / 120 / 144 Hz) | Forced to `2.0` at all times (even on battery power). | Overridden | High-end desktop profiling, 4K retina displays, marketing demos. |

> **0% GPU Idle Sleep**: Regardless of power mode, when the browser tab is hidden or minimized (`document.visibilityState === 'hidden'`), the R3F Canvas automatically switches to `frameloop="never"` and halts all periodic timers, reducing GPU and CPU consumption to **0.0%**.

### 8.1 Animation Pause Button & Complete Effects Freeze
Adjacent to the bottom-right Tuner launcher pill (`geo: [name] | ⚙ | ✕`), the Tuner provides a dedicated circular **Animation Pause Button** (`data-testid="animation-pause-button"`):
- **Visibility**: Only rendered when the Tuner HUD is active (`isTunerVisible === true`). Automatically unpauses and dismisses when the Tuner is closed via `✕`.
- **States**:
  - Running: Displays `⏸` with aria-label `"Pause all animations and visual effects"`.
  - Paused: Displays `▶` highlighted in neon magenta (`border-[#ff007f] bg-[#ff007f]/20 text-[#ff007f]`) with aria-label `"Resume animations and visual effects"`.
- **Total Effects Freeze Scope**:
  - R3F Canvas switches to `frameloop="never"`, bypassing all WebGL rendering cycles.
  - `FrameGovernor` halts its RAF timer loop.
  - Periodic GPU glitch timers and active glitch bursts are immediately cleared.
  - Mobile touch glyph scrambling is suspended.
  - Global CSS keyframes freeze via `[data-effects-paused="true"] *, *::before, *::after { animation-play-state: paused !important; }`.
- **Drawer Control**: The `VFX & Glitch` drawer tab also features an "Animation Engine" toggle row displaying `RUNNING (LIVE)` vs `PAUSED (FROZEN)`.

---

## 9. Developer Console Commands Reference

All developer APIs are registered globally on the browser `window` object and can be called directly in the DevTools console:

```javascript
// --- Tuner Visibility ---
tuner()                          // Toggle Tuner HUD visibility on/off
hideTuner()                      // Explicitly close and dismiss Tuner HUD

// --- Animation Engine & Visual Effects Freeze ---
pause(true)                      // Pause all 3D rendering and visual effects (0% GPU/CPU)
pause(false)                     // Resume active animation loop and effects
togglePause()                    // Toggle animation pause state
isPaused()                       // Return true if animation engine is currently paused

// --- Topologies & Manifolds ---
setGeo('trefoil')                // Switch active topology ('halo', 'trefoil', 'tesseract', etc.)
geoList()                        // Print list of all 8 available topologies with descriptions

// --- Sonny 3D Containers ---
setSonnyContainer('crystal')     // Switch Sonny container ('capsule', 'diorama', 'pedestal', 'wirebox', 'crystal', 'none')
sonnyContainers()                // Print list of all 6 Sonny container styles

// --- Real-Time Telemetry HUD ---
toggleDistance()                 // Toggle real-time distance telemetry labels
showDistance(true)               // Explicitly enable (true) or disable (false) distance labels
setDistanceMetric('depth')       // Switch distance metric ('euclid' | 'depth')
toggleDistanceMetric()           // Toggle between 'euclid' and 'depth'
distanceMetric()                 // Print active distance metric to console
toggleCoords()                   // Toggle 3D (X, Y, Z) coordinates on telemetry labels
showCoords(true)                 // Explicitly enable (true) or disable (false) coordinates
setCoordFrame('view')            // Switch coordinate frame ('view' | 'world')
toggleCoordFrame()               // Toggle between 'view' (screen-space) and 'world' (global)
coordFrame()                     // Print active coordinate frame to console
setCameraElevation('eye-level')  // Switch camera elevation ('elevated' | 'eye-level')
toggleCameraElevation()          // Toggle between 'elevated' (25° pitch) and 'eye-level' (0° pitch)
cameraElevation()                // Print active camera elevation to console

// --- 360° Camera Orbit Inspection ---
setInspectYaw(45)                // Set camera orbit yaw azimuth in degrees (-180° to +180°)
setInspectPitch(0)               // Set camera orbit pitch elevation in degrees (-85° to +85°)
setInspectDistance(8.5)          // Set camera orbit distance/zoom (2.5 to 12.0)
resetCameraAngles()              // Reset camera angles back to default view
cameraAngles()                   // Print active orbit angles: { yaw, pitch, distance }

// --- Theming & Color Science ---
setTheme('teal')                 // Switch preset theme ('yellow', 'purple', 'teal')
setColor('#00ffcc')              // Set custom hex primary color (auto-computes highlight)
setCustomColor('#ff0055')        // Alias for setColor()
lockTheme(true)                  // Lock theme (prevents glitch bursts from mutating colors)

// --- VFX & Glitch Engine ---
glitch()                         // Immediately trigger a procedural GPU glitch burst
triggerGlitch()                  // Alias for glitch()
setGlitchInterval(12)            // Set glitch frequency interval in seconds (2 to 20)
setImageRate(0.5)                // Set memory photo appearance rate (0.0 to 1.0)

// --- Power & Performance ---
setPowerMode('eco')              // Set power governance mode ('auto', 'eco', 'uncapped')
powerMode()                      // Print active power state, FPS cap, DPR, and battery status
```

---

## 10. URL Query Parameters Reference

Any user or automated test harness can deep-link into specific geometries and tuner states via URL query parameters:

| Parameter Key | Accepted Values | Example Usage | Description |
| :--- | :--- | :--- | :--- |
| `tuner` | `true`, `false` | `?tuner=true` | Unlocks and displays the Developer Tuner HUD on page load. |
| `paused` | `true`, `false` | `?paused=true` | Pauses 3D canvas rendering and all visual effects immediately on mount. |
| `geo` | `halo`, `trefoil`, `tesseract`, `astrolabe`, `lorenz`, `origami`, `slingshot`, `helix` | `?geo=lorenz` | Overrides the default topology and mounts the specified geometry immediately. |
| `container` | `capsule`, `diorama`, `pedestal`, `wirebox`, `crystal`, `none` | `?container=wirebox` | Sets the active Sonny 3D character container style. |
| `dist` | `true`, `false` | `?dist=true` | Enables real-time distance telemetry labels above all badges. |
| `metric` | `euclid`, `depth` | `?metric=depth` | Sets active distance metric (`euclid` = radial distance, `depth` = view-plane depth). |
| `coords` | `true`, `false` | `?coords=false` | Toggles visibility of the 3D $(X, Y, Z)$ coordinate readout row. |
| `frame` | `view`, `world` | `?frame=view` | Sets coordinate frame (`view` = screen relative, `world` = global manifold). |
| `elevation` | `elevated`, `eye-level` | `?elevation=eye-level` | Sets camera elevation angle (`elevated` = 25° downward pitch, `eye-level` = 0° flat view). |
| `yaw` | `-180` to `180` | `?yaw=45` | Sets initial camera inspection orbit yaw angle in degrees. |
| `pitch` | `-85` to `85` | `?pitch=0` | Sets initial camera inspection orbit pitch angle in degrees. |
| `zoom` | `2.5` to `12.0` | `?zoom=8.5` | Sets initial camera inspection orbit distance / zoom radius. |
| `halo` | `true`, `false` | `?halo=true` | Backwards-compatible flag forcing immediate expansion into the halo geometry. |

**Chained Example**:
```
https://trongngyn.com/?tuner=true&paused=true&geo=tesseract&dist=true&metric=depth&elevation=eye-level&yaw=45&pitch=15
```
```
https://trongngyn.com/?geo=tesseract&tuner=true&dist=true&metric=depth&coords=true&container=crystal
```

---

## 11. LocalStorage Keys Directory

The Tuner persists user preferences in the browser's `localStorage` across page reloads:

| Storage Key | Value Type | Valid Values | Description |
| :--- | :---: | :--- | :--- |
| `trongngyn_tuner_visible` | `string` | `'true'` / `'false'` | Persists whether the Tuner HUD is currently open. |
| `trongngyn_power_mode` | `string` | `'auto'`, `'eco'`, `'uncapped'` | Persists the active power governance mode. |
| `trongngyn_sonny_container` | `string` | `'capsule'`, `'diorama'`, `'pedestal'`, `'wirebox'`, `'crystal'`, `'none'` | Persists user-selected Sonny 3D character container style. |
| `trongngyn_debug_distance` | `string` | `'true'` / `'false'` | Persists distance telemetry HUD visibility. |
| `trongngyn_debug_distance_metric` | `string` | `'euclid'`, `'depth'` | Persists selected distance telemetry metric. |
| `trongngyn_debug_distance_coords` | `string` | `'true'` / `'false'` | Persists 3D $(X, Y, Z)$ coordinate readout visibility. |
| `trongngyn_debug_distance_coord_frame` | `string` | `'view'`, `'world'` | Persists selected coordinate frame mode (screen view vs global manifold). |
| `antigravity_tuner_visible` | `string` | `'true'` / `'false'` | Legacy fallback key automatically migrated to `trongngyn_tuner_visible`. |
