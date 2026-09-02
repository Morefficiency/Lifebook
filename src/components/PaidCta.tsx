/**
 * A door that says whether it is locked before you walk into it.
 *
 * The free tier ends at the map, and the two things a person naturally reaches
 * for next — take a fault line into a fork, forge an experiment — are the first
 * paid screens. Without this they click an ordinary-looking button and land on
 * a sales page, which reads as a bait-and-switch even when the price was on the
 * landing page all along.
 *
 * So: for somebody who has paid, or for a build with nothing to sell, this is
 * an ordinary button and adds nothing. For somebody who has not, it says what
 * lies behind it and what it costs, and the click goes to the offer on purpose
 * rather than by ambush.
 *
 * The tone is load-bearing. This is not a nag and not a teaser — it appears
 * exactly where the free tier genuinely runs out, states the price plainly, and
 * never appears twice on one screen.
 */
import { Link, useNavigate } from 'react-router-dom';
import { PRICE_DISPLAY, isSellingEnabled } from '../config';
import { useStore } from '../store/useStore';
import { hasPaid } from '../engine/entitlement';
import { S } from '../strings';

/** True when this person may open the paid screens. */
export function useIsPaid(): boolean {
  const entitlement = useStore((s) => s.entitlement);
  if (!isSellingEnabled()) return true;
  return hasPaid(entitlement);
}

export interface PaidCtaProps {
  /** Where it goes once bought. */
  to: string;
  /** Or what it does — for buttons that compute a destination. */
  onClick?: () => void;
  /** The button's own label, used unchanged for anyone who has paid. */
  children: string;
  /** One line naming what is behind it. Shown only to somebody who has not. */
  behind: string;
  className?: string;
  disabled?: boolean;
}

export function PaidCta({
  to, onClick, children, behind, className = 'btn-primary', disabled = false,
}: PaidCtaProps) {
  const navigate = useNavigate();
  const paid = useIsPaid();

  if (paid) {
    if (onClick) {
      return (
        <button type="button" className={className} onClick={onClick} disabled={disabled}>
          {children}
        </button>
      );
    }
    return <Link to={to} className={className}>{children}</Link>;
  }

  return (
    <div className="rounded-lg border border-dashed border-hairline p-4">
      <p className="text-sm leading-relaxed text-bone">{behind}</p>
      <p className="mt-1 text-xs text-muted">{S.paid.cost(PRICE_DISPLAY)}</p>
      <button
        type="button"
        className="btn-ghost mt-3"
        onClick={() => navigate('/unlock', { state: { from: to } })}
      >
        {S.paid.see}
      </button>
    </div>
  );
}

/**
 * One line, under a group of doors that are all on the paid side.
 *
 * Used where the layout is already right and the only thing missing is honesty
 * — the map's two doors, for instance, which are the best-composed moment in
 * the app and should not be turned into a pair of upsell boxes. Renders nothing
 * at all for somebody who has paid, or for a build with nothing to sell, so the
 * screen a customer sees is exactly the screen that was designed.
 */
export function PaidNote({ children }: { children?: string }) {
  const paid = useIsPaid();
  if (paid) return null;
  return (
    <p className="mt-4 text-xs leading-relaxed text-muted">
      {children ?? S.paid.note}{' '}
      <Link
        to="/unlock"
        className="text-instrument underline decoration-instrument-dim underline-offset-4 hover:decoration-instrument"
      >
        {S.paid.see}
      </Link>
    </p>
  );
}
