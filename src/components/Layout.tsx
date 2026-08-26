import { NavLink, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { isOnboardingComplete } from '../store/progress';
import { isCloudEnabled } from '../config';
import { SyncChip } from './SyncChip';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2.5 py-1.5 text-sm transition-colors ${
    isActive ? 'text-bone bg-surface2' : 'text-muted hover:text-bone'
  }`;

export function Layout({ children }: { children: ReactNode }) {
  // The nav shows what this person actually has, rather than assuming one
  // route through the app: the Lifebook links appear once there is a vision,
  // the map links once the Mirror is complete, and the ledger as soon as
  // there is anything at all to have recorded.
  const consented = useStore((s) => !!s.state.profile.consent);
  const hasLifebook = useStore((s) => s.state.lifebook.visions.length > 0);
  const hasMap = useStore((s) => isOnboardingComplete(s.state));
  const session = useStore((s) => s.session);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface2 focus:px-3 focus:py-2"
      >
        {S.nav.skip}
      </a>

      <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/85 backdrop-blur">
        <nav
          aria-label={S.a11y.primaryNav}
          className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:px-6"
        >
          <Link
            to={hasLifebook ? '/gap' : hasMap ? '/map' : '/'}
            className="mr-2 font-display text-base font-semibold tracking-tight text-bone"
          >
            {S.app.name}
          </Link>

          {hasLifebook ? (
            <>
              <NavLink to="/board" className={linkClass}>{S.nav.board}</NavLink>
              <NavLink to="/gap" className={linkClass}>{S.nav.gap}</NavLink>
              <NavLink to="/blueprint" className={linkClass}>{S.nav.blueprint}</NavLink>
            </>
          ) : null}

          {hasMap ? (
            <>
              <NavLink to="/map" className={linkClass}>{S.nav.map}</NavLink>
              <NavLink to="/quests" className={linkClass}>{S.nav.quests}</NavLink>
            </>
          ) : null}

          {consented ? (
            <NavLink to="/ledger" className={linkClass}>{S.nav.ledger}</NavLink>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            {isCloudEnabled() ? <SyncChip /> : null}
            {isCloudEnabled() && !session ? (
              <NavLink to="/sign-in" className={linkClass}>{S.account.signIn}</NavLink>
            ) : null}
            <NavLink to="/science" className={linkClass}>{S.nav.science}</NavLink>
            {/* §10 — present in the persistent nav on every screen, always. */}
            <NavLink to="/support" className={linkClass}>{S.nav.support}</NavLink>
            <NavLink to="/settings" className={linkClass}>{S.nav.settings}</NavLink>
          </div>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 text-xs text-muted sm:px-6">
        <p>
          {session || !isCloudEnabled() ? S.bits.footer : S.bits.footerLocal}{' '}
          <Link to="/support" className="underline decoration-hairline underline-offset-4 hover:text-bone">
            {S.nav.support}
          </Link>
        </p>
      </footer>
    </div>
  );
}
