/**
 * The constellation, drawn.
 *
 * Raw three.js behind a small React surface: the scene is built once from a
 * Constellation (src/engine/constellation.ts), and React only ever hands it
 * three things — which node is selected, which is hovered, and whether the
 * person has asked for reduced motion. Every number the picture encodes was
 * computed in the engine; this file turns them into radii, opacities and
 * curves, and does no arithmetic about the person of its own.
 *
 * What moves: a slow idle orbit, a soft pulse on the one amber ring, and the
 * satellites drifting round the core. All three stop under
 * prefers-reduced-motion. Dragging, scrolling and pinching are the person's
 * own motion and always work.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { LifeArea } from '../../types';
import type { AreaNode, Constellation, Tier } from '../../engine/constellation';
import { TIER_HEIGHT, TIER_RADIUS } from '../../engine/constellation';
import { RAMP_FAR, RAMP_NEAR } from '../../design/ramp';

export type Pick = LifeArea | 'self';

export interface ConstellationSceneProps {
  data: Constellation;
  labels: Record<LifeArea, string>;
  tierLabels: Record<Tier, string>;
  selfLabel: string;
  selected: Pick | null;
  hovered: Pick | null;
  onSelect: (id: Pick | null) => void;
  onHover: (id: Pick | null) => void;
  reducedMotion: boolean;
}

/* Palette — the app's, in three's integer form. */
const C = {
  canvas: 0x0b0e14,
  bone: 0xe8e3d8,
  muted: 0xa8a399,
  instrument: 0x7ba3c4,
  instrumentDim: 0x40556b,
  hairline: 0x2a3242,
  carry: 0xc9a227,
  fault: 0xc43e3e,
  facil: 0x63ae83,
  /** The self, and anything coupled through it. Deliberately not a colour the
   *  map or the dial use, so it can only ever mean one thing. */
  self: 0xa78bfa,
};
const CSS = {
  bone: '#E8E3D8', muted: '#A8A399', instrument: '#7BA3C4', self: '#C4B5FD',
};

/** Engine units → world units. */
const SCALE = 60;
const CORE_RADIUS = 13;
const SATELLITE_ORBIT = 27;

/* ------------------------------------------------------------------------ *
 * Textures. Drawn once, shared.
 * ------------------------------------------------------------------------ */
function radialGlow(hex: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const col = new THREE.Color(hex);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(${rgb},0.85)`);
  grd.addColorStop(0.35, `rgba(${rgb},0.28)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function ringTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

function labelSprite(
  text: string, sub: string | null, color: string, subColor: string,
  opts: { wide?: boolean; weight?: number } = {},
): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = opts.wide ? 1024 : 512;
  c.height = 160;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.fillStyle = color;
  g.font = `${opts.weight ?? 600} ${opts.wide ? 38 : 44}px "IBM Plex Sans", system-ui, sans-serif`;
  g.shadowColor = 'rgba(0,0,0,0.75)';
  g.shadowBlur = 12;
  g.fillText(text, c.width / 2, 78);
  if (sub) {
    g.fillStyle = subColor;
    g.font = '400 32px "IBM Plex Mono", ui-monospace, monospace';
    g.fillText(sub, c.width / 2, 130);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  // Sprite aspect matches the canvas, so glyphs are never stretched.
  s.scale.set(opts.wide ? 64 : 38, opts.wide ? 10 : 11.9, 1);
  return s;
}

function rampHex(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  const ch = (i: 0 | 1 | 2) => Math.round(RAMP_FAR[i] + (RAMP_NEAR[i] - RAMP_FAR[i]) * k);
  return (ch(0) << 16) | (ch(1) << 8) | ch(2);
}

function tube(from: THREE.Vector3, to: THREE.Vector3, bow: number, radius: number): THREE.TubeGeometry {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  // Bow outward from the origin and upward, so arcs clear the nodes between.
  const out = mid.clone().setY(0);
  const ctrl = mid.clone().add(out.normalize().multiplyScalar(bow)).add(new THREE.Vector3(0, bow * 0.5, 0));
  const curve = new THREE.QuadraticBezierCurve3(from, ctrl, to);
  return new THREE.TubeGeometry(curve, 28, radius, 8, false);
}

/* ------------------------------------------------------------------------ *
 * The scene.
 * ------------------------------------------------------------------------ */
interface NodeHandles {
  id: Pick;
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  ring: THREE.Sprite;
  label: THREE.Sprite;
  base: { emissive: number; glowOpacity: number; labelOpacity: number };
  attention?: THREE.Sprite;
}

interface WireHandles {
  a: Pick; b: Pick;
  mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>;
  base: number;
}

export function ConstellationScene({
  data, labels, tierLabels, selfLabel, selected, hovered, onSelect, onHover, reducedMotion,
}: ConstellationSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ selected, hovered, reducedMotion });
  stateRef.current = { selected, hovered, reducedMotion };
  const cbRef = useRef({ onSelect, onHover });
  cbRef.current = { onSelect, onHover };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C.canvas, 0.0016);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 4000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    scene.add(new THREE.AmbientLight(0x1c2440, 1.1));
    scene.add(new THREE.HemisphereLight(0x4a5a9a, 0x0a0d1c, 0.9));
    const key = new THREE.DirectionalLight(0xbcccff, 0.9);
    key.position.set(1.4, 2, 1.2);
    scene.add(key);

    const GLOW_BLUE = radialGlow(C.instrument);
    const GLOW_SELF = radialGlow(C.self);
    const GLOW_CARRY = radialGlow(C.carry);
    const RING = ringTexture();
    const disposables: { dispose(): void }[] = [GLOW_BLUE, GLOW_SELF, GLOW_CARRY, RING];

    /* ---- stars, floor ---------------------------------------------------- */
    const starPos: number[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 800; i++) {
      const r = 420 + rnd() * 700, t = rnd() * Math.PI * 2, f = Math.acos(2 * rnd() - 1);
      starPos.push(r * Math.sin(f) * Math.cos(t), r * Math.cos(f), r * Math.sin(f) * Math.sin(t));
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x9db4d8, size: 1.3, transparent: true, opacity: 0.45, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));
    disposables.push(starGeo, starMat);

    const grid = new THREE.GridHelper(900, 46, C.instrumentDim, C.hairline);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.07;
    grid.position.y = -120;
    scene.add(grid);

    const world = new THREE.Group();
    scene.add(world);

    /* ---- tier orbits ----------------------------------------------------- */
    (Object.keys(TIER_RADIUS) as Tier[]).forEach((tier) => {
      const pts: THREE.Vector3[] = [];
      const r = TIER_RADIUS[tier] * SCALE;
      const y = TIER_HEIGHT[tier] * SCALE;
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: C.instrumentDim, transparent: true, opacity: 0.22 });
      world.add(new THREE.Line(geo, mat));
      disposables.push(geo, mat);
      const lbl = labelSprite(tierLabels[tier], null, 'rgba(168,163,153,0.9)', CSS.muted, { weight: 500 });
      lbl.scale.set(28, 8.7, 1);
      lbl.position.set(0, y - 5, r + 8);
      (lbl.material as THREE.SpriteMaterial).opacity = 0.42;
      world.add(lbl);
    });

    /* ---- the self -------------------------------------------------------- */
    const nodes: NodeHandles[] = [];
    const pickables: THREE.Mesh[] = [];

    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(C.self).multiplyScalar(0.55), emissive: C.self, emissiveIntensity: 0.75,
      roughness: 0.3, metalness: 0.2,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(CORE_RADIUS, 48, 48), coreMat);
    core.userData.id = 'self';
    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_SELF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
    coreGlow.scale.setScalar(CORE_RADIUS * 5);
    core.add(coreGlow);
    const coreRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: RING, color: C.self, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    coreRing.scale.setScalar(CORE_RADIUS * 3.2);
    core.add(coreRing);
    const coreLabel = labelSprite(selfLabel, data.satellites.length ? `${data.satellites.length}` : null, CSS.self, CSS.muted);
    coreLabel.position.y = CORE_RADIUS + 17;
    core.add(coreLabel);
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(CORE_RADIUS * 1.7, 1),
      new THREE.MeshBasicMaterial({ color: C.self, wireframe: true, transparent: true, opacity: 0.16 }),
    );
    core.add(shell);
    world.add(core);
    pickables.push(core);
    nodes.push({ id: 'self', mesh: core, glow: coreGlow, ring: coreRing, label: coreLabel, base: { emissive: 0.75, glowOpacity: 0.6, labelOpacity: 1 } });

    /* ---- satellites: identities round the self --------------------------- */
    const satellites = new THREE.Group();
    core.add(satellites);
    const satLabels: THREE.Sprite[] = [];
    data.satellites.forEach((sat) => {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(2.4, 0),
        new THREE.MeshBasicMaterial({ color: C.self, transparent: true, opacity: 0.95 }),
      );
      m.position.set(Math.cos(sat.angle) * SATELLITE_ORBIT, -4, Math.sin(sat.angle) * SATELLITE_ORBIT);
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_SELF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
      g.scale.setScalar(14);
      m.add(g);
      const short = sat.text.replace(/^I am someone who\s*/i, '').replace(/\.$/, '');
      const lbl = labelSprite(
        short.length > 46 ? `${short.slice(0, 45)}…` : short, null, CSS.bone, CSS.muted,
        { wide: true, weight: 500 },
      );
      lbl.position.y = 8;
      (lbl.material as THREE.SpriteMaterial).opacity = 0;
      m.add(lbl);
      satLabels.push(lbl);
      satellites.add(m);
    });

    /* ---- the twelve ------------------------------------------------------ */
    const posOf = new Map<Pick, THREE.Vector3>([['self', new THREE.Vector3(0, 0, 0)]]);
    data.nodes.forEach((n: AreaNode) => {
      const p = new THREE.Vector3(n.position.x, n.position.y, n.position.z).multiplyScalar(SCALE);
      posOf.set(n.area, p);
      const radius = n.size * SCALE;
      const hex = rampHex(n.glow);
      let mesh: THREE.Mesh;
      let emissive = 0;
      if (n.state === 'blank') {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 14, 12),
          new THREE.MeshBasicMaterial({ color: C.instrumentDim, wireframe: true, transparent: true, opacity: 0.4 }),
        );
      } else {
        emissive = 0.15 + n.glow * 0.95;
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 32, 32),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(hex).multiplyScalar(0.7), emissive: hex, emissiveIntensity: emissive,
            roughness: 0.4, metalness: 0.12,
          }),
        );
      }
      mesh.position.copy(p);
      mesh.userData.id = n.area;
      const glowOpacity = n.state === 'blank' ? 0 : 0.25 + n.glow * 0.55;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_BLUE, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: glowOpacity }));
      glow.scale.setScalar(radius * 6.5);
      mesh.add(glow);
      const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: RING, color: C.instrument, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      ring.scale.setScalar(radius * 3.4);
      mesh.add(ring);
      const sub = n.current !== null ? String(n.current) : null;
      const label = labelSprite(labels[n.area], sub, n.state === 'blank' ? CSS.muted : CSS.bone, CSS.instrument);
      const labelOpacity = n.state === 'blank' ? 0.55 : 0.95;
      (label.material as THREE.SpriteMaterial).opacity = labelOpacity;
      label.position.y = radius + 9;
      mesh.add(label);
      let attention: THREE.Sprite | undefined;
      if (n.attention) {
        attention = new THREE.Sprite(new THREE.SpriteMaterial({ map: RING, color: C.carry, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
        attention.scale.setScalar(radius * 4.2);
        mesh.add(attention);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_CARRY, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 }));
        halo.scale.setScalar(radius * 8);
        mesh.add(halo);
      }
      world.add(mesh);
      pickables.push(mesh);
      nodes.push({ id: n.area, mesh, glow, ring, label, base: { emissive, glowOpacity, labelOpacity }, attention });
    });

    /* ---- spokes and arcs ------------------------------------------------- */
    const wires: WireHandles[] = [];
    const origin = new THREE.Vector3(0, 0, 0);
    data.spokes.forEach((s) => {
      const to = posOf.get(s.area)!;
      const geo = tube(origin, to, 4 + s.weight * 2, 0.16 + s.weight * 0.1);
      const mat = new THREE.MeshBasicMaterial({
        color: s.loaded ? C.self : C.instrumentDim, transparent: true,
        opacity: s.loaded ? 0.5 : 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      world.add(mesh);
      wires.push({ a: 'self', b: s.area, mesh, base: mat.opacity });
    });
    data.arcs.forEach((arc) => {
      const from = posOf.get(arc.a)!;
      const to = posOf.get(arc.b)!;
      const colour = arc.kind === 'coupled' ? C.self : arc.kind === 'conflict' ? C.fault : C.facil;
      const radius = arc.kind === 'coupled' ? 0.3 + arc.weight * 0.16 : 0.28 + Math.min(arc.weight, 6) * 0.12;
      const geo = tube(from, to, 22 + arc.weight * 4, radius);
      const mat = new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      world.add(mesh);
      wires.push({ a: arc.a, b: arc.b, mesh, base: 0.5 });
    });

    /* ---- camera ---------------------------------------------------------- */
    const cam = { theta: 0.65, phi: 1.05, radius: 350 };
    const goal = { theta: 0.65, phi: 1.05, radius: 350, target: new THREE.Vector3(0, -8, 0) };
    const target = new THREE.Vector3(0, -8, 0);
    const applyCamera = () => {
      const { theta, phi, radius } = cam;
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.cos(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.sin(theta),
      );
      camera.lookAt(target);
    };

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ---- pointer --------------------------------------------------------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let dragging = false;
    let moved = 0;
    let last = { x: 0, y: 0 };
    let lastInteraction = performance.now();
    let pinchDist = 0;
    const el = renderer.domElement;

    const pickAt = (x: number, y: number): Pick | null => {
      const rect = el.getBoundingClientRect();
      ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      return hit ? (hit.object.userData.id as Pick) : null;
    };

    const onDown = (e: PointerEvent) => {
      dragging = true; moved = 0; last = { x: e.clientX, y: e.clientY };
      el.classList.add('dragging'); el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
      lastInteraction = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      lastInteraction = performance.now();
      if (dragging) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        moved += Math.abs(dx) + Math.abs(dy);
        goal.theta -= dx * 0.0055;
        goal.phi = Math.min(2.6, Math.max(0.45, goal.phi - dy * 0.0045));
        last = { x: e.clientX, y: e.clientY };
        return;
      }
      const id = pickAt(e.clientX, e.clientY);
      if (id !== stateRef.current.hovered) cbRef.current.onHover(id);
      el.style.cursor = id ? 'pointer' : 'grab';
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging'); el.style.cursor = 'grab';
      if (moved < 6) {
        const id = pickAt(e.clientX, e.clientY);
        cbRef.current.onSelect(id === stateRef.current.selected ? null : id);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteraction = performance.now();
      goal.radius = Math.min(680, Math.max(120, goal.radius * (1 + e.deltaY * 0.0012)));
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0]!, e.touches[1]!];
        pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDist > 0) {
        e.preventDefault();
        const [a, b] = [e.touches[0]!, e.touches[1]!];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        goal.radius = Math.min(680, Math.max(120, goal.radius * (pinchDist / d)));
        pinchDist = d;
        lastInteraction = performance.now();
      }
    };
    const onLeave = () => { if (stateRef.current.hovered) cbRef.current.onHover(null); };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    /* ---- frame ----------------------------------------------------------- */
    let raf = 0;
    let lastSelected: Pick | null | undefined;
    let lastFrame = performance.now();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = (now: number) => {
      const { selected: sel, hovered: hov, reducedMotion: rm } = stateRef.current;
      // Easing is expressed per 60 fps frame and rescaled to the real frame
      // time, so a slow machine converges in the same number of milliseconds
      // rather than the same number of frames.
      const frames = Math.min(4, (now - lastFrame) / 16.67);
      lastFrame = now;
      const ease = (perFrame: number) => 1 - Math.pow(1 - perFrame, frames);

      // Camera goal follows the selection: settle on the node, come in a little.
      if (sel !== lastSelected) {
        lastSelected = sel;
        if (sel && sel !== 'self') {
          const p = posOf.get(sel)!;
          goal.target.copy(p).multiplyScalar(0.55);
          goal.radius = 270;
        } else if (sel === 'self') {
          goal.target.set(0, 0, 0);
          goal.radius = 220;
        } else {
          goal.target.set(0, -8, 0);
          goal.radius = 350;
        }
      }

      const idle = !rm && !dragging && now - lastInteraction > 4000 && !sel;
      if (idle) goal.theta += 0.0016 * frames;

      const k = rm ? 1 : ease(0.08);
      const k15 = ease(0.15);
      const k2 = ease(0.2);
      cam.theta = lerp(cam.theta, goal.theta, k);
      cam.phi = lerp(cam.phi, goal.phi, k);
      cam.radius = lerp(cam.radius, goal.radius, k);
      target.lerp(goal.target, k);
      applyCamera();

      if (!rm) satellites.rotation.y += 0.0035 * frames;

      const dim = sel !== null;
      const related = new Set<Pick>();
      if (sel) {
        related.add(sel);
        wires.forEach((w) => { if (w.a === sel) related.add(w.b); if (w.b === sel) related.add(w.a); });
      }
      nodes.forEach((n) => {
        const active = !dim || related.has(n.id);
        const isHot = n.id === hov || n.id === sel;
        const f = active ? 1 : 0.28;
        const mat = n.mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
        if ('emissiveIntensity' in mat) {
          mat.emissiveIntensity = lerp(mat.emissiveIntensity, n.base.emissive * f * (isHot ? 1.35 : 1), k15);
        } else {
          mat.opacity = lerp(mat.opacity, 0.4 * f, k15);
        }
        const gm = n.glow.material as THREE.SpriteMaterial;
        gm.opacity = lerp(gm.opacity, n.base.glowOpacity * f * (isHot ? 1.3 : 1), k15);
        const rmat = n.ring.material as THREE.SpriteMaterial;
        rmat.opacity = lerp(rmat.opacity, isHot ? 0.95 : 0, k2);
        const lm = n.label.material as THREE.SpriteMaterial;
        lm.opacity = lerp(lm.opacity, n.base.labelOpacity * (active ? 1 : 0.35), k15);
        if (n.attention && !rm) {
          (n.attention.material as THREE.SpriteMaterial).opacity = 0.7 + Math.sin(now / 700) * 0.25;
        }
        const s = isHot ? 1.12 : 1;
        n.mesh.scale.setScalar(lerp(n.mesh.scale.x, s, k15));
      });
      wires.forEach((w) => {
        const on = !dim || (w.a === sel || w.b === sel);
        const emphasised = dim && on;
        w.mesh.material.opacity = lerp(w.mesh.material.opacity, on ? (emphasised ? Math.min(1, w.base * 1.7) : w.base) : w.base * 0.12, k15);
      });
      satLabels.forEach((l) => {
        const m = l.material as THREE.SpriteMaterial;
        m.opacity = lerp(m.opacity, sel === 'self' || hov === 'self' ? 0.95 : 0, k15);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
    // The scene is rebuilt only when the data or the copy changes; selection
    // and hover flow in through refs so a click never tears the world down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, labels, tierLabels, selfLabel]);

  return <div ref={hostRef} className="absolute inset-0 h-full w-full" />;
}
