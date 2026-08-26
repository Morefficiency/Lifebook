import { describe, expect, it } from 'vitest';
import { areaGap, areaTension, lifeGapPercent, tensionMap, rankedTensions } from '../gap';
import { inferBeliefs, maxProbeScore } from '../beliefs';
import { proposeIdentities } from '../identity';
import { buildProgramme, practiceProgress } from '../programme';
import {
  CURRENTS, EXPECTED_BELIEFS, EXPECTED_GAP, TEST_ANSWERS, TEST_CATALOGUE,
  TEST_PROBES, TS, VISIONS,
} from './lifebook-fixtures';
import type { HeldBelief, PracticeItem, PracticeLog, TargetIdentity } from '../../types';

describe('area gap — (10 − current) / 9', () => {
  it('current 3 → 7/9', () => expect(areaGap(3)).toBeCloseTo(EXPECTED_GAP.work, 10));
  it('current 2 → 8/9', () => expect(areaGap(2)).toBeCloseTo(EXPECTED_GAP.money, 10));
  it('current 10 → 0 — already living it', () => expect(areaGap(10)).toBe(0));
  it('current 1 → 1 — the whole distance', () => expect(areaGap(1)).toBeCloseTo(1, 10));
  it('clamps out-of-range input rather than producing a negative gap', () => {
    expect(areaGap(12)).toBe(0);
    expect(areaGap(-4)).toBeCloseTo(1, 10);
  });
});

describe('area tension — importance × gap', () => {
  it('work: 5 × 7/9 = 3.88889 — the highest, though money has the bigger raw gap', () => {
    expect(areaTension(5, 3)).toBeCloseTo(EXPECTED_GAP.tension.work, 10);
    expect(areaTension(3, 2)).toBeCloseTo(EXPECTED_GAP.tension.money, 10);
    expect(areaTension(5, 3)).toBeGreaterThan(areaTension(3, 2));
  });
  it('something you do not care about cannot generate tension however far off it is', () => {
    expect(areaTension(1, 1)).toBeCloseTo(1, 10);
    expect(areaTension(5, 10)).toBe(0);
  });
});

describe('life gap over the worked example', () => {
  const t = tensionMap(VISIONS, CURRENTS);

  it('produces a tension per rated area', () => {
    expect(t.get('work')).toBeCloseTo(EXPECTED_GAP.tension.work, 10);
    expect(t.get('money')).toBeCloseTo(EXPECTED_GAP.tension.money, 10);
    expect(t.get('health')).toBeCloseTo(EXPECTED_GAP.tension.health, 10);
    expect(t.get('partner')).toBeCloseTo(EXPECTED_GAP.tension.partner, 10);
  });

  it('9.44444 / 17 = 56%', () => {
    expect(lifeGapPercent(VISIONS, CURRENTS)).toBe(EXPECTED_GAP.lifeGapPercent);
  });

  it('ranks work, money, health, partner', () => {
    expect(rankedTensions(VISIONS, CURRENTS).map((r) => r.area)).toEqual([...EXPECTED_GAP.priority]);
  });

  it('ignores an area with a vision but no current rating yet', () => {
    const partial = CURRENTS.filter((c) => c.area !== 'money');
    // Σ tension = 3.88889 + 1.77778 + 1.11111 = 6.77778 ; Σ importance = 5+4+5 = 14
    // 6.77778 / 14 = 0.484127 → 48%
    expect(lifeGapPercent(VISIONS, partial)).toBe(48);
    expect(tensionMap(VISIONS, partial).has('money')).toBe(false);
  });

  it('nothing rated yet → null rather than a made-up 0%', () => {
    expect(lifeGapPercent([], [])).toBeNull();
    expect(lifeGapPercent(VISIONS, [])).toBeNull();
  });

  it('a life already lived is 0%', () => {
    const there = VISIONS.map((v) => ({ area: v.area, score: 10, description: '', ts: TS }));
    expect(lifeGapPercent(VISIONS, there)).toBe(0);
  });
});

describe('belief scoring', () => {
  const tensions = tensionMap(VISIONS, CURRENTS);

  it('maxProbeScore takes the best option on a single-choice probe and the sum on a multi', () => {
    expect(maxProbeScore('alpha', TEST_PROBES)).toBe(EXPECTED_BELIEFS.maxProbe.alpha); // 3 + 2
    expect(maxProbeScore('beta', TEST_PROBES)).toBe(EXPECTED_BELIEFS.maxProbe.beta);   // 1 + 5
    expect(maxProbeScore('gamma', TEST_PROBES)).toBe(0);
  });

  const ranked = inferBeliefs({
    answers: TEST_ANSWERS, probes: TEST_PROBES, catalogue: TEST_CATALOGUE, tensions,
  });

  it('scores alpha at 0.8967 and beta at 0.7667, exactly as computed by hand', () => {
    expect(ranked[0]!.id).toBe('alpha');
    expect(ranked[0]!.score).toBeCloseTo(EXPECTED_BELIEFS.score.alpha, 10);
    expect(ranked[1]!.id).toBe('beta');
    expect(ranked[1]!.score).toBeCloseTo(EXPECTED_BELIEFS.score.beta, 10);
  });

  it('never offers a candidate with no evidence behind it', () => {
    expect(ranked.map((r) => r.id)).toEqual([...EXPECTED_BELIEFS.ranked]);
    expect(ranked.some((r) => r.id === 'gamma')).toBe(false);
  });

  it('normalising stops a candidate winning just for being listed against more areas', () => {
    // Same probe evidence, but 'wide' claims four areas to alpha's two.
    const wide = { ...TEST_CATALOGUE[0]!, id: 'wide', areas: ['work', 'money', 'health', 'partner'] as const };
    const out = inferBeliefs({
      answers: TEST_ANSWERS, probes: TEST_PROBES,
      catalogue: [TEST_CATALOGUE[0]!, { ...wide, areas: [...wide.areas] }], tensions,
    });
    const alpha = out.find((r) => r.id === 'alpha')!;
    const w = out.find((r) => r.id === 'wide')!;
    // Identical probe evidence on both, so the probe term is 1.0 for each.
    // alpha: rawArea 6.55556 / maxArea 10 = 0.65556 → 0.7 + 0.19667 = 0.89667
    // wide:  rawArea 9.44444 / maxArea 20 = 0.47222 → 0.7 + 0.14167 = 0.84167
    expect(w.score).toBeCloseTo(0.8416666666666667, 10);
    expect(w.score).toBeLessThan(alpha.score);
  });

  it('carries the reason it was offered, so nothing is a black box', () => {
    const alpha = ranked[0]!;
    expect(alpha.becauseProbes.length).toBeGreaterThan(0);
    expect(alpha.becauseAreas.map((a) => a.area)).toContain('work');
    expect(alpha.becauseAreas[0]!.area).toBe('work'); // strongest contributor first
  });

  it('drops anything the user already ruled on, in either direction', () => {
    const out = inferBeliefs({
      answers: TEST_ANSWERS, probes: TEST_PROBES, catalogue: TEST_CATALOGUE, tensions,
      excludeIds: ['alpha'],
    });
    expect(out.map((r) => r.id)).toEqual(['beta']);
  });

  it('with no probe answers at all, offers nothing rather than guessing from the gap', () => {
    const out = inferBeliefs({
      answers: [], probes: TEST_PROBES, catalogue: TEST_CATALOGUE, tensions,
    });
    expect(out).toEqual([]);
  });

  it('scores on probes alone when no area of the candidate has been rated', () => {
    const out = inferBeliefs({
      answers: TEST_ANSWERS, probes: TEST_PROBES, catalogue: TEST_CATALOGUE, tensions: new Map(),
    });
    // With no area evidence the area term is dropped, not counted as zero:
    // alpha would otherwise be punished for data the user never entered.
    expect(out[0]!.score).toBeCloseTo(1, 10);
  });

  it('honours the limit', () => {
    expect(inferBeliefs({
      answers: TEST_ANSWERS, probes: TEST_PROBES, catalogue: TEST_CATALOGUE, tensions, limit: 1,
    })).toHaveLength(1);
  });
});

describe('target identities', () => {
  const confirmed: HeldBelief[] = [
    { id: 'h1', candidateId: 'alpha', text: 'alpha belief', source: 'offered', status: 'confirmed', areas: ['work', 'money'], ts: TS },
    { id: 'h2', text: 'something I wrote myself', source: 'own', status: 'confirmed', areas: ['health'], ts: TS },
    { id: 'h3', candidateId: 'beta', text: 'beta belief', source: 'offered', status: 'rejected', areas: ['partner'], ts: TS },
  ];
  const proposed = proposeIdentities(confirmed, TEST_CATALOGUE);

  it('proposes the catalogue counterpart for a confirmed offered belief', () => {
    const a = proposed.find((d) => d.replacesBeliefId === 'h1')!;
    expect(a.text).toBe('alpha identity');
    expect(a.areas).toEqual(['work', 'money']);
    expect(a.why).toBe('because');
  });

  it('leaves a self-written belief blank for the user to answer himself', () => {
    const own = proposed.find((d) => d.replacesBeliefId === 'h2')!;
    expect(own.text).toBe('');
    expect(own.areas).toEqual(['health']);
  });

  it('proposes nothing for a rejected belief', () => {
    expect(proposed.some((d) => d.replacesBeliefId === 'h3')).toBe(false);
  });
});

describe('programme', () => {
  const identities: TargetIdentity[] = [
    { id: 'i1', text: 'alpha identity', replacesBeliefId: 'h1', areas: ['work'], edited: false, ts: TS },
  ];
  const beliefs: HeldBelief[] = [
    { id: 'h1', candidateId: 'alpha', text: 'alpha belief', source: 'offered', status: 'confirmed', areas: ['work'], ts: TS },
  ];

  it('draws the practices from the belief the identity replaces', () => {
    const items = buildProgramme(identities, beliefs, TEST_CATALOGUE);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ identityId: 'i1', kind: 'affirmation', text: 'alpha affirmation', cadence: 'daily' });
  });

  it('produces nothing for an identity the user wrote against their own belief', () => {
    expect(buildProgramme(
      [{ ...identities[0]!, replacesBeliefId: 'h9' }], beliefs, TEST_CATALOGUE,
    )).toEqual([]);
  });

  it('counts logged evidence per practice, never bare repetitions', () => {
    const items: PracticeItem[] = [
      { id: 'p1', identityId: 'i1', kind: 'affirmation', text: 'x', cadence: 'daily', active: true, ts: TS },
      { id: 'p2', identityId: 'i1', kind: 'behaviour', text: 'y', cadence: 'weekly', active: true, ts: TS },
      { id: 'p3', identityId: 'i1', kind: 'thought', text: 'z', cadence: 'when_it_shows_up', active: false, ts: TS },
    ];
    const logs: PracticeLog[] = [
      { id: 'l1', itemId: 'p1', evidence: 'said it after shipping the draft', ts: TS },
      { id: 'l2', itemId: 'p1', evidence: 'again on Tuesday', ts: TS },
      { id: 'l3', itemId: 'p2', evidence: 'sent it unfinished', ts: TS },
    ];
    const p = practiceProgress(items, logs);
    expect(p.active).toBe(2);
    expect(p.logged).toBe(3);
    expect(p.byItem.get('p1')).toBe(2);
    expect(p.byItem.get('p3')).toBe(0);
    expect(p.practisedItems).toBe(2);
  });
});
