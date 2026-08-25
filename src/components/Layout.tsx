import { NavLink, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { S } from '../strings';
import { useStore } from '../store/useStore';
import { isOnboardingComplete } from '../store/progress';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2.5 py-1.5 text-sm transition-colors ${
    isActive ? 'text-bone bg-surface2' : 'text-muted hover:text-bone'
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const state = useStore((s) => s.state);
  const complete = isOnboardingComplete(state);

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
            to={complete ? '/map' : '/'}
            className="mr-2 font-display text-base font-semibold tracking-tight text-bone"
          >
            {S.app.name}
          </Link>

          {complete ? (
            <>
              <NavLink to="/map" className={linkClass}>{S.nav.map}</NavLink>
              <NavLink to="/quests" className={linkClass}>{S.nav.quests}</NavLink>
              <NavLink to="/ledger" className={linkClass}>{S.nav.ledger}</NavLink>
              <NavLink to="/stats" className={linkClass}>{S.nav.stats}</NavLink>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
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
          {S.bits.footer}{' '}
          <Link to="/support" className="underline decoration-hairline underline-offset-4 hover:text-bone">
            {S.nav.support}
          </Link>
        </p>
      </footer>
    </div>
  );
}
