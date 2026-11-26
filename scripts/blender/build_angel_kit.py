"""Headless Blender 5.3 script to build the reference-accurate Angel Builder .glb kit.

Uses unified seamless quad-remeshed + Subdivision Surface topology for smooth organic
shoulder/hip blending, rounder Kewpie baby head, sculpted C-shaped cupped ears,
chest-to-belly toddler curve, sculpted fingers & 5 toes, and upper-back fan wings.

Generates:
  public/models/angel/base-angel.glb
  public/models/angel/hair/{short-crop,long-bob}.glb
  public/models/angel/accessories/{round-glasses,halo}.glb
  public/models/angel/tops/{oversized-hoodie,graphic-tee}.glb
  public/models/angel/bottoms/{athletic-shorts,cargo-pants}.glb
  public/models/angel/footwear/{sneakers,slides}.glb
"""

import math
import os
import sys
import bpy
import bmesh
from mathutils import Vector, Euler

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_ROOT = os.path.join(REPO_ROOT, "public", "models", "angel")
PREVIEW_DIR = os.environ.get("ANGEL_PREVIEW_DIR", "")
FACE_PREVIEW_PNG = os.environ.get("ANGEL_FACE_PNG", "")


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(name, base_color=(0.95, 0.79, 0.69, 1.0), roughness=0.45, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def apply_subsurf_smooth(obj, levels=1):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if levels > 0:
        sub = obj.modifiers.new(name="Subsurf", type="SUBSURF")
        sub.levels = levels
        sub.render_levels = levels
        bpy.ops.object.modifier_apply(modifier=sub.name)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


def join_objects(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for poly in joined.data.polygons:
        poly.use_smooth = True
    return joined


def add_ellipsoid(name, loc, scale, rot=(0.0, 0.0, 0.0), segs=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segs, ring_count=rings, radius=1.0, location=loc, rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def create_loft_tube(name, rings_spec, segs=24, cap_bottom=True, cap_top=True):
    bm = bmesh.new()
    ring_verts = []
    for cx, cy, cz, rx, ry, rz in rings_spec:
        row = []
        cos_r, sin_r = math.cos(rz), math.sin(rz)
        for i in range(segs):
            a = (i / segs) * math.pi * 2.0
            lx = math.cos(a) * rx
            ly = math.sin(a) * ry
            wx = cx + lx * cos_r - ly * sin_r
            wy = cy + lx * sin_r + ly * cos_r
            row.append(bm.verts.new((wx, wy, cz)))
        ring_verts.append(row)

    for r in range(len(ring_verts) - 1):
        r0, r1 = ring_verts[r], ring_verts[r + 1]
        for i in range(segs):
            ni = (i + 1) % segs
            f = bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))
            f.smooth = True

    if cap_bottom and ring_verts:
        b0 = ring_verts[0]
        vc = bm.verts.new(
            (sum(v.co.x for v in b0) / segs, sum(v.co.y for v in b0) / segs, b0[0].co.z)
        )
        for i in range(segs):
            ni = (i + 1) % segs
            f = bm.faces.new((b0[ni], b0[i], vc))
            f.smooth = True

    if cap_top and ring_verts:
        bt = ring_verts[-1]
        vc = bm.verts.new(
            (sum(v.co.x for v in bt) / segs, sum(v.co.y for v in bt) / segs, bt[0].co.z)
        )
        for i in range(segs):
            ni = (i + 1) % segs
            f = bm.faces.new((bt[i], bt[ni], vc))
            f.smooth = True

    mesh = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def create_capsule(name, p0, p1, r0, r1, segs=16):
    v0, v1 = Vector(p0), Vector(p1)
    axis = v1 - v0
    length = max(axis.length, 1e-4)
    mid = (v0 + v1) * 0.5
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r0, radius2=r1, depth=length
    )
    mesh = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = mid
    obj.rotation_euler = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_euler()
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)
    c0 = add_ellipsoid(name + "_c0", p0, (r0, r0, r0), segs=segs, rings=10)
    c1 = add_ellipsoid(name + "_c1", p1, (r1, r1, r1), segs=segs, rings=10)
    return [obj, c0, c1]


def build_sculpted_ear(sx):
    """Creates a realistic C-shaped cupped baby ear (outer helix rim + concha hollow + lobe)."""
    parts = []
    # Outer ear shell tilted back ~18 deg and tucked along head side
    ear_base = add_ellipsoid(
        f"EarShell_{sx}",
        (sx * 0.160, 0.015, 0.695),
        (0.022, 0.028, 0.044),
        rot=(0.15, sx * 0.18, sx * -0.22),
        segs=24,
        rings=16,
    )
    # Carve concave concha hollow on the front-outer surface + raised C-rim
    bm = bmesh.new()
    bm.from_mesh(ear_base.data)
    for v in bm.verts:
        # Local offset from ear center
        dx = abs(v.co.x) - 0.160
        dy = v.co.y - 0.012
        dz = v.co.z - 0.695
        # Only shape outer-facing vertices
        if dx > 0.002 and dy < 0.018:
            r_in = math.sqrt((dy / 0.018) ** 2 + (dz / 0.028) ** 2)
            if r_in < 0.75:
                # Depress concha bowl inward toward head
                depth = 0.011 * math.cos(r_in * math.pi * 0.65)
                v.co.x -= sx * depth
            elif r_in < 1.15:
                # Subtle helix rim ridge
                v.co.x += sx * 0.003
    bm.to_mesh(ear_base.data)
    bm.free()
    ear_base.data.update()
    parts.append(ear_base)
    return parts


def build_hand_with_fingers(sx):
    """Creates a cute upturned toddler hand with a thumb and 4 sculpted baby fingers."""
    parts = []
    # Palm pad at wrist (sx*0.162, -0.018, 0.332)
    palm = add_ellipsoid(
        f"Palm_{sx}",
        (sx * 0.175, -0.022, 0.320),
        (0.024, 0.019, 0.022),
        rot=(0.15, sx * -0.45, 0.0),
        segs=18,
        rings=12,
    )
    parts.append(palm)

    # Thumb pointing forward-inward
    parts.extend(
        create_capsule(
            f"Thumb_{sx}",
            (sx * 0.168, -0.032, 0.324),
            (sx * 0.160, -0.048, 0.308),
            0.0085,
            0.0065,
            segs=12,
        )
    )

    # 4 little fingers splayed gently outward & curled slightly
    finger_specs = [
        (-0.024, 0.022, 0.0075),  # index
        (-0.014, 0.025, 0.0078),  # middle
        (-0.003, 0.023, 0.0072),  # ring
        (0.008, 0.019, 0.0065),   # pinky
    ]
    for fi, (oy, flen, rad) in enumerate(finger_specs):
        p0 = (sx * 0.184, -0.020 + oy * 0.55, 0.312)
        p1 = (sx * (0.184 + flen * 0.88), -0.022 + oy * 0.95, 0.312 - flen * 0.52)
        parts.extend(create_capsule(f"Finger_{sx}_{fi}", p0, p1, rad, rad * 0.78, segs=10))
    return parts


def build_foot_with_toes(sx):
    """Creates a flat-soled toddler foot with 5 distinct rounded toes."""
    parts = []
    # Rounded foot base
    foot = add_ellipsoid(
        f"FootBase_{sx}",
        (sx * 0.056, -0.026, 0.022),
        (0.044, 0.056, 0.024),
        rot=(0.0, 0.0, sx * -0.06),
        segs=24,
        rings=16,
    )
    parts.append(foot)

    # 5 distinct toes along the front edge (inner big toe -> outer pinky toe)
    toe_specs = [
        (0.026, -0.078, 0.0135, 0.014),  # big toe (inner)
        (0.042, -0.080, 0.0110, 0.012),  # 2nd toe
        (0.056, -0.078, 0.0102, 0.011),  # 3rd toe
        (0.070, -0.074, 0.0095, 0.010),  # 4th toe
        (0.083, -0.068, 0.0085, 0.009),  # pinky toe
    ]
    for ti, (tx_abs, ty, rad, length) in enumerate(toe_specs):
        p0 = (sx * tx_abs, ty + length, 0.015)
        p1 = (sx * tx_abs, ty, 0.014)
        parts.extend(create_capsule(f"Toe_{sx}_{ti}", p0, p1, rad, rad * 0.85, segs=12))
    return parts


def build_base_angel():
    """Builds a seamless, organic, reference-accurate bald Angel base (height 1.00m)."""
    parts = []

    # 1. Rounder Baby Head sitting low on shoulders (less egg-shaped, ratio ~1:1.11)
    head = add_ellipsoid("Head", (0.0, 0.0, 0.758), (0.166, 0.162, 0.184), segs=48, rings=32)
    bm = bmesh.new()
    bm.from_mesh(head.data)
    for v in bm.verts:
        # Soft round baby cheeks lower down, gentle chin tuck
        if v.co.z < 0.74:
            t = min(1.0, (0.74 - v.co.z) / 0.14)
            cheek = math.sin(t * math.pi)
            v.co.x *= 1.0 + 0.055 * cheek
            if v.co.y < 0:
                v.co.y *= 1.0 + 0.065 * cheek
        # Distinct soft baby button nose
        dx = v.co.x
        dz = v.co.z - 0.674
        if v.co.y < -0.05:
            dist2 = dx * dx + dz * dz
            if dist2 < 0.0026:
                bump = 0.026 * math.exp(-dist2 / (2.0 * 0.020 * 0.020))
                v.co.y -= bump
    bm.to_mesh(head.data)
    bm.free()
    head.data.update()
    parts.append(head)

    # C-shaped cupped ears
    for sx in (-1.0, 1.0):
        parts.extend(build_sculpted_ear(sx))

    # 2. Chest-to-Belly Toddler Torso + Seamless Pelvis-to-Thigh Blend (zero horizontal lip!)
    torso_rings = [
        (0.0, 0.004, 0.258, 0.056, 0.064, 0.0),   # rounded crotch/pelvis center
        (0.0, -0.002, 0.295, 0.094, 0.084, 0.0),  # smooth hip taper into thighs
        (0.0, -0.010, 0.340, 0.106, 0.096, 0.0),  # lower soft baby belly peak
        (0.0, -0.006, 0.400, 0.098, 0.088, 0.0),  # mid tummy taper
        (0.0, -0.002, 0.458, 0.090, 0.080, 0.0),  # slimmer sloped chest
        (0.0, 0.004, 0.515, 0.086, 0.075, 0.0),   # sloped shoulders
        (0.0, 0.006, 0.558, 0.066, 0.062, 0.0),   # short neck base
        (0.0, 0.006, 0.592, 0.062, 0.058, 0.0),   # tucked into head
    ]
    torso = create_loft_tube("Torso", torso_rings, segs=32, cap_bottom=True, cap_top=True)
    # Subtle lumbar back S-curve & tiny navel dimple
    bm_t = bmesh.new()
    bm_t.from_mesh(torso.data)
    for v in bm_t.verts:
        # Subtle lumbar inward curve above buttocks
        if v.co.y > 0.02 and 0.35 < v.co.z < 0.46:
            v.co.y -= 0.009 * math.sin(((v.co.z - 0.35) / 0.11) * math.pi)
        # Belly button dimple
        if v.co.y < -0.05:
            d2 = v.co.x * v.co.x + (v.co.z - 0.336) ** 2
            if d2 < 0.0004:
                v.co.y += 0.010 * math.exp(-d2 / (2.0 * 0.0075 * 0.0075))
    bm_t.to_mesh(torso.data)
    bm_t.free()
    torso.data.update()
    parts.append(torso)

    # Soft toddler buttocks cheeks on the back
    for sx in (-1.0, 1.0):
        parts.append(
            add_ellipsoid(
                f"CheekButt_{sx}",
                (sx * 0.040, 0.044, 0.296),
                (0.050, 0.044, 0.054),
                segs=20,
                rings=14,
            )
        )

    # 3. Seamless Shoulder Bridges + Arms + Fingers
    for sx in (-1.0, 1.0):
        # Smoothly blend shoulder into upper arm
        parts.extend(
            create_capsule(
                f"UpperArm_{sx}",
                (sx * 0.068, 0.002, 0.508),
                (sx * 0.132, -0.008, 0.422),
                0.044,
                0.032,
                segs=18,
            )
        )
        parts.extend(
            create_capsule(
                f"Forearm_{sx}",
                (sx * 0.132, -0.008, 0.422),
                (sx * 0.168, -0.020, 0.328),
                0.032,
                0.023,
                segs=18,
            )
        )
        parts.extend(build_hand_with_fingers(sx))

    # 4. Seamless Hip Bridges + Legs + Feet with 5 Toes (front aligned with lower belly!)
    for sx in (-1.0, 1.0):
        parts.extend(
            create_capsule(
                f"Thigh_{sx}",
                (sx * 0.046, -0.024, 0.345),
                (sx * 0.053, -0.008, 0.175),
                0.062,
                0.048,
                segs=20,
            )
        )
        parts.extend(
            create_capsule(
                f"Shin_{sx}",
                (sx * 0.053, -0.002, 0.170),
                (sx * 0.056, -0.004, 0.042),
                0.048,
                0.040,
                segs=20,
            )
        )
        parts.extend(build_foot_with_toes(sx))

    # Join & run fine Voxel Union + Smooth + Corrective Smooth + Decimate so EVERY
    # shoulder, hip, ear, finger, and toe blends seamlessly into a valid watertight mesh!
    body = join_objects(parts, "AngelBody")
    bpy.context.view_layer.objects.active = body
    body.select_set(True)

    remesh = body.modifiers.new(name="VoxelUnion", type="REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = 0.0028
    remesh.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=remesh.name)

    smooth = body.modifiers.new(name="Smooth", type="SMOOTH")
    smooth.factor = 0.58
    smooth.iterations = 24
    bpy.ops.object.modifier_apply(modifier=smooth.name)

    csmooth = body.modifiers.new(name="CorrectiveSmooth", type="CORRECTIVE_SMOOTH")
    csmooth.factor = 0.6
    csmooth.iterations = 12
    csmooth.smooth_type = "LENGTH_WEIGHTED"
    bpy.ops.object.modifier_apply(modifier=csmooth.name)

    decimate = body.modifiers.new(name="Decimate", type="DECIMATE")
    decimate.ratio = 0.25
    bpy.ops.object.modifier_apply(modifier=decimate.name)

    for poly in body.data.polygons:
        poly.use_smooth = True
    bpy.ops.object.shade_smooth()
    body.select_set(False)

    # Normalize soles to z=0.00 and crown to z=1.00
    bm_b = bmesh.new()
    bm_b.from_mesh(body.data)
    min_z = min(v.co.z for v in bm_b.verts)
    for v in bm_b.verts:
        v.co.z -= min_z
        if v.co.z < 0.003:
            v.co.z = 0.0
    max_z = max(v.co.z for v in bm_b.verts)
    scale_f = 1.0 / max_z
    for v in bm_b.verts:
        v.co *= scale_f
    bm_b.normal_update()
    bm_b.to_mesh(body.data)
    bm_b.free()
    body.data.validate(verbose=False)
    body.data.update()

    body.data.materials.append(make_material("mat_skin", (0.95, 0.79, 0.69, 1.0), roughness=0.52))

    # 5. Conformal Face Overlay Patch (UV-mapped)
    face_patch = build_face_overlay(head_ref=body)
    face_patch.data.materials.append(
        make_material("mat_face_overlay", (1.0, 1.0, 1.0, 1.0), roughness=0.85)
    )

    # 6. Sculpted Fan Angel Wings on upper back
    wings = build_angel_wings()
    wings.data.materials.append(make_material("mat_wings", (0.98, 0.97, 0.96, 1.0), roughness=0.35))

    return body, face_patch, wings


def build_face_overlay(head_ref):
    bm = bmesh.new()
    nx, nz = 24, 24
    x0, x1 = -0.144, 0.144
    z0, z1 = 0.585, 0.840

    verts = []
    for j in range(nz + 1):
        row = []
        vz = z0 + (z1 - z0) * (j / nz)
        v_norm = (vz - 0.710) / 0.125
        for i in range(nx + 1):
            vx = x0 + (x1 - x0) * (i / nx)
            u_norm = vx / 0.145
            vy = -0.185 + 0.052 * (u_norm * u_norm + 0.35 * v_norm * v_norm)
            row.append(bm.verts.new((vx, vy, vz)))
        verts.append(row)

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for j in range(nz):
        for i in range(nx):
            f = bm.faces.new(
                (verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i])
            )
            f.smooth = True
            uvs = [
                (i / nx, j / nz),
                ((i + 1) / nx, j / nz),
                ((i + 1) / nx, (j + 1) / nz),
                (i / nx, (j + 1) / nz),
            ]
            for loop, uv in zip(f.loops, uvs):
                loop[uv_layer].uv = uv

    mesh = bpy.data.meshes.new("FaceOverlay_mesh")
    bm.to_mesh(mesh)
    bm.free()

    patch = bpy.data.objects.new("FaceOverlay", mesh)
    bpy.context.collection.objects.link(patch)

    bpy.context.view_layer.objects.active = patch
    sw = patch.modifiers.new(name="Shrinkwrap", type="SHRINKWRAP")
    sw.target = head_ref
    sw.wrap_method = "NEAREST_SURFACEPOINT"
    sw.offset = 0.0022
    bpy.ops.object.modifier_apply(modifier=sw.name)
    return patch


def build_angel_wings():
    wing_parts = []
    for sx in (-1.0, 1.0):
        for fi, (ox, oz, sx_len, sz_len, rot_y) in enumerate([
            (0.044, 0.502, 0.042, 0.016, 0.25),
            (0.040, 0.484, 0.036, 0.014, 0.12),
            (0.035, 0.468, 0.028, 0.012, 0.02),
        ]):
            w = add_ellipsoid(
                f"Wing_{sx}_{fi}",
                (sx * ox, 0.088, oz),
                (sx_len, 0.012, sz_len),
                rot=(0.12, sx * -rot_y, sx * -0.18),
                segs=18,
                rings=12,
            )
            wing_parts.append(w)
    wings = join_objects(wing_parts, "AngelWings")
    apply_subsurf_smooth(wings, levels=1)
    return wings


def export_glb(objs, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
    )
    print(f"Exported: {filepath} ({os.path.getsize(filepath)} bytes)")


# --- Starter Capsule Wardrobe (fitted cleanly to v3 rounder head & sloped torso) ---

def build_hair_short_crop():
    parts = [
        add_ellipsoid("Crown", (0.0, 0.008, 0.818), (0.178, 0.176, 0.168), segs=28, rings=18),
        add_ellipsoid("BackCap", (0.0, 0.068, 0.742), (0.166, 0.115, 0.145), segs=24, rings=16),
    ]
    for i in range(7):
        ang = -0.75 + i * 0.25
        bx = math.sin(ang) * 0.142
        by = -math.cos(ang) * 0.150
        parts.append(
            add_ellipsoid(
                f"Bang_{i}",
                (bx, by, 0.862),
                (0.036, 0.020, 0.044),
                rot=(0.25, 0.0, ang * 0.7),
                segs=16,
                rings=10,
            )
        )
    hair = join_objects(parts, "HairShortCrop")
    apply_subsurf_smooth(hair, levels=1)
    hair.data.materials.append(make_material("mat_hair", (0.12, 0.10, 0.11, 1.0), 0.55))
    return [hair]


def build_hair_long_bob():
    parts = [
        add_ellipsoid("Crown", (0.0, 0.008, 0.818), (0.180, 0.178, 0.172), segs=28, rings=18),
        add_ellipsoid("BackCurtain", (0.0, 0.082, 0.675), (0.176, 0.102, 0.168), segs=24, rings=16),
    ]
    for sx in (-1.0, 1.0):
        side = create_loft_tube(
            f"SideLock_{sx}",
            [
                (sx * 0.162, -0.025, 0.805, 0.040, 0.044, 0.0),
                (sx * 0.174, -0.032, 0.695, 0.044, 0.048, 0.0),
                (sx * 0.180, -0.035, 0.595, 0.048, 0.050, 0.0),
            ],
            segs=16,
        )
        parts.append(side)
    hair = join_objects(parts, "HairLongBob")
    apply_subsurf_smooth(hair, levels=1)
    hair.data.materials.append(make_material("mat_hair", (0.22, 0.14, 0.10, 1.0), 0.50))
    return [hair]


def build_acc_round_glasses():
    parts = []
    for sx in (-1.0, 1.0):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.042,
            minor_radius=0.0048,
            major_segments=28,
            minor_segments=10,
            location=(sx * 0.064, -0.174, 0.696),
            rotation=(math.pi / 2, 0.0, sx * -0.12),
        )
        parts.append(bpy.context.active_object)
        temple = create_loft_tube(
            f"Temple_{sx}",
            [
                (sx * 0.104, -0.168, 0.700, 0.004, 0.004, 0.0),
                (sx * 0.166, 0.015, 0.702, 0.004, 0.004, 0.0),
            ],
            segs=8,
        )
        parts.append(temple)
    bridge = create_loft_tube(
        "Bridge",
        [
            (-0.020, -0.178, 0.700, 0.004, 0.004, 0.0),
            (0.020, -0.178, 0.700, 0.004, 0.004, 0.0),
        ],
        segs=8,
    )
    parts.append(bridge)
    glasses = join_objects(parts, "RoundGlasses")
    glasses.data.materials.append(
        make_material("mat_accessory", (0.12, 0.12, 0.14, 1.0), 0.22, metallic=0.85)
    )
    return [glasses]


def build_acc_halo():
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.126,
        minor_radius=0.012,
        major_segments=40,
        minor_segments=14,
        location=(0.0, 0.010, 1.055),
        rotation=(-0.14, 0.0, 0.0),
    )
    halo = bpy.context.active_object
    halo.name = "Halo"
    for poly in halo.data.polygons:
        poly.use_smooth = True
    halo.data.materials.append(
        make_material("mat_accessory", (0.95, 0.85, 0.35, 1.0), 0.18, metallic=0.9)
    )
    return [halo]


def build_top_oversized_hoodie():
    torso = create_loft_tube(
        "HoodieTorso",
        [
            (0.0, -0.010, 0.305, 0.128, 0.122, 0.0),
            (0.0, -0.012, 0.365, 0.128, 0.122, 0.0),
            (0.0, -0.006, 0.455, 0.116, 0.106, 0.0),
            (0.0, 0.002, 0.525, 0.106, 0.094, 0.0),
            (0.0, 0.006, 0.562, 0.082, 0.078, 0.0),
        ],
        segs=24,
    )
    parts = [
        torso,
        add_ellipsoid("HoodBack", (0.0, 0.078, 0.545), (0.090, 0.056, 0.044), rot=(-0.35, 0.0, 0.0)),
    ]
    for sx in (-1.0, 1.0):
        sleeve = create_loft_tube(
            f"Sleeve_{sx}",
            [
                (sx * 0.072, 0.002, 0.512, 0.048, 0.048, 0.0),
                (sx * 0.105, -0.004, 0.465, 0.050, 0.050, 0.0),
                (sx * 0.135, -0.010, 0.415, 0.044, 0.044, 0.0),
                (sx * 0.162, -0.018, 0.348, 0.038, 0.036, 0.0),
            ],
            segs=16,
        )
        parts.append(sleeve)
    hoodie = join_objects(parts, "OversizedHoodie")
    apply_subsurf_smooth(hoodie, levels=1)
    hoodie.data.materials.append(make_material("mat_top", (0.92, 0.42, 0.18, 1.0), 0.65))
    return [hoodie]


def build_top_graphic_tee():
    torso = create_loft_tube(
        "TeeTorso",
        [
            (0.0, -0.010, 0.315, 0.122, 0.116, 0.0),
            (0.0, -0.012, 0.365, 0.122, 0.116, 0.0),
            (0.0, -0.006, 0.455, 0.112, 0.100, 0.0),
            (0.0, 0.002, 0.525, 0.102, 0.090, 0.0),
            (0.0, 0.006, 0.558, 0.078, 0.074, 0.0),
        ],
        segs=24,
    )
    parts = [torso]
    for sx in (-1.0, 1.0):
        sleeve = create_loft_tube(
            f"ShortSleeve_{sx}",
            [
                (sx * 0.072, 0.002, 0.512, 0.046, 0.046, 0.0),
                (sx * 0.122, -0.006, 0.440, 0.044, 0.044, 0.0),
            ],
            segs=16,
        )
        parts.append(sleeve)
    tee = join_objects(parts, "GraphicTee")
    apply_subsurf_smooth(tee, levels=1)
    tee.data.materials.append(make_material("mat_top", (0.94, 0.94, 0.96, 1.0), 0.60))
    return [tee]


def build_bottom_athletic_shorts():
    waist = create_loft_tube(
        "ShortsWaist",
        [
            (0.0, 0.004, 0.248, 0.120, 0.112, 0.0),
            (0.0, -0.006, 0.295, 0.126, 0.118, 0.0),
            (0.0, -0.012, 0.338, 0.126, 0.118, 0.0),
        ],
        segs=24,
    )
    parts = [waist]
    for sx in (-1.0, 1.0):
        parts.append(
            create_loft_tube(
                f"ShortLeg_{sx}",
                [
                    (sx * 0.052, 0.000, 0.280, 0.066, 0.066, 0.0),
                    (sx * 0.054, -0.002, 0.190, 0.062, 0.062, 0.0),
                ],
                segs=18,
            )
        )
    shorts = join_objects(parts, "AthleticShorts")
    apply_subsurf_smooth(shorts, levels=1)
    shorts.data.materials.append(make_material("mat_bottom", (0.28, 0.30, 0.42, 1.0), 0.65))
    return [shorts]


def build_bottom_cargo_pants():
    waist = create_loft_tube(
        "PantsWaist",
        [
            (0.0, 0.004, 0.248, 0.120, 0.112, 0.0),
            (0.0, -0.006, 0.295, 0.126, 0.118, 0.0),
            (0.0, -0.012, 0.338, 0.126, 0.118, 0.0),
        ],
        segs=24,
    )
    parts = [waist]
    for sx in (-1.0, 1.0):
        parts.append(
            create_loft_tube(
                f"PantLeg_{sx}",
                [
                    (sx * 0.052, 0.000, 0.280, 0.066, 0.066, 0.0),
                    (sx * 0.054, -0.002, 0.165, 0.060, 0.060, 0.0),
                    (sx * 0.056, -0.002, 0.062, 0.054, 0.054, 0.0),
                ],
                segs=18,
            )
        )
        parts.append(
            add_ellipsoid(f"CargoPocket_{sx}", (sx * 0.110, -0.002, 0.175), (0.018, 0.030, 0.036))
        )
    pants = join_objects(parts, "CargoPants")
    apply_subsurf_smooth(pants, levels=1)
    pants.data.materials.append(make_material("mat_bottom", (0.24, 0.28, 0.24, 1.0), 0.70))
    return [pants]


def build_footwear_sneakers():
    parts = []
    for sx in (-1.0, 1.0):
        parts.append(
            create_loft_tube(
                f"Sneaker_{sx}",
                [
                    (sx * 0.056, -0.034, 0.000, 0.056, 0.074, sx * -0.05),
                    (sx * 0.056, -0.034, 0.036, 0.058, 0.078, sx * -0.05),
                    (sx * 0.056, -0.010, 0.062, 0.050, 0.054, sx * -0.05),
                ],
                segs=20,
            )
        )
    shoes = join_objects(parts, "Sneakers")
    apply_subsurf_smooth(shoes, levels=1)
    shoes.data.materials.append(make_material("mat_footwear", (0.94, 0.94, 0.95, 1.0), 0.45))
    return [shoes]


def build_footwear_slides():
    parts = []
    for sx in (-1.0, 1.0):
        parts.append(
            create_loft_tube(
                f"SlideSole_{sx}",
                [
                    (sx * 0.056, -0.032, 0.000, 0.054, 0.072, sx * -0.05),
                    (sx * 0.056, -0.032, 0.016, 0.056, 0.074, sx * -0.05),
                ],
                segs=20,
            )
        )
        parts.append(
            add_ellipsoid(
                f"SlideStrap_{sx}",
                (sx * 0.056, -0.038, 0.036),
                (0.052, 0.030, 0.022),
                rot=(0.0, 0.0, sx * -0.05),
            )
        )
    slides = join_objects(parts, "Slides")
    apply_subsurf_smooth(slides, levels=1)
    slides.data.materials.append(make_material("mat_footwear", (0.14, 0.14, 0.16, 1.0), 0.40))
    return [slides]


def setup_face_preview_material(face_patch, face_png_path):
    """Binds the generated face PNG onto mat_face_overlay in Blender for visual comparison."""
    mat = face_patch.data.materials[0]
    mat.blend_method = "BLEND" if hasattr(mat, "blend_method") else "BLEND"
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    tex_node = nodes.new(type="ShaderNodeTexImage")
    img = bpy.data.images.load(face_png_path)
    tex_node.image = img
    if bsdf:
        links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
        links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])


def render_preview_view(cam_loc, target, out_png, lens=50.0):
    if not PREVIEW_DIR:
        return
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    # Remove previous preview cams/lights
    for obj in list(bpy.data.objects):
        if obj.type in ("CAMERA", "LIGHT"):
            bpy.data.objects.remove(obj, do_unlink=True)

    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_data.lens = lens
    cam = bpy.data.objects.new("PreviewCam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = cam_loc
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam

    light_data = bpy.data.lights.new(name="Key", type="SUN")
    light_data.energy = 2.6
    light = bpy.data.objects.new("Key", light_data)
    bpy.context.collection.objects.link(light)
    light.rotation_euler = Euler((0.65, 0.25, -0.4))

    fill_data = bpy.data.lights.new(name="Fill", type="AREA")
    fill_data.energy = 45.0
    fill = bpy.data.objects.new("Fill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-1.2, -1.5, 0.9)
    fill.rotation_euler = (Vector((0, 0, 0.5)) - fill.location).to_track_quat("-Z", "Y").to_euler()

    back_data = bpy.data.lights.new(name="BackFill", type="AREA")
    back_data.energy = 65.0
    back_l = bpy.data.objects.new("BackFill", back_data)
    bpy.context.collection.objects.link(back_l)
    back_l.location = (0.4, 1.8, 0.9)
    back_l.rotation_euler = (Vector((0, 0, 0.5)) - back_l.location).to_track_quat("-Z", "Y").to_euler()

    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.14, 0.135, 0.165, 1.0)
        bg.inputs["Strength"].default_value = 0.9

    scene = bpy.context.scene
    scene.render.engine = (
        "BLENDER_EEVEE_NEXT"
        if "BLENDER_EEVEE_NEXT"
        in [e.identifier for e in scene.render.bl_rna.properties["engine"].enum_items]
        else "CYCLES"
    )
    scene.render.resolution_x = 512
    scene.render.resolution_y = 640
    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)


def main():
    clear_scene()
    body, face_patch, wings = build_base_angel()
    export_glb([body, face_patch, wings], os.path.join(OUT_ROOT, "base-angel.glb"))

    builders = [
        ("hair/short-crop.glb", build_hair_short_crop),
        ("hair/long-bob.glb", build_hair_long_bob),
        ("accessories/round-glasses.glb", build_acc_round_glasses),
        ("accessories/halo.glb", build_acc_halo),
        ("tops/oversized-hoodie.glb", build_top_oversized_hoodie),
        ("tops/graphic-tee.glb", build_top_graphic_tee),
        ("bottoms/athletic-shorts.glb", build_bottom_athletic_shorts),
        ("bottoms/cargo-pants.glb", build_bottom_cargo_pants),
        ("footwear/sneakers.glb", build_footwear_sneakers),
        ("footwear/slides.glb", build_footwear_slides),
    ]

    for rel_path, fn in builders:
        clear_scene()
        objs = fn()
        export_glb(objs, os.path.join(OUT_ROOT, rel_path))

    if PREVIEW_DIR:
        clear_scene()
        body, face_patch, wings = build_base_angel()
        if FACE_PREVIEW_PNG and os.path.exists(FACE_PREVIEW_PNG):
            setup_face_preview_material(face_patch, FACE_PREVIEW_PNG)

        render_preview_view((0.0, -1.78, 0.54), (0.0, 0.0, 0.50), os.path.join(PREVIEW_DIR, "base-front.png"))
        render_preview_view((0.0, -0.92, 0.72), (0.0, 0.0, 0.71), os.path.join(PREVIEW_DIR, "base-face.png"), lens=65.0)
        render_preview_view((0.60, -1.66, 0.62), (0.0, 0.0, 0.50), os.path.join(PREVIEW_DIR, "base-34.png"))
        render_preview_view((0.0, 1.78, 0.54), (0.0, 0.0, 0.50), os.path.join(PREVIEW_DIR, "base-back.png"))


if __name__ == "__main__":
    main()
