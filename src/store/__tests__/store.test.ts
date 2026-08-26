/**
 * The single mutation path.
 *
 * Every bug found in this project so far has been here rather than in the pure
 * engine — write ordering, a guard that fired at the wrong time, a ledger entry
 * with the wrong shape — and until now it had no tests at all. These run
 * through Dexie against a real IndexedDB implementation, so persistence is
 * exercised too.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { db, emptyState, loadState, saveState, setStorageScope, whenSaved, wipeCurrentScope } from '../../data/db';
import { useStore } from '../useStore';
import { lifebook } from '../lifebookStore';
import { XP_UNITS } from '../../engine/xp';

async function reset() {
  setStorageScope(null);
  await db.open();
  await db.kv.clear();
  useStore.setState({ state: emptyState(), hydrated: true, session: null, onLocalChange: null });
}

beforeEach(reset);

const s = () => useStore.getState().state;

describe('XP is derived, never accumulated', () => {
  it('recomputes on every commit rather than adding to a counter', () => {
    useStore.getState().acceptConsent();
    expect(s().profile.xp).toBe(0);

    lifebook.setVision('work', { statement: 'a', importance: 5 });
    lifebook.setVision('health', { statement: 'b', importance: 4 });
    lifebook.setVision('money', { statement: 'c', importance: 3 });
    lifebook.completeStage('vision');

    expect(s().profile.xp).toBe(XP_UNITS.lifebook_stage);
  });

  it('a step un-ticked by mistake takes its points back with it', () => {
    const id = useStore.getState().createQuest({
      wish: 'w', outcome: 'o', obstacle: 'ob', beliefHypothesis: '',
      steps: [{ ifCue: 'when', thenAction: 'do' }],
      fearRating: 3, forecastP: 40, fearedOutcomeText: 'something observable happens',
    });
    const stepId = s().quests[0]!.steps[0]!.id;

    useStore.getState().toggleStep(id, stepId);
    expect(s().profile.xp).toBe(XP_UNITS.step_done);

    useStore.getState().toggleStep(id, stepId);
    expect(s().profile.xp).toBe(0);
    expect(s().quests[0]!.steps[0]!.doneTs).toBeUndefined();
  });

  it('badges follow the evidence and appear in the ledger once', () => {
    lifebook.setVision('work', { statement: 'a' });
    lifebook.setVision('health', { statement: 'b' });
    lifebook.setVision('money', { statement: 'c' });

    expect(s().profile.badges).toContain('first_vision');
    const earned = s().ledger.filter((e) => e.kind === 'badge_earned');
    expect(earned).toHaveLength(1);

    // Another change must not re-award it.
    lifebook.setVision('mind', { statement: 'd' });
    expect(s().ledger.filter((e) => e.kind === 'badge_earned')).toHaveLength(1);
  });
});

describe('the ledger only ever grows', () => {
  it('no action shortens it', () => {
    useStore.getState().acceptConsent();
    lifebook.setVision('work', { statement: 'a' });
    lifebook.completeStage('vision');
    const afterStage = s().ledger.length;

    lifebook.clearVision('work');
    lifebook.reopenBeliefs();
    useStore.getState().resetLifebook();

    expect(s().ledger.length).toBeGreaterThanOrEqual(afterStage);
  });

  it('records a stage once, however many times it is called', () => {
    lifebook.completeStage('vision');
    lifebook.completeStage('vision');
    lifebook.completeStage('vision');
    expect(s().ledger.filter((e) => e.kind === 'lifebook_stage')).toHaveLength(1);
  });

  it('an annotation is a new entry, not an edit of the one it comments on', () => {
    lifebook.completeStage('vision');
    const target = s().ledger.find((e) => e.kind === 'lifebook_stage')!;
    const before = JSON.stringify(target);

    useStore.getState().annotate(target.id, 'a thought from later');

    expect(JSON.stringify(s().ledger.find((e) => e.id === target.id))).toBe(before);
    expect(s().ledger.some((e) => e.kind === 'annotation')).toBe(true);
  });
});

describe('filing a field report', () => {
  const makeQuest = (forecastP: number) => useStore.getState().createQuest({
    edge: { aId: 's1', bId: 's2' },
    wish: 'w', outcome: 'o', obstacle: 'ob', beliefHypothesis: 'the belief',
    steps: [{ ifCue: 'when', thenAction: 'do' }],
    fearRating: 8, forecastP, fearedOutcomeText: 'revenue comes in below last month',
  });

  beforeEach(() => {
    useStore.setState((st) => ({
      state: {
        ...st.state,
        strivings: [
          { id: 's1', text: 'a', createdTs: 't', status: 'active' },
          { id: 's2', text: 'b', createdTs: 't', status: 'active' },
        ],
        pairRatings: [{ aId: 's1', bId: 's2', effect: -2, heat: 8, ts: 't' }],
      },
    }));
  });

  it('a broken prediction cools its fault line by exactly one step', () => {
    const id = makeQuest(80);
    const result = useStore.getState().fileReport(id, {
      fearedOutcomeOccurred: false,
      whatHappened: 'It did not happen, and I was surprised by how easy it was.',
      learning: '',
    });

    expect(result?.broken).toBe(true);
    expect(s().pairRatings[0]!.heat).toBe(7);
    expect(s().ledger.some((e) => e.kind === 'prediction_broken')).toBe(true);
    expect(s().profile.xp).toBeGreaterThanOrEqual(XP_UNITS.prediction_broken);
  });

  it('a forecast below the threshold cools nothing, however good the outcome', () => {
    const id = makeQuest(45);
    const result = useStore.getState().fileReport(id, {
      fearedOutcomeOccurred: false,
      whatHappened: 'It did not happen, but I never really believed it would.',
      learning: '',
    });

    expect(result?.broken).toBe(false);
    expect(s().pairRatings[0]!.heat).toBe(8);
    expect(s().ledger.some((e) => e.kind === 'prediction_broken')).toBe(false);
  });

  it('marks the quest reported and refuses a report for a quest that is not there', () => {
    const id = makeQuest(80);
    useStore.getState().fileReport(id, {
      fearedOutcomeOccurred: true, whatHappened: 'x'.repeat(40), learning: 'what it taught me',
    });
    expect(s().quests[0]!.status).toBe('reported');
    expect(useStore.getState().fileReport('nope', {
      fearedOutcomeOccurred: false, whatHappened: 'x'.repeat(40), learning: '',
    })).toBeNull();
  });
});

describe('releasing a goal', () => {
  beforeEach(() => {
    useStore.setState((st) => ({
      state: {
        ...st.state,
        strivings: [
          { id: 's1', text: 'a', createdTs: 't', status: 'active' },
          { id: 's2', text: 'b', createdTs: 't', status: 'active' },
        ],
      },
    }));
  });

  it('retires the striving, records the fork and the victory, and pays for the note', () => {
    useStore.getState().releaseStriving({
      edge: { aId: 's1', bId: 's2' }, strivingId: 's2', mode: 'retire',
      note: 'This one was my father speaking, not me, and I am done with it.',
    });

    expect(s().strivings.find((x) => x.id === 's2')!.status).toBe('released');
    expect(s().ledger.some((e) => e.kind === 'release_victory')).toBe(true);
    expect(s().forks[0]!.choice).toBe('release');
    expect(s().profile.badges).toContain('resistance_was_right');
    expect(s().profile.xp).toBeGreaterThanOrEqual(XP_UNITS.fork);
  });

  it('a revision keeps the striving active and rewrites its text', () => {
    useStore.getState().releaseStriving({
      edge: { aId: 's1', bId: 's2' }, strivingId: 's2', mode: 'revise',
      newText: 'the version that is actually mine',
      note: 'Same territory, but the wording was never how I would put it.',
    });
    const revised = s().strivings.find((x) => x.id === 's2')!;
    expect(revised.status).toBe('active');
    expect(revised.text).toBe('the version that is actually mine');
  });
});

describe('Lifebook actions', () => {
  it('a self-written belief that resembles a known one carries the link through', () => {
    lifebook.addOwnBelief('my own wording of it', ['work'], 'must_be_perfect');
    expect(s().lifebook.beliefs[0]).toMatchObject({
      source: 'own', status: 'confirmed', candidateId: 'must_be_perfect',
    });
    expect(s().ledger.some((e) => e.kind === 'belief_owned')).toBe(true);
  });

  it('rejecting pays nothing and writes no ledger entry about the person', () => {
    lifebook.ruleOnCandidate({
      candidateId: 'not_enough', text: 'x', areas: ['work'], status: 'rejected',
    });
    expect(s().ledger.some((e) => e.kind === 'belief_owned')).toBe(false);
    expect(s().profile.xp).toBe(0);
  });

  it('un-rejecting removes the ruling so the candidate can be offered again', () => {
    lifebook.ruleOnCandidate({
      candidateId: 'not_enough', text: 'x', areas: ['work'], status: 'rejected',
    });
    expect(s().lifebook.beliefs).toHaveLength(1);
    lifebook.unrejectCandidate('not_enough');
    expect(s().lifebook.beliefs).toHaveLength(0);
  });

  it('removing a belief takes its identity with it, leaving no orphan', () => {
    lifebook.addOwnBelief('something of mine', ['work']);
    const beliefId = s().lifebook.beliefs[0]!.id;
    lifebook.setIdentity({ replacesBeliefId: beliefId, text: 'I am someone who…', areas: ['work'], edited: true });
    expect(s().lifebook.identities).toHaveLength(1);

    lifebook.removeBelief(beliefId);
    expect(s().lifebook.identities).toHaveLength(0);
  });

  it('reopening beliefs clears the belief work and keeps the vision', () => {
    lifebook.setVision('work', { statement: 'the life I want' });
    lifebook.addOwnBelief('something of mine', ['work']);
    lifebook.reopenBeliefs();

    expect(s().lifebook.visions).toHaveLength(1);
    expect(s().lifebook.beliefs).toHaveLength(0);
    expect(s().lifebook.stagesCompleted.self_image).toBeUndefined();
  });

  it('an affirmation cannot be logged without evidence reaching the ledger', () => {
    lifebook.addOwnBelief('x', ['work']);
    const beliefId = s().lifebook.beliefs[0]!.id;
    lifebook.setIdentity({ replacesBeliefId: beliefId, text: 'I am someone who ships', areas: ['work'], edited: false });
    const identityId = s().lifebook.identities[0]!.id;
    lifebook.addPractice({ identityId, kind: 'affirmation', text: 'I ship', cadence: 'daily' });
    const itemId = s().lifebook.practices[0]!.id;

    lifebook.logPractice(itemId, 'Sent the draft before I thought it was ready.');
    const logged = s().ledger.find((e) => e.kind === 'practice_logged');
    expect((logged?.payload as { evidence: string }).evidence)
      .toBe('Sent the draft before I thought it was ready.');
  });
});

describe('persistence', () => {
  it('survives a reload', async () => {
    lifebook.setVision('work', { statement: 'I do work I would do anyway.' });
    await whenSaved();

    const reloaded = await loadState();
    expect(reloaded?.lifebook.visions[0]?.statement).toBe('I do work I would do anyway.');
  });

  it('two accounts on one browser never see each other', async () => {
    setStorageScope('user-a');
    lifebook.setVision('work', { statement: "A's life" });
    await whenSaved();

    setStorageScope('user-b');
    expect(await loadState()).toBeNull();

    useStore.setState({ state: emptyState() });
    lifebook.setVision('work', { statement: "B's life" });
    await whenSaved();

    setStorageScope('user-a');
    expect((await loadState())?.lifebook.visions[0]?.statement).toBe("A's life");
    setStorageScope('user-b');
    expect((await loadState())?.lifebook.visions[0]?.statement).toBe("B's life");
  });

  it('wiping one account leaves the other alone', async () => {
    setStorageScope('user-a');
    await saveState({ ...emptyState(), ledger: [{ id: 'x', ts: 't', kind: 'annotation', payload: {} }] });
    setStorageScope('user-b');
    await saveState({ ...emptyState(), ledger: [{ id: 'y', ts: 't', kind: 'annotation', payload: {} }] });

    await wipeCurrentScope();
    expect(await loadState()).toBeNull();

    setStorageScope('user-a');
    expect((await loadState())?.ledger).toHaveLength(1);
  });

  it('notifies the account layer after a local change so a push can be queued', () => {
    const seen: number[] = [];
    useStore.getState().setOnLocalChange((next) => seen.push(next.lifebook.visions.length));
    lifebook.setVision('work', { statement: 'a' });
    lifebook.setVision('health', { statement: 'b' });
    expect(seen).toEqual([1, 2]);
  });
});
