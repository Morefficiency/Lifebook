import { describe, expect, it } from 'vitest';
import { HONESTY_PARAGRAPH, POSITION_DISCLAIMER, buildInsightReport } from '../report';
import { RATINGS, STRIVINGS, TS } from './fixtures';
import type { Striving } from '../../types';

const report = buildInsightReport(STRIVINGS, RATINGS, []);
const section = (id: string) => report.sections.find((s) => s.id === id);
const text = report.sections.flatMap((s) => [s.title, ...s.body]).join('\n');

describe('insight report — deterministic, template-driven, no inference (§7.6)', () => {
  it('is byte-identical across calls (no randomness, no clock, no model)', () => {
    expect(buildInsightReport(STRIVINGS, RATINGS, [])).toEqual(report);
  });

  it('headline counts come straight off the matrix', () => {
    expect(report.headline).toEqual({
      strivings: 4, helpLinks: 2, faultLines: 3, conflictIndexPercent: 66,
    });
  });

  it('names the load-bearing striving with the spec’s exact framing', () => {
    const s = section('load_bearing');
    const body = s!.body.join(' ');
    expect(body).toContain('build my business to replace my salary');
    expect(body).toContain('inside more of your conflicts than anything else');
    expect(body).toContain('This doesn’t mean');
    expect(body).toContain('every fault line runs through it');
    expect(body).toContain('pays double');
  });

  it('reports the hottest edge with both striving texts and its heat', () => {
    const body = section('hottest')!.body.join(' ');
    expect(body).toContain('build my business to replace my salary');
    expect(body).toContain('be more present with my partner');
    expect(body).toContain('8');
  });

  it('names the largest facilitation cluster as an existing engine', () => {
    const s = section('cluster')!;
    const all = [...s.body, ...(s.items ?? [])].join(' ');
    expect(s.body.join(' ')).toContain('already feed each other');
    expect(all).toContain('save enough to stop worrying about money');
    // Three members here, so they read as one sentence rather than a list.
    expect(s.items).toBeUndefined();
  });

  it('spills a large cluster into a list instead of one unreadable sentence', () => {
    const many: Striving[] = Array.from({ length: 5 }, (_, i) => ({
      id: `n${i}`, text: `thing number ${i}`, createdTs: TS, status: 'active' as const,
    }));
    const links = many.slice(1).map((n) => ({ aId: 'n0', bId: n.id, effect: 1 as const, ts: TS }));
    const r = buildInsightReport(many, links, []);
    const c = r.sections.find((s) => s.id === 'cluster')!;
    expect(c.items).toHaveLength(5);
    expect(c.body.join(' ')).toContain('5 of your strivings already feed each other');
  });

  it('carries the honesty paragraph verbatim', () => {
    expect(section('honesty')!.body).toContain(HONESTY_PARAGRAPH);
    expect(HONESTY_PARAGRAPH).toBe(
      'This map is made entirely of your own answers on one day. It is a mirror, not a verdict — mirrors update. Nothing here measures your worth, your personality, or your future.',
    );
  });

  it('states that node positions on the map carry no meaning (build addendum a)', () => {
    expect(section('positions')!.body).toContain(POSITION_DISCLAIMER);
    expect(POSITION_DISCLAIMER).toMatch(/position/i);
    expect(POSITION_DISCLAIMER).toMatch(/colour|color|thickness|glow|size/i);
  });

  it('never diagnoses, never names a trait, never claims to treat anything (§13)', () => {
    // The mandated honesty paragraph is exempt: it uses "personality" inside an
    // explicit denial ("Nothing here measures … your personality …"), which is
    // the opposite of a trait claim. Everything else is scanned.
    const scanned = report.sections
      .filter((s) => s.id !== 'honesty')
      .flatMap((s) => [s.title, ...s.body]).join('\n');
    expect(scanned).not.toMatch(/\b(cure|cured|therapy|therapeutic|treat|heal|rewire|disorder|diagnos|personality|streak)\w*/i);
    expect(scanned).not.toMatch(/\byou are (an?|too|very)\b/i);
  });

  it('speaks in the second person about the user’s own ratings, not about the user', () => {
    expect(text).toMatch(/your ratings/i);
  });
});

describe('insight report degrades honestly', () => {
  const bare: Striving[] = [
    { id: 'a', text: 'read more', createdTs: TS, status: 'active' },
    { id: 'b', text: 'sleep more', createdTs: TS, status: 'active' },
  ];

  it('a conflict-free map says so instead of inventing a fault line', () => {
    const r = buildInsightReport(bare, [{ aId: 'a', bId: 'b', effect: 2, ts: TS }], []);
    expect(r.headline.faultLines).toBe(0);
    expect(r.sections.find((s) => s.id === 'hottest')).toBeUndefined();
    expect(r.sections.find((s) => s.id === 'load_bearing')).toBeUndefined();
    expect(r.sections.flatMap((s) => s.body).join(' ')).toContain('no fault lines');
    // The honesty paragraph and the position disclaimer are never dropped.
    expect(r.sections.find((s) => s.id === 'honesty')).toBeDefined();
    expect(r.sections.find((s) => s.id === 'positions')).toBeDefined();
  });

  it('a map with no facilitation omits the cluster section rather than faking one', () => {
    const r = buildInsightReport(bare, [{ aId: 'a', bId: 'b', effect: -1, heat: 4, ts: TS }], []);
    expect(r.sections.find((s) => s.id === 'cluster')).toBeUndefined();
    expect(r.headline.helpLinks).toBe(0);
  });

  it('an empty map produces a report with no numbers invented', () => {
    const r = buildInsightReport([], [], []);
    expect(r.headline).toEqual({ strivings: 0, helpLinks: 0, faultLines: 0, conflictIndexPercent: null });
    expect(r.sections.find((s) => s.id === 'honesty')).toBeDefined();
  });
});
