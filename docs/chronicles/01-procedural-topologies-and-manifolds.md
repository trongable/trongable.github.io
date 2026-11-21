# Chapter 01: Procedural 3D Topologies & Mathematical Manifolds

> **Timeline**: Milestone 1 (Foundation & Core Geometry Engine)  
> **Source Directory**: `src/components/canvas/geometries/`  
> **Mathematical Rigor**: **Extreme** (Differential Equations, Topology, Parametric Manifolds, Keplerian Mechanics, Higher-Dimensional Projections)

---

## 1. Architectural Vision & The Challenge

The objective of `trongngyn.com` was to replace conventional, flat 2D portfolio navigation with an interactive, mathematically rigorous 3D geometry engine. Rather than using pre-baked mesh models or video loops, all 8 topologies are computed **procedurally on the fly** in WebGL via React Three Fiber (R3F) and Three.js.

The primary engineering challenge was dual-faceted:
1. **Mathematical Authenticity**: The manifolds had to faithfully execute the governing differential equations, non-Euclidean projections, and orbital mechanics without visual approximations.
2. **Interactive UI Anchor Points**: The procedural curves had to host 4 interactive navigation badges (`about`, `more`, `sonny`, `dchc`) along stable, continuous trajectories that provide predictable hover targets, depth sorting, and touch interaction.

---

## 2. The 8 Mathematical Topologies & Governing Formulations

### 2.1 The Trefoil Knot (`TrefoilMenu.tsx`)

A trefoil knot is the simplest non-trivial knot, mathematically classified as a $(2, 3)$ Torus Knot in $\mathbb{R}^3$. It is obtained by winding a curve around a torus 2 times longitudinally and 3 times meridionally.

#### Parametric Formulation:
Let $\theta \in [0, 2\pi)$. The curve $\vec{\gamma}(\theta) = \big(x(\theta), y(\theta), z(\theta)\big)^T$ is parameterized by:

$$\begin{aligned}
x(\theta) &= \Big(\sin(\theta) + 2 \sin(2\theta)\Big) \cdot 0.48 \cdot S \\
y(\theta) &= \Big(\cos(\theta) - 2 \cos(2\theta)\Big) \cdot 0.42 \cdot S \\
z(\theta) &= -\sin(3\theta) \cdot 0.75 \cdot S
\end{aligned}$$

where $S$ is the responsive viewport scale factor:
$$S = \min\big(W_{\text{viewport}} \times 0.45, \; H_{\text{viewport}} \times 0.42, \; 2.0\big) \times s_{\text{tuner}}$$

#### Tangent & Frenet-Serret Framing:
To extrude a 3D procedural guide tube along $\vec{\gamma}(\theta)$, the Frenet-Serret apparatus defines an orthonormal coordinate frame $(\vec{T}, \vec{N}, \vec{B})$ at each parameter $\theta$:

$$\vec{T}(\theta) = \frac{\vec{\gamma}'(\theta)}{\|\vec{\gamma}'(\theta)\|}, \quad \vec{N}(\theta) = \frac{\vec{T}'(\theta)}{\|\vec{T}'(\theta)\|}, \quad \vec{B}(\theta) = \vec{T}(\theta) \times \vec{N}(\theta)$$

where the analytical velocity derivative is:

$$\vec{\gamma}'(\theta) = S \begin{pmatrix} 0.48 \big(\cos(\theta) + 4 \cos(2\theta)\big) \\ 0.42 \big(-\sin(\theta) + 4 \sin(2\theta)\big) \\ -2.25 \cos(3\theta) \end{pmatrix}$$

#### Implementation & Zero-Allocation Point Sampling:
```typescript
export function getTrefoilPoint(t: number, scale = 1, target?: THREE.Vector3): THREE.Vector3 {
  const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.48 * scale
  const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.42 * scale
  const z = -Math.sin(3 * t) * 0.75 * scale
  if (target) return target.set(x, y, z)
  return new THREE.Vector3(x, y, z)
}
```

---

### 2.2 The Lorenz Strange Attractor (`LorenzMenu.tsx`)

The Lorenz system is a system of three ordinary differential equations originally studied by Edward Lorenz to model atmospheric convection. It is one of the foundational deterministic chaotic systems, exhibiting a fractal butterfly-wing strange attractor.

#### Differential Formulation:
$$\begin{aligned}
\frac{dx}{dt} &= \sigma (y - x) \\
\frac{dy}{dt} &= x (\rho - z) - y \\
\frac{dz}{dt} &= x y - \beta z
\end{aligned}$$

Standard chaotic canonical parameters are selected:
- Prandtl number: $\sigma = 10$
- Geometric aspect ratio: $\beta = \frac{8}{3} \approx 2.6667$
- Rayleigh number: $\rho = 28$ (tunable from $10$ to $50$ in the Tuner HUD)

#### Numerical Discretization (Explicit Euler Integration):
In the 60/120 Hz render loop, given timestep $dt$ (default $0.008$), the coordinates step forward according to:

$$\begin{aligned}
x_{t+dt} &= x_t + \sigma (y_t - x_t) \cdot dt \\
y_{t+dt} &= y_t + \big(x_t(\rho - z_t) - y_t\big) \cdot dt \\
z_{t+dt} &= z_t + (x_t y_t - \beta z_t) \cdot dt
\end{aligned}$$

#### Coordinate Normalization:
Because the Lorenz manifold orbits two unstable fixed points $C^{\pm} = \big(\pm \sqrt{\beta(\rho-1)}, \pm \sqrt{\beta(\rho-1)}, \rho-1\big)$, its $z$-coordinate is offset into positive space ($z \in [0, 50]$). To center the attractor at the WebGL origin, a spatial transformation is applied:

$$\vec{P}_{\text{world}} = \begin{pmatrix} x \cdot s_{\text{scale}} \\ (z - \rho + 1) \cdot s_{\text{scale}} \\ y \cdot s_{\text{scale}} \end{pmatrix}$$

#### Multi-Particle Seeding:
The 4 menu badges are initialized with small spatial perturbations:
$$\vec{P}_0 = (0.1, 0, 0), \quad \vec{P}_1 = (-0.1, 0, 0), \quad \vec{P}_2 = (0, -0.1, 0), \quad \vec{P}_3 = (0, 0.1, 0)$$
Due to sensitive dependence on initial conditions (the butterfly effect), the 4 badges diverge continuously, weaving distinct particle ribbon trails through phase space.

---

### 2.3 Keplerian Gravitational Slingshot (`SlingshotMenu.tsx`)

Models celestial orbital mechanics under Newtonian gravity, where menu badges travel along eccentric Keplerian ellipses and accelerate near the central gravity well (periapsis whip).

#### Polar Equation of an Ellipse:
Let $a$ be the semi-major axis, $e \in [0, 1)$ be the orbital eccentricity, and $\theta$ be the true anomaly:

$$r(\theta) = \frac{p}{1 + e \cos(\theta)}$$

where the semi-latus rectum is:
$$p = a(1 - e^2)$$

In Cartesian coordinates within the orbital plane:
$$x(\theta) = r(\theta) \cos(\theta), \quad y(\theta) = r(\theta) \sin(\theta)$$

#### Conservation of Angular Momentum & Periapsis Whip:
According to Kepler's Second Law, the specific relative angular momentum $h$ is constant:
$$h = r^2 \frac{d\theta}{dt} = \text{constant}$$

Consequently, the instantaneous angular rate varies inversely with the square of the radial distance:
$$\frac{d\theta}{dt} = \frac{h}{r(\theta)^2} = \frac{h (1 + e \cos\theta)^2}{p^2}$$

At periapsis ($\theta = 0$, closest approach $r_{\text{peri}} = a(1-e)$), velocity reaches its maximum:
$$v_{\text{peri}} = \sqrt{\frac{\mu}{a} \left(\frac{1+e}{1-e}\right)}$$

At apoapsis ($\theta = \pi$, farthest distance $r_{\text{apo}} = a(1+e)$), velocity drops to its minimum:
$$v_{\text{apo}} = \sqrt{\frac{\mu}{a} \left(\frac{1-e}{1+e}\right)}$$

#### 3D Orbital Inclinations:
Each of the 4 menu items orbits along an independent orbital plane with fixed Euler inclinations $(\alpha_i, \beta_i, \gamma_i)$:
- `about`: $[25^\circ, 0^\circ, 15^\circ]$
- `more`: $[-30^\circ, 40^\circ, -10^\circ]$
- `sonny`: $[-15^\circ, -50^\circ, 35^\circ]$
- `dchc`: $[50^\circ, -45^\circ, 30^\circ]$

The orbital coordinates are mapped to 3D world space via rotation matrix $R(\alpha_i, \beta_i, \gamma_i) \in SO(3)$.

---

### 2.4 Toroidal Helix (`HelixMenu.tsx`)

The toroidal helix is a curve wrapped around the surface of a torus manifold. It is parameterized by a major torus radius $R$, a minor tube radius $r$, and a coil winding number $N \in \mathbb{N}$.

#### Parametric Formulation:
Let $\theta \in [0, 2\pi)$ be the toroidal angle along the major circumference. The minor poloidal angle is given by $\phi = N \theta$.

$$\vec{P}(\theta) = \begin{pmatrix} 
\big(R + r \cos(N\theta)\big) \cos(\theta) \\
r \sin(N\theta) \\
\big(R + r \cos(N\theta)\big) \sin(\theta)
\end{pmatrix}$$

#### Velocity & Speed Invariance:
Differentiating $\vec{P}(\theta)$ with respect to $\theta$:
$$\frac{d\vec{P}}{d\theta} = \begin{pmatrix}
-N r \sin(N\theta) \cos(\theta) - \big(R + r \cos(N\theta)\big) \sin(\theta) \\
N r \cos(N\theta) \\
-N r \sin(N\theta) \sin(\theta) + \big(R + r \cos(N\theta)\big) \cos(\theta)
\end{pmatrix}$$

The squared infinitesimal arc length is:
$$\|d\vec{P}\|^2 = \Big(\big(R + r \cos(N\theta)\big)^2 + N^2 r^2\Big) d\theta^2$$

This guarantees a smooth, non-singular manifold across all winding numbers $N$.

---

### 2.5 4D Hypercube / Tesseract (`TesseractMenu.tsx`)

A 4-dimensional hypercube (tesseract) in $\mathbb{R}^4$ comprises 16 vertices $V = \{-L, L\}^4$ and 32 bounding edges.

#### $SO(4)$ Dual-Plane Rotations:
The 4-dimensional rotation group $SO(4)$ is locally isomorphic to $SO(3) \times SO(3)$. A double rotation is performed across two completely orthogonal planes: the $(X, W)$ plane with angular speed $\omega_1$, and the $(Y, Z)$ plane with angular speed $\omega_2$:

$$R_{4D}(t) = \begin{pmatrix}
\cos(\omega_1 t) & 0 & 0 & -\sin(\omega_1 t) \\
0 & \cos(\omega_2 t) & -\sin(\omega_2 t) & 0 \\
0 & \sin(\omega_2 t) & \cos(\omega_2 t) & 0 \\
\sin(\omega_1 t) & 0 & 0 & \cos(\omega_1 t)
\end{pmatrix}$$

#### 4D-to-3D Perspective Division:
To project the 4D point $\vec{V}_{4D}(t) = \big(X(t), Y(t), Z(t), W(t)\big)^T$ into 3D space $\vec{P}_{3D}$, a 4-dimensional perspective camera pole is positioned at distance $d_w$ along the $W$-axis ($d_w > \max |W|$):

$$\vec{P}_{3D} = \frac{1}{d_w - W(t)} \begin{pmatrix} X(t) \\ Y(t) \\ Z(t) \end{pmatrix}$$

As $W(t) \to d_w$, the 3D projection expands outward; as $W(t) \to -d_w$, it contracts inward, generating the classic inside-out turning animation of a 4D hypercube. *(For the complete linear algebra proof of vertex degeneracy and the Clifford Quad solution, see [Chapter 08](./08-tesseract-4d-degeneracy-and-clifford-quad.md)).*

---

### 2.6 Origami Polyhedral Blossom (`OrigamiMenu.tsx`)

Models a 20-faced regular icosahedron centered at the origin that mechanically blossoms outward into floating UI facet panels.

#### Golden Ratio Construction:
The 12 vertices of a regular icosahedron with edge length 2 are derived from the golden ratio $\phi = \frac{1 + \sqrt{5}}{2} \approx 1.618034$:

$$V = \big\{ (0, \pm 1, \pm \phi), \; (\pm 1, \pm \phi, 0), \; (\pm \phi, 0, \pm 1) \big\}$$

#### Facet Centroid & Normal Expansion:
For each triangular face $f$ bounded by vertices $(\vec{v}_a, \vec{v}_b, \vec{v}_c)$, its geometric centroid $\vec{C}_f$ and unit normal $\hat{n}_f$ are:

$$\vec{C}_f = \frac{1}{3} (\vec{v}_a + \vec{v}_b + \vec{v}_c), \quad \hat{n}_f = \frac{\vec{C}_f}{\|\vec{C}_f\|}$$

During blossoming, each face translates outward as a function of the unfold parameter $u \in [0, 2.5]$:
$$\vec{C}_f(u) = \vec{C}_f + u \cdot \hat{n}_f$$

---

### 2.7 Tri-Axial Astrolabe (`AstrolabeMenu.tsx`)

Simulates a Renaissance astronomical astrolabe composed of 3 concentric gimbal rings with magnetic alignment on hover:
- Inner Ring: Radius $r_1 = 0.8 \cdot S$
- Middle Ring: Radius $r_2 = 1.2 \cdot S$
- Outer Ring: Radius $r_3 = 1.6 \cdot S$

Each ring rotates around an inclined axis inclined at $45^\circ$. When any menu item is hovered, angular velocities smoothly lerp to magnetic lock targets, aligning the 3 rings into coplanar harmony.

---

### 2.8 Planar Halo Ring (`HaloMenuRing.tsx`)

A planar horizontal orbital ring in the $X$-$Z$ plane ($y=0$):
$$\vec{P}(\theta) = \begin{pmatrix} R \cos(\theta) \\ 0 \\ R \sin(\theta) \end{pmatrix}$$
Supports 3D Euler tilt $\psi \in [-90^\circ, 90^\circ]$ and azimuth yaw $\phi \in [0^\circ, 360^\circ]$, providing a stable orbital reference frame.

---

## 3. Performance & Numerical Stability

1. **Analytical vs Numerical Integration**:
   For deterministic manifolds (`trefoil`, `helix`, `slingshot`, `origami`, `halo`), coordinates are solved analytically in $O(1)$ time per frame, avoiding error accumulation.
2. **Euler Timestep Clamping**:
   For the chaotic Lorenz system, $dt$ is strictly clamped to $0.008$ regardless of display refresh rate (60Hz vs 120Hz/144Hz ProMotion) to prevent numerical divergence of the strange attractor.
3. **Zero Heap Allocation**:
   All mathematical point functions (`getTrefoilPoint`, `computeKeplerPosition`, `computeToroidalHelixPoint`, `stepLorenz`) accept pre-allocated target vectors and mutate coordinates in-place.
