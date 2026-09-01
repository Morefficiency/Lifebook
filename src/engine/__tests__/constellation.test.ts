/**
 * Hand-worked geometry and encodings for the constellation.
 *
 * TIERS — five areas nearest the self, three people, four world:
 *
 *   person  r=1.00  health mind emotions character spirit     5 nodes, 72° apart
 *   people  r=1.75  partner family social                     3 nodes, 120° apart
 *   world   r=2.50  money work lifestyle vision               4 nodes, 90° apart
 *
 *   First node of each tier sits at the tier's phase; the rest follow in
 *   LIFE_AREAS order. With phase(person) = −90°, health is at
 *   (cos −90°, sin −90°) × 1 = (0, −1) in the x/z plane, and mind is 72°
 *   further round: angle −18°, so x = cos(−18°) = 0.951057, z = sin(−18°) = −0.309017.
 *
 *   Height: tier height plus a stagger that alternates by index and scales
 *   with the tier's radius over the outer radius (r / 2.5):
 *     health   index 0 → +0.16 × (1/2.5)   = +0.064  → y = 0.18 + 0.064 = 0.244
 *     mind     index 1 → −0.064                        → y = 0.116
 *     money    index 0 in world, r = 2.5 → +0.16      → y = −0.22 + 0.16 = −0.06
 *
 * SIZE — importance 1…5 maps linearly onto 0.10…0.20:
 *     importance 5 → 0.20 ;  3 → 0.15 ;  1 → 0.10 ;  unwritten → 0.075
 *
 * GLOW — current 1…10 maps linearly onto 0.25…1:
 *     current 10 → 1 ;  current 1 → 0.25 ;  current 3 → 0.25 + (2/9)(0.75) = 0.416667
 *     written, unplaced → 0.30 flat ;  blank → 0
 *
 * ARCS — a confirmed belief on {money, work, character} couples every pair
 *   once: money|work, money|character, character|work → 3 arcs of weight 1.
 *   A second belief on {work, money} adds to money|work → weight 2, two ids.
 *   A rejected belief on {health, spirit} contributes nothing.
 */
import { describe, expect, it } from 'vitest';
import { emptyState } from '../../data/db';
import { LIFE_AREAS, type LifeArea } from '../../types';
import {
  SIZE_BLANK, TIER_OF, TIER_RADIUS, areasInTier, buildConstellation,
  nodeGlow, nodeSize, positionOf,
} from '../constellation';

const close = (n: number, expected: number) => expect(n).toBeCloseTo(expected, 5);

describe('tiers', () => {
  it('place every area in exactly one tier, in the order the areas already run', () => {
    expect(areasInTier('person')).toEqual(['health', 'mind', 'emotions', 'character', 'spirit']);
    expect(areasInTier('people')).toEqual(['partner', 'family', 'social']);
    expect(areasInTier('world')).toEqual(['money', 'work', 'lifestyle', 'vision']);
    expect(Object.keys(TIER_OF)).toHaveLength(12);
  });

  it('put nearer things nearer', () => {
    expect(TIER_RADIUS.person).toBeLessThan(TIER_RADIUS.people);
    expect(TIER_RADIUS.people).toBeLessThan(TIER_RADIUS.world);
  });
});

describe('positions', () => {
  it('match the hand-worked coordinates', () => {
    const health = positionOf('health');
    close(health.x, 0); close(health.z, -1); close(health.y, 0.244);
    const mind = positionOf('mind');
    close(mind.x, 0.951057); close(mind.z, -0.309017); close(mind.y, 0.116);
    const money = positionOf('money');
    close(Math.hypot(money.x, money.z), 2.5); close(money.y, -0.06);
  });

  it('space the nodes of a tier evenly around it', () => {
    const angles = areasInTier('world').map((a) => {
      const p = positionOf(a);
      return Math.atan2(p.z, p.x);
    });
    for (let i = 1; i < angles.length; i++) {
      let d = angles[i]! - angles[i - 1]!;
      while (d < 0) d += Math.PI * 2;
      close(d, Math.PI / 2);
    }
  });

  it('never produce a NaN for any area', () => {
    for (const a of LIFE_AREAS) {
      const p = positionOf(a);
      expect([p.x, p.y, p.z].every(Number.isFinite), a).toBe(true);
    }
  });

  it('keep every node on its tier radius in the horizontal plane', () => {
    for (const a of LIFE_AREAS) {
      const p = positionOf(a);
      close(Math.hypot(p.x, p.z), TIER_RADIUS[TIER_OF[a]]);
    }
  });
});

describe('encodings', () => {
  it('size follows importance and gives an unwritten area a small slot', () => {
    close(nodeSize(5), 0.2); close(nodeSize(3), 0.15); close(nodeSize(1), 0.1);
    expect(nodeSize(null)).toBe(SIZE_BLANK);
  });

  it('glow follows current, is flat for the unplaced, and is dark for the unwritten', () => {
    close(nodeGlow('rated', 10), 1); close(nodeGlow('rated', 1), 0.25);
    close(nodeGlow('rated', 3), 0.416667);
    close(nodeGlow('written', null), 0.3);
    expect(nodeGlow('blank', null)).toBe(0);
  });
});

describe('the whole constellation over a worked profile', () => {
  const s = emptyState();
  const ts = '2026-03-01T09:00:00.000Z';
  s.lifebook.visions = [
    { area: 'work', statement: 'w', markers: [], importance: 5, ts },
    { area: 'money', statement: 'm', markers: [], importance: 3, ts },
    { area: 'character', statement: 'c', markers: [], importance: 4, ts },
  ];
  s.lifebook.currents = [
    { area: 'work', score: 3, description: 'w', ts },
    { area: 'money', score: 2, description: 'm', ts },
  ];
  s.lifebook.beliefs = [
    { id: 'b1', text: 'b1', source: 'offered', status: 'confirmed', areas: ['money', 'work', 'character'], ts },
    { id: 'b2', text: 'b2', source: 'offered', status: 'confirmed', areas: ['work', 'money'], ts },
    { id: 'b3', text: 'b3', source: 'offered', status: 'rejected', areas: ['health', 'spirit'], ts },
  ];
  s.lifebook.identities = [
    { id: 'i1', text: 'I am someone who ships.', replacesBeliefId: 'b1', areas: ['work'], edited: false, ts },
    { id: 'i2', text: 'I am someone who asks.', replacesBeliefId: 'b2', areas: ['money'], edited: false, ts },
    { id: 'i3', text: '   ', replacesBeliefId: 'b3', areas: [], edited: true, ts },
  ];
  const c = buildConstellation(s);
  const node = (a: LifeArea) => c.nodes.find((n) => n.area === a)!;

  it('has all twelve nodes whether or not they were written', () => {
    expect(c.nodes.map((n) => n.area)).toEqual(LIFE_AREAS);
  });

  it('classifies and encodes each node from the person\'s own answers', () => {
    expect(node('work').state).toBe('rated');
    close(node('work').size, 0.2);
    close(node('work').glow, 0.416667);
    expect(node('character').state).toBe('written');
    close(node('character').glow, 0.3);
    expect(node('spirit').state).toBe('blank');
    expect(node('spirit').glow).toBe(0);
    expect(node('spirit').size).toBe(SIZE_BLANK);
  });

  it('marks exactly one area as carrying the most distance', () => {
    // work: 5 × 7/9 = 3.889 ; money: 3 × 8/9 = 2.667 → work
    expect(c.nodes.filter((n) => n.attention).map((n) => n.area)).toEqual(['work']);
  });

  it('lists the confirmed beliefs sitting on each area, and none of the rejected', () => {
    expect(node('work').beliefIds.sort()).toEqual(['b1', 'b2']);
    expect(node('character').beliefIds).toEqual(['b1']);
    expect(node('health').beliefIds).toEqual([]);
  });

  it('spokes carry importance and whether the self is load-bearing there', () => {
    const spoke = (a: LifeArea) => c.spokes.find((sp) => sp.area === a)!;
    expect(spoke('work')).toEqual({ area: 'work', weight: 5, loaded: true });
    expect(spoke('spirit')).toEqual({ area: 'spirit', weight: 1, loaded: false });
  });

  it('couples areas that share a confirmed belief, counting each belief once per pair', () => {
    const coupled = c.arcs.filter((a) => a.kind === 'coupled');
    expect(coupled).toHaveLength(3);
    const mw = coupled.find((a) => a.a === 'money' && a.b === 'work')!;
    expect(mw.weight).toBe(2);
    expect(mw.beliefIds).toEqual(['b1', 'b2']);
    expect(coupled.find((a) => a.a === 'character' && a.b === 'money')!.weight).toBe(1);
    expect(coupled.some((a) => a.a === 'health' || a.b === 'health')).toBe(false);
  });

  it('gives every owned identity a satellite, evenly around the core, and skips the blank one', () => {
    expect(c.satellites.map((sat) => sat.identityId)).toEqual(['i1', 'i2']);
    close(c.satellites[0]!.angle, 0);
    close(c.satellites[1]!.angle, Math.PI);
  });

  it('lifts goal collisions onto areas only when both goals carry an area', () => {
    const t = emptyState();
    t.strivings = [
      { id: 'g1', text: 'g1', area: 'work', createdTs: ts, status: 'active' },
      { id: 'g2', text: 'g2', area: 'partner', createdTs: ts, status: 'active' },
      { id: 'g3', text: 'g3', createdTs: ts, status: 'active' },
    ];
    t.pairRatings = [
      { aId: 'g1', bId: 'g2', effect: -2, heat: 5, ts },  // load 2 × 1.5 = 3
      { aId: 'g1', bId: 'g3', effect: -2, heat: 10, ts }, // g3 has no area → dropped
    ];
    const arcs = buildConstellation(t).arcs;
    expect(arcs).toHaveLength(1);
    expect(arcs[0]).toMatchObject({ a: 'partner', b: 'work', kind: 'conflict', weight: 3 });
  });

  it('is empty rather than invented for a fresh profile', () => {
    const fresh = buildConstellation(emptyState());
    expect(fresh.nodes).toHaveLength(12);
    expect(fresh.nodes.every((n) => n.state === 'blank')).toBe(true);
    expect(fresh.arcs).toEqual([]);
    expect(fresh.satellites).toEqual([]);
  });
});
