"""Creative-3D lab scene «حبرة والكتاب»: an ink-drop creature hops to a closed book, bumps it open, and a spark rises.

Run inside a live Blender through the Blender MCP (`execute_blender_code`), one step per call:
    exec(open('/abs/path/reels/creative-3d/lab/scene.py').read()); build()      # geometry + materials
    ...; animate()                                                                # keyframes
    ...; stage()                                                                  # camera, lights, render settings
    ...; print(verify())                                                          # read-only proof (keyframes, motion)
    ...; save('/abs/path/reels/creative-3d/lab/lab.blend')                        # copy of the file, live session untouched
Everything lives in its own scene (SCENE) and collection, so the user's scenes are never touched. Original geometry only
(bmesh primitives deformed in code); no assets, no add-ons. Blender 4.2+ (tested on 4.5 LTS).
"""
import json
import math

import bmesh
import bpy

SCENE, COLL = 'Creative_Reels_Anim', 'Creative_Reels_Anim'
FPS, FRAMES = 24, 96          # a 4 s preview


def _mat(name, rgb, rough=0.5, emit=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = rough
    if emit:
        p.inputs['Emission Color'].default_value = (*rgb, 1)
        p.inputs['Emission Strength'].default_value = emit
    return m


def _mesh(name, build, mat, parent=None, loc=(0, 0, 0), scale=(1, 1, 1), smooth=True, subsurf=0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    build(bm)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    o = bpy.data.objects.new(name, me)
    bpy.data.collections[COLL].objects.link(o)
    o.location, o.scale, o.parent = loc, scale, parent
    me.materials.append(mat)
    if subsurf:
        mod = o.modifiers.new('Subsurf', 'SUBSURF')
        mod.levels, mod.render_levels = 1, subsurf
    return o


def _empty(name, parent=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    bpy.data.collections[COLL].objects.link(o)
    o.location, o.parent, o.empty_display_size = loc, parent, 0.3
    return o


def _sphere(r, seg=32, ring=16):
    return lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)


def _box(x, y, z):
    def b(bm):
        bmesh.ops.create_cube(bm, size=1)
        bmesh.ops.scale(bm, vec=(x, y, z), verts=bm.verts)
    return b


def _drop(bm, r=0.55):
    """A teardrop standing on z = 0: a sphere lifted onto the floor, its top half tapered and stretched."""
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=r)
    for v in bm.verts:
        v.co.z += r
        if v.co.z > r:
            t = (v.co.z - r) / r
            k = 1 - 0.45 * t * t
            v.co.x *= k
            v.co.y *= k
            v.co.z = r + (v.co.z - r) * 1.35


def _sweep(bm, w=30.0, r=3.0, back=5.0):
    """A photo-studio cyclorama: floor, a quarter-circle curve, then a wall (no visible horizon)."""
    prof = [(y, 0.0) for y in (-14.0, -6.0, 0.0, back)]
    prof += [(back + r * math.sin(a), r - r * math.cos(a)) for a in [i * math.pi / 2 / 12 for i in range(1, 13)]]
    prof += [(back + r, 14.0)]
    rows = [[bm.verts.new((x, y, z)) for (y, z) in prof] for x in (-w / 2, w / 2)]
    for i in range(len(prof) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))


def build():
    """Geometry and materials in a fresh scene of our own (rebuilt if it already exists)."""
    old = bpy.data.scenes.get(SCENE)
    if old:
        for o in list(bpy.data.collections[COLL].objects):
            bpy.data.objects.remove(o)
        bpy.data.scenes.remove(old)
    sc = bpy.data.scenes.new(SCENE)
    bpy.context.window.scene = sc
    col = bpy.data.collections.get(COLL) or bpy.data.collections.new(COLL)
    sc.collection.children.link(col)

    ink, foot = _mat('HB_Ink', (0.03, 0.12, 0.75), 0.35), _mat('HB_Foot', (0.02, 0.06, 0.38), 0.6)
    white, dark = _mat('HB_EyeWhite', (0.95, 0.95, 0.95), 0.2), _mat('HB_Pupil', (0.02, 0.01, 0.04), 0.1)
    blush, cover = _mat('HB_Blush', (0.85, 0.25, 0.5), 0.6), _mat('HB_Cover', (0.75, 0.06, 0.33), 0.45)
    pages, studio = _mat('HB_Pages', (0.92, 0.9, 0.85), 0.8), _mat('HB_Studio', (0.82, 0.76, 0.9), 0.85)
    spark = _mat('HB_Spark', (0.2, 1.0, 0.75), 0.3, emit=8.0)

    _mesh('Studio', _sweep, studio, smooth=False)

    # the character «حبرة»: root on the floor, body (squash/stretch from its base), face, feet on the root
    root = _empty('HB_Root', loc=(-1.7, 0, 0))
    root.rotation_euler.z = 0.55                                    # three-quarter view toward the book
    body = _mesh('HB_Body', _drop, ink, parent=root, subsurf=2)
    for s in (-1, 1):
        eye = _mesh(f'HB_Eye{"LR"[s > 0]}', _sphere(0.14), white, parent=body, loc=(0.17 * s, -0.43, 0.8))
        _mesh(f'HB_Pupil{"LR"[s > 0]}', _sphere(0.07), dark, parent=eye, loc=(0, -0.1, 0))
        _mesh(f'HB_Blush{"LR"[s > 0]}', _sphere(0.07), blush, parent=body, loc=(0.31 * s, -0.4, 0.6), scale=(1, 0.4, 0.6))
        _mesh(f'HB_Foot{"LR"[s > 0]}', _sphere(0.16), foot, parent=root, loc=(0.22 * s, -0.05, 0.06), scale=(1.2, 1.4, 0.55))

    # the book, lying flat; its spine (the hinge) on the right, free edge toward the character
    book = _empty('BK_Root', loc=(0.9, 0, 0))
    _mesh('BK_Back', _box(0.8, 0.6, 0.035), cover, parent=book, loc=(-0.4, 0, 0.0175), smooth=False)
    _mesh('BK_Pages', _box(0.76, 0.56, 0.12), pages, parent=book, loc=(-0.4, 0, 0.095), smooth=False)
    hinge = _empty('BK_Hinge', parent=book, loc=(0, 0, 0.155))
    _mesh('BK_Cover', _box(0.8, 0.6, 0.035), cover, parent=hinge, loc=(-0.4, 0, 0.0175), smooth=False)

    # the spark that comes out of the open book, with its own light
    sp = _mesh('SP_Spark', lambda bm: bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.18), spark, parent=book,
               loc=(-0.4, 0, 0.2), smooth=False)
    glow = bpy.data.objects.new('SP_Light', bpy.data.lights.new('SP_Light', 'POINT'))
    glow.data.color, glow.data.shadow_soft_size = (0.4, 1.0, 0.8), 0.2
    col.objects.link(glow)
    glow.parent = sp
    return {'scene': sc.name, 'objects': sorted(o.name for o in col.objects)}


def _key(owner, prop, frames):
    """frames: {frame: value} — set the property on its ID (object or light data), then key it."""
    for f, v in sorted(frames.items()):
        setattr(owner, prop, v)
        owner.keyframe_insert(data_path=prop, frame=f)


def animate():
    """Hop, hop, bump: the book slides and its cover flips open, a spark rises, the character spins for joy."""
    O = bpy.data.objects
    sc = bpy.data.scenes[SCENE]
    sc.frame_start, sc.frame_end, sc.render.fps = 1, FRAMES, FPS
    root, body, hinge, book, sp = O['HB_Root'], O['HB_Body'], O['BK_Hinge'], O['BK_Root'], O['SP_Spark']

    # two hops to the book, a lean back, a lunge (contact at 46), a recoil; later a happy jump
    _key(root, 'location', {1: (-1.7, 0, 0), 8: (-1.7, 0, 0), 14: (-1.42, 0, 0.45), 20: (-1.15, 0, 0), 24: (-1.15, 0, 0),
                            30: (-0.85, 0, 0.45), 36: (-0.55, 0, 0), 42: (-0.6, 0, 0), 46: (-0.35, 0, 0), 52: (-0.62, 0, 0),
                            70: (-0.62, 0, 0), 78: (-0.62, 0, 0.75), 86: (-0.62, 0, 0), 96: (-0.62, 0, 0)})
    _key(root, 'rotation_euler', {1: (0, 0, 0.55), 70: (0, 0, 0.55), 86: (0, 0, 0.55 + 2 * math.pi), 96: (0, 0, 0.55 + 2 * math.pi)})
    sq, st, n = (1.15, 1.15, 0.82), (0.92, 0.92, 1.12), (1, 1, 1)
    _key(body, 'scale', {1: n, 6: (1.12, 1.12, 0.85), 9: st, 14: n, 19: (0.95, 0.95, 1.08), 21: sq, 24: st, 30: n,
                         35: (0.95, 0.95, 1.08), 37: sq, 41: n, 46: (1.08, 1.08, 0.9), 50: n, 64: (1.05, 1.05, 0.95),
                         70: (1.12, 1.12, 0.84), 72: (0.9, 0.9, 1.15), 78: n, 85: (0.95, 0.95, 1.08), 87: (1.15, 1.15, 0.8),
                         91: (0.97, 0.97, 1.05), 96: n})
    _key(body, 'rotation_euler', {1: (0, 0, 0), 38: (0, 0, 0), 42: (0, -0.3, 0), 46: (0, 0.35, 0), 52: (0, -0.1, 0), 58: (0, 0, 0)})

    # the book: pushed at 46, slides and its cover flips open; the spark rises and glows; small bob after
    _key(book, 'location', {1: (0.9, 0, 0), 46: (0.9, 0, 0), 54: (1.22, 0, 0)})
    _key(hinge, 'rotation_euler', {1: (0, 0, 0), 46: (0, 0, 0), 52: (0, 1.6, 0), 58: (0, 2.95, 0), 61: (0, 2.7, 0), 65: (0, 2.95, 0)})
    _key(sp, 'location', {1: (-0.4, 0, 0.2), 55: (-0.4, 0, 0.2), 70: (-0.4, 0, 1.9), 83: (-0.4, 0, 2.05), 96: (-0.4, 0, 1.9)})
    _key(sp, 'scale', {1: (0, 0, 0), 55: (0, 0, 0), 62: (1.6, 1.6, 1.6), 66: (1.3, 1.3, 1.3)})
    _key(sp, 'rotation_euler', {55: (0, 0, 0), 96: (0.6, 0.3, 4 * math.pi)})
    _key(O['SP_Light'].data, 'energy', {1: 0.0, 55: 0.0, 64: 120.0, 96: 90.0})

    # eyes: a blink on the way, then they widen and look up at the spark
    for s in 'LR':
        eye, pupil = O[f'HB_Eye{s}'], O[f'HB_Pupil{s}']
        _key(eye, 'scale', {1: n, 26: n, 28: (1, 1, 0.1), 30: n, 60: n, 63: (1.2, 1.2, 1.2), 70: n})
        _key(pupil, 'location', {1: (0, -0.1, 0), 58: (0, -0.1, 0), 63: (0.03, -0.09, 0.07), 96: (0.03, -0.09, 0.07)})
    return {'keyed': sorted(o.name for o in bpy.data.collections[COLL].objects if o.animation_data and o.animation_data.action)}


def stage():
    """Vertical 9:16 camera with a slow push-in, soft key and cool rim lights, a fast Cycles preview setup."""
    sc, col = bpy.data.scenes[SCENE], bpy.data.collections[COLL]
    cam = bpy.data.objects.new('CAM', bpy.data.cameras.new('CAM'))
    col.objects.link(cam)
    cam.data.lens = 38
    sc.camera = cam
    for f, x, y in ((1, -0.15, -8.6), (FRAMES, 0.3, -7.8)):
        cam.location = (x, y, 1.6)
        cam.rotation_euler = (math.radians(86), 0, 0)
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
    for name, kind, loc, energy, size, color in (('KEY', 'AREA', (-3.5, -4.5, 5.5), 900, 5, (1, 0.97, 0.95)),
                                                 ('RIM', 'AREA', (3.5, 3.0, 4.0), 600, 3, (0.8, 0.88, 1.0))):
        L = bpy.data.objects.new(name, bpy.data.lights.new(name, kind))
        col.objects.link(L)
        L.location, L.data.energy, L.data.size, L.data.color = loc, energy, size, color
        L.rotation_euler = (-L.location).to_track_quat('-Z', 'Y').to_euler()     # aim at the origin
    world = sc.world or bpy.data.worlds.new('HB_World')
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.78, 0.72, 0.86, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6

    r = sc.render
    r.engine, r.resolution_x, r.resolution_y, r.resolution_percentage = 'CYCLES', 1080, 1920, 50
    r.fps, r.image_settings.file_format = FPS, 'PNG'
    sc.cycles.device, sc.cycles.samples, sc.cycles.use_denoising = 'CPU', 24, True
    sc.cycles.max_bounces = 4
    sc.view_settings.view_transform = 'AgX'
    return {'camera': cam.name, 'res': (r.resolution_x * r.resolution_percentage // 100, r.resolution_y * r.resolution_percentage // 100),
            'engine': r.engine, 'samples': sc.cycles.samples, 'frames': (sc.frame_start, sc.frame_end), 'fps': r.fps}


def _fcurves(o):
    act = o.animation_data.action if o.animation_data else None
    if act is None:
        return []
    try:
        return list(act.fcurves)            # 4.x legacy accessor (first slot)
    except AttributeError:                  # 5.x: layered actions
        return [fc for L in act.layers for s in L.strips for cb in s.channelbags for fc in cb.fcurves]


def verify():
    """Read-only proof: keyframes per object, and world positions sampled at key frames (does it really move?)."""
    sc, O = bpy.data.scenes[SCENE], bpy.data.objects
    keys = {}
    for o in bpy.data.collections[COLL].objects:
        fcs = _fcurves(o) + (_fcurves(o.data) if o.data is not None and hasattr(o.data, 'animation_data') else [])
        if fcs:
            frames = sorted({round(k.co.x) for fc in fcs for k in fc.keyframe_points})
            keys[o.name] = {'fcurves': len(fcs), 'keys': len(frames), 'range': [frames[0], frames[-1]]}
    probe = {}
    for f in (1, 20, 46, 54, 62, 78, 96):
        sc.frame_set(f)
        probe[f] = {n: [round(v, 2) for v in O[n].matrix_world.translation] for n in ('HB_Body', 'BK_Root', 'SP_Spark')}
        probe[f]['cover_angle_deg'] = round(math.degrees(O['BK_Hinge'].rotation_euler.y))
        probe[f]['body_scale_z'] = round(O['HB_Body'].scale.z, 2)
    sc.frame_set(1)
    return json.dumps({'scene': sc.name, 'frames': [sc.frame_start, sc.frame_end], 'fps': sc.render.fps,
                       'camera': sc.camera.name if sc.camera else None, 'keyed_objects': keys, 'probe': probe})


def save(path):
    """Save a copy (the live session keeps its own file name and unsaved state)."""
    bpy.context.window.scene = bpy.data.scenes[SCENE]
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True)
    return path
