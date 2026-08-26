import { describe, expect, it } from 'vitest';
import { LEVELS, XP_UNITS, computeXp, earnedBadges, levelFor } from '../xp';
import { QUESTS, REPORTS, TS, fixtureState, q1, q2, q3, r1, r2, r3 } from './fixtures';
import type { AppState } from '../../types';

describe('computeXp over the worked example', () => {
  const state = fixtureState();
  const xp = computeXp(state);
  const amount = (source: string) => xp.lines.find((l) => l.source === source)?.xp ?? 0;

  // mirror 40 + fork 15 + 3 steps 30 + 3 reports 45 + epistemic 25 + broken 50 + re-rating 5 = 210
  it('totals 210', () => {
    expect(xp.total).toBe(210);
  });

  it('pays 40 for the completed mirror, once', () => {
    expect(amount('mirror_completed')).toBe(40);
  });
  it('pays 15 per fork decision that carries a ≥20-char note', () => {
    expect(amount('fork')).toBe(15);
  });
  it('pays 10 per completed step: 2 + 1 + 0 = 3 steps = 30', () => {
    expect(amount('step_done')).toBe(30);
  });
  it('pays 15 per field report filed: 3 = 45', () => {
    expect(amount('field_report')).toBe(45);
  });
  it('pays the 25 epistemic bonus only for Q2 (feared outcome occurred AND learning logged)', () => {
    expect(amount('epistemic_bonus')).toBe(25);
  });
  it('pays 50 for the single PREDICTION BROKEN (Q1), not for Q3’s below-threshold forecast', () => {
    expect(amount('prediction_broken')).toBe(50);
  });
  it('pays 5 per pair re-rating after evidence', () => {
    expect(amount('pair_rerating')).toBe(5);
  });

  it('every line carries a plain-language explanation (Design Law 5: no hidden scoring)', () => {
    for (const line of xp.lines) {
      expect(line.label.length).toBeGreaterThan(0);
      expect(line.xp).toBe(line.count * line.unit);
    }
    expect(xp.lines.reduce((a, l) => a + l.xp, 0)).toBe(xp.total);
  });

  it('the largest single event is the broken prediction, never task completion (Design Law 3)', () => {
    const units = xp.lines.map((l) => l.unit);
    expect(Math.max(...units)).toBe(50);
    expect(xp.lines.find((l) => l.source === 'prediction_broken')!.unit).toBe(50);
  });
});

describe('computeXp over the Lifebook journey', () => {
  const withLifebook = () => {
    const s = fixtureState();
    s.lifebook = {
      ...s.lifebook,
      visions: [
        { area: 'work', statement: 'a', markers: [], importance: 5, ts: TS },
        { area: 'health', statement: 'b', markers: [], importance: 4, ts: TS },
        { area: 'money', statement: 'c', markers: [], importance: 3, ts: TS },
      ],
      beliefs: [{ id: 'b1', text: 'mine', source: 'own', status: 'confirmed', areas: ['work'], ts: TS }],
      practiceLogs: [{ id: 'pl1', itemId: 'p1', evidence: 'sent it unfinished', ts: TS }],
    };
    s.ledger = [
      ...s.ledger,
      { id: 'x1', ts: TS, kind: 'lifebook_stage', payload: { stage: 'vision', label: 'v' } },
      { id: 'x2', ts: TS, kind: 'lifebook_stage', payload: { stage: 'current', label: 'c' } },
      { id: 'x3', ts: TS, kind: 'belief_owned', payload: { beliefId: 'b1', text: 'mine', source: 'own' } },
      { id: 'x4', ts: TS, kind: 'identity_set', payload: { identityId: 'i1', text: 'x', replaces: 'b1' } },
      { id: 'x5', ts: TS, kind: 'practice_logged', payload: { itemId: 'p1', kind: 'behaviour', text: 'x', evidence: 'y' } },
    ];
    return s;
  };

  const xp = computeXp(withLifebook());
  const amount = (source: string) => xp.lines.find((l) => l.source === source)?.xp ?? 0;

  it('pays 10 per completed stage: 2 stages = 20', () => expect(amount('lifebook_stage')).toBe(20));
  it('pays 15 for taking ownership of a belief', () => expect(amount('belief_owned')).toBe(15));
  it('pays 15 for settling an identity', () => expect(amount('identity_set')).toBe(15));
  it('pays 20 per logged instance — the main earner of this journey', () => {
    expect(amount('practice_logged')).toBe(20);
  });
  it('adds 70 on top of the 210 the v1 fixture already earned', () => {
    expect(xp.total).toBe(210 + 70);
  });

  it('finishing all six stages is worth less than four logged instances', () => {
    // Setup must never outweigh what actually happened in the world.
    expect(6 * XP_UNITS.lifebook_stage).toBeLessThan(4 * XP_UNITS.practice_logged);
  });
  it('still pays nothing larger than a broken prediction (Design Law 3)', () => {
    expect(Math.max(...xp.lines.map((l) => l.unit))).toBe(50);
  });
  it('rejecting a belief pays nothing — a no is a decision about a guess', () => {
    const s = withLifebook();
    s.lifebook.beliefs = [
      { id: 'b2', candidateId: 'x', text: 'not me', source: 'offered', status: 'rejected', areas: [], ts: TS },
    ];
    s.ledger = s.ledger.filter((e) => e.kind !== 'belief_owned');
    expect(computeXp(s).lines.find((l) => l.source === 'belief_owned')?.xp).toBe(0);
  });
});

describe('Lifebook badges', () => {
  it('First Vision needs three written areas, Named It needs a confirmed belief', () => {
    const s = fixtureState();
    expect(earnedBadges(s).map((b) => b.id)).not.toContain('first_vision');

    s.lifebook.visions = ['work', 'health', 'money'].map((area) => ({
      area: area as 'work', statement: 'x', markers: [], importance: 3 as const, ts: TS,
    }));
    expect(earnedBadges(s).map((b) => b.id)).toContain('first_vision');
    expect(earnedBadges(s).map((b) => b.id)).not.toContain('named_it');

    s.lifebook.beliefs = [{ id: 'b', text: 'x', source: 'own', status: 'confirmed', areas: [], ts: TS }];
    expect(earnedBadges(s).map((b) => b.id)).toContain('named_it');
  });

  it('an empty vision statement does not count toward First Vision', () => {
    const s = fixtureState();
    s.lifebook.visions = ['work', 'health', 'money'].map((area) => ({
      area: area as 'work', statement: '   ', markers: [], importance: 3 as const, ts: TS,
    }));
    expect(earnedBadges(s).map((b) => b.id)).not.toContain('first_vision');
  });

  it('Ten Instances needs ten logged instances', () => {
    const s = fixtureState();
    s.lifebook.practiceLogs = Array.from({ length: 9 }, (_, i) => ({
      id: `l${i}`, itemId: 'p', evidence: 'did it', ts: TS,
    }));
    expect(earnedBadges(s).map((b) => b.id)).not.toContain('ten_instances');
    s.lifebook.practiceLogs.push({ id: 'l9', itemId: 'p', evidence: 'did it', ts: TS });
    expect(earnedBadges(s).map((b) => b.id)).toContain('ten_instances');
  });
});

describe('computeXp on an empty profile', () => {
  it('is 0 with no negative lines anywhere', () => {
    const empty: AppState = {
      ...fixtureState(),
      profile: { xp: 0, badges: [], consent: null, initialConflictLoad: null, mirrorCompletedTs: null },
      strivings: [], pairRatings: [], forks: [], quests: [], reports: [], ledger: [],
    };
    const xp = computeXp(empty);
    expect(xp.total).toBe(0);
    expect(xp.lines.every((l) => l.xp >= 0)).toBe(true);
  });
});

describe('XP never decays and is never charged', () => {
  it('has no negative unit anywhere in the economy', () => {
    const xp = computeXp(fixtureState());
    expect(xp.lines.every((l) => l.unit > 0)).toBe(true);
  });
  it('a fork note shorter than 20 chars pays nothing (the note is the intervention)', () => {
    const s = fixtureState();
    s.forks = [{ ...s.forks[0]!, note: 'too short' }];
    expect(computeXp(s).lines.find((l) => l.source === 'fork')?.xp ?? 0).toBe(0);
  });
});

describe('levels — instrument-themed thresholds, no personality claims', () => {
  it('has exactly the six spec thresholds in order', () => {
    expect(LEVELS.map((l) => l.xp)).toEqual([0, 100, 250, 500, 900, 1500]);
    expect(LEVELS.map((l) => l.name)).toEqual([
      'Surveyor', 'Cartographer', 'Field Scientist', 'Experimenter', 'Calibrated',
      'Cartographer of the Deep',
    ]);
  });
  it('210 XP is Cartographer, 110 of the 150 XP to Field Scientist', () => {
    const l = levelFor(210);
    expect(l.name).toBe('Cartographer');
    expect(l.index).toBe(1);
    expect(l.nextAt).toBe(250);
    expect(l.xpIntoLevel).toBe(110);
    expect(l.xpForLevel).toBe(150);
  });
  it('boundaries land on the higher level', () => {
    expect(levelFor(0).name).toBe('Surveyor');
    expect(levelFor(99).name).toBe('Surveyor');
    expect(levelFor(100).name).toBe('Cartographer');
    expect(levelFor(250).name).toBe('Field Scientist');
    expect(levelFor(1500).name).toBe('Cartographer of the Deep');
  });
  it('the top level has no next threshold', () => {
    const top = levelFor(99999);
    expect(top.nextAt).toBeNull();
    expect(top.progress).toBe(1);
  });
  it('every level carries copy about what the number means, not who the user is', () => {
    for (const l of LEVELS) expect(l.meaning.length).toBeGreaterThan(10);
  });
});

describe('badges — certificates of real events only', () => {
  const badges = earnedBadges(fixtureState());
  const ids = badges.map((b) => b.id);

  it('awards First Light for the completed mirror', () => expect(ids).toContain('first_light'));
  it('awards First Contact for the first field report', () => expect(ids).toContain('first_contact'));
  it('awards Prediction Broken for Q1', () => expect(ids).toContain('prediction_broken'));
  it('withholds Serial Falsifier below 10 broken predictions', () => expect(ids).not.toContain('serial_falsifier'));
  it('withholds The Resistance Was Right with no release', () => expect(ids).not.toContain('resistance_was_right'));
  it('withholds Held, Not Hidden with no carry', () => expect(ids).not.toContain('held_not_hidden'));
  it('withholds Cold Reader below n = 10 reports', () => expect(ids).not.toContain('cold_reader'));

  it('withholds Deep Breath: Q3 has fearRating 9 but nothing was attempted', () => {
    expect(ids).not.toContain('deep_breath');
  });
  it('awards Deep Breath once a fearRating ≥ 9 quest has a completed step', () => {
    const s = fixtureState();
    s.quests = [{ ...q3, steps: [{ ...q3.steps[0]!, done: true, doneTs: TS }] }];
    expect(earnedBadges(s).map((b) => b.id)).toContain('deep_breath');
  });
  it('awards The Resistance Was Right on the first release fork', () => {
    const s = fixtureState();
    s.forks = [{ ...s.forks[0]!, choice: 'release' }];
    expect(earnedBadges(s).map((b) => b.id)).toContain('resistance_was_right');
  });
  it('awards Held, Not Hidden on the first carry fork', () => {
    const s = fixtureState();
    s.forks = [{ ...s.forks[0]!, choice: 'carry' }];
    expect(earnedBadges(s).map((b) => b.id)).toContain('held_not_hidden');
  });
  it('awards Cold Reader at Calibration ≥ 85 with n ≥ 10', () => {
    const s = fixtureState();
    // Ten confident, correct forecasts: (0.05 − 0)² = 0.0025 each ⇒ B = 0.0025,
    // Calibration = round((1 − 0.0025) × 100) = round(99.75) = 100.
    s.quests = Array.from({ length: 10 }, (_, i) => ({ ...q1, id: `cr${i}`, forecastP: 5 }));
    s.reports = Array.from({ length: 10 }, (_, i) => ({ ...r1, id: `crr${i}`, questId: `cr${i}`, fearedOutcomeOccurred: false }));
    expect(earnedBadges(s).map((b) => b.id)).toContain('cold_reader');
  });
  it('awards Serial Falsifier at 10 broken predictions', () => {
    const s = fixtureState();
    s.quests = Array.from({ length: 10 }, (_, i) => ({ ...q1, id: `sf${i}`, forecastP: 90 }));
    s.reports = Array.from({ length: 10 }, (_, i) => ({ ...r1, id: `sfr${i}`, questId: `sf${i}`, fearedOutcomeOccurred: false }));
    expect(earnedBadges(s).map((b) => b.id)).toContain('serial_falsifier');
  });
  it('names no trait or condition anywhere in badge copy (§13)', () => {
    const banned = /\b(cure|cures|therapy|therapeutic|rewire|streak|diagnos|disorder|anxious|neurotic|personality)\b/i;
    for (const b of badges) {
      expect(b.name).not.toMatch(banned);
      expect(b.description).not.toMatch(banned);
    }
  });
});

describe('fixture cross-checks', () => {
  it('the three scenarios are the three intended shapes', () => {
    expect([q1.forecastP, q2.forecastP, q3.forecastP]).toEqual([80, 30, 45]);
    expect([r1.fearedOutcomeOccurred, r2.fearedOutcomeOccurred, r3.fearedOutcomeOccurred]).toEqual([false, true, false]);
    expect(QUESTS).toHaveLength(3);
    expect(REPORTS).toHaveLength(3);
    expect(r2.learning.length).toBeGreaterThan(0);
  });
});
