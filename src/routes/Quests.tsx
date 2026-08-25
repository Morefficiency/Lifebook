/** §7.4 — quest list. No timers, no deadlines, no red badges. */
import { Link } from 'react-router-dom';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { Page, Tag } from '../components/ui';
import type { Quest } from '../types';

const STATUS_LABEL: Record<Quest['status'], string> = {
  active: S.quest.active,
  reported: S.quest.reported,
  abandoned: S.quest.abandoned,
};

export default function Quests() {
  const quests = useStore((s) => s.state.quests);
  const ordered = [...quests].sort((a, b) => (a.createdTs < b.createdTs ? 1 : -1));

  return (
    <Page title={S.nav.quests}>
      <Link to="/forge" className="btn-ghost">{S.quest.newQuest}</Link>

      {ordered.length === 0 ? (
        <p className="mt-8 text-muted">{S.quest.empty}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {ordered.map((q) => {
            const done = q.steps.filter((s) => s.done).length;
            return (
              <li key={q.id}>
                <Link
                  to={`/quest/${q.id}`}
                  className="block rounded-md border border-hairline p-4 hover:border-instrument-dim hover:bg-surface"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone={q.status === 'active' ? 'neutral' : 'neutral'}>
                      {STATUS_LABEL[q.status]}
                    </Tag>
                    {q.edge ? <Tag tone="fault">{S.bits.fromFaultLine}</Tag> : null}
                  </div>
                  <p className="mt-3 leading-snug">{q.wish}</p>
                  <p className="mt-2 numeral text-xs text-muted">
                    {S.quest.stepsDone(done, q.steps.length)} · {S.quest.forecastLine(q.forecastP)}{' '}
                    {S.quest.fearLine(q.fearRating)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
