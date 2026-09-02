import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ACCESS_MODE, isCloudEnabled, isSellingEnabled } from './config';
import { useStore } from './store/useStore';
import { initAccounts, flushPush } from './store/account';
import { ONBOARDING_PATH, isOnboardingComplete, onboardingStep } from './store/progress';
import { canOpen } from './engine/entitlement';
import { S } from './strings';

import Landing from './routes/Landing';
const Values = lazy(() => import('./routes/onboarding/Values'));
const Strivings = lazy(() => import('./routes/onboarding/Strivings'));
const Duels = lazy(() => import('./routes/onboarding/Duels'));
const HeatRatings = lazy(() => import('./routes/onboarding/Heat'));
const Mirror = lazy(() => import('./routes/onboarding/Mirror'));
const InsightReportRoute = lazy(() => import('./routes/onboarding/Report'));
const ForkRoute = lazy(() => import('./routes/Fork'));
const Forge = lazy(() => import('./routes/Forge'));
const Rerate = lazy(() => import('./routes/Rerate'));
const MapView = lazy(() => import('./routes/MapView'));
const Quests = lazy(() => import('./routes/Quests'));
const QuestDetail = lazy(() => import('./routes/QuestDetail'));
import Ledger from './routes/Ledger';
import Stats from './routes/Stats';
import Support from './routes/Support';
const Science = lazy(() => import('./routes/Science'));
import Settings from './routes/Settings';
import SignIn from './routes/SignIn';

import Vision from './routes/lifebook/Vision';
import Board from './routes/lifebook/Board';
import Goals from './routes/lifebook/Goals';
const Pairs = lazy(() => import('./routes/lifebook/Pairs'));
const Friction = lazy(() => import('./routes/lifebook/Friction'));
const MirrorStage = lazy(() => import('./routes/lifebook/MirrorStage'));
import Current from './routes/lifebook/Current';
import Reflect from './routes/lifebook/Reflect';
import SelfImage from './routes/lifebook/SelfImage';
import Becoming from './routes/lifebook/Becoming';
import Blueprint from './routes/lifebook/Blueprint';
import Life from './routes/Life';
// three.js is the largest thing in the bundle and only this screen needs it.
const ConstellationRoute = lazy(() => import('./routes/Constellation'));
const Print = lazy(() => import('./routes/lifebook/Print'));
const Unlock = lazy(() => import('./routes/Unlock'));
const Privacy = lazy(() => import('./routes/legal/Privacy'));
const Terms = lazy(() => import('./routes/legal/Terms'));
const Refunds = lazy(() => import('./routes/legal/Refunds'));

/**
 * Everything behind this needs an account when there is one to have, and the
 * access code when the build is gated. The two static pages stay open.
 */
function RequireAccess({ children }: { children: ReactNode }) {
  const unlocked = useStore((s) => s.unlocked);
  const session = useStore((s) => s.session);
  const authReady = useStore((s) => s.authReady);

  if (isCloudEnabled()) {
    // Waiting on the session check — showing the sign-in screen here would
    // flash it at someone who is already signed in.
    if (!authReady) return <Loading />;
    if (!session) return <Navigate to="/sign-in" replace />;
    return <>{children}</>;
  }

  if (ACCESS_MODE === 'code' && !unlocked) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Everything after the map.
 *
 * Sits inside RequireAccess, so by the time this runs there is a session. The
 * two states worth being careful about:
 *
 *   not established yet  wait, rather than bounce somebody to a sales page for
 *                        something they already own. A flash of "buy this" at a
 *                        paying customer is worse than a moment of nothing.
 *   could not establish  entitlement stays null after the check. canOpen()
 *                        treats that as unpaid, but /unlock reads the same null
 *                        and offers to try again rather than only to buy.
 */
function RequirePaid({ children }: { children: ReactNode }) {
  const entitlement = useStore((s) => s.entitlement);
  const ready = useStore((s) => s.entitlementReady);
  const { pathname } = useLocation();

  if (!isSellingEnabled()) return <>{children}</>;
  if (!ready) return <Loading />;
  if (!canOpen(pathname, entitlement, true)) {
    return <Navigate to="/unlock" replace state={{ from: pathname }} />;
  }
  return <>{children}</>;
}

/** RequireAccess and RequirePaid together, which is what most routes want. */
function Paid({ children }: { children: ReactNode }) {
  return <RequireAccess><RequirePaid>{children}</RequirePaid></RequireAccess>;
}

function Loading() {
  return (
    <div className="grid min-h-[50dvh] place-items-center text-muted">
      <p className="animate-pulse-soft">{S.common.loading}</p>
    </div>
  );
}

/** Sends the user to the first unanswered question of the Mirror (§5). */
function RequireMirror({ children }: { children: ReactNode }) {
  const state = useStore((s) => s.state);
  if (!isOnboardingComplete(state)) {
    return <Navigate to={ONBOARDING_PATH[onboardingStep(state)]} replace />;
  }
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    void hydrate().then(() => initAccounts());
  }, [hydrate]);

  // A tab being closed or hidden is the last chance to get the most recent
  // work up to the account before the page goes away.
  useEffect(() => {
    const flush = () => { void flushPush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted">
        <p className="animate-pulse-soft">{S.common.loading}</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <Layout>
        <ErrorBoundary>
        {/* The conflict-map machinery and its force-layout library are split
            out: someone who only ever uses the Lifebook stages should not
            download them. */}
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in" element={<SignIn />} />

          {/* Lifebook v2 — the primary journey. */}
          <Route path="/vision" element={<RequireAccess><Vision /></RequireAccess>} />
          <Route path="/board" element={<RequireAccess><Board /></RequireAccess>} />
          <Route path="/goals" element={<RequireAccess><Goals /></RequireAccess>} />
          <Route path="/pairs" element={<RequireAccess><Pairs /></RequireAccess>} />
          <Route path="/friction" element={<RequireAccess><Friction /></RequireAccess>} />
          <Route path="/mirror" element={<Paid><MirrorStage /></Paid>} />
          <Route path="/current" element={<Paid><Current /></Paid>} />
          <Route path="/reflect" element={<Paid><Reflect /></Paid>} />
          <Route path="/self-image" element={<Paid><SelfImage /></Paid>} />
          <Route path="/becoming" element={<Paid><Becoming /></Paid>} />
          <Route path="/blueprint" element={<Paid><Blueprint /></Paid>} />
          <Route path="/life" element={<Paid><Life /></Paid>} />
          <Route path="/constellation" element={<Paid><ConstellationRoute /></Paid>} />
          {/* The gap dashboard was folded into the standing view. Old links,
              bookmarks and the print sheet's Back button still land somewhere. */}
          <Route path="/gap" element={<Navigate to="/life" replace />} />
          <Route path="/print" element={<Paid><Print /></Paid>} />

          {/* v1 — the goal-conflict map and the evidence loop. Still reachable. */}
          <Route path="/onboarding/values" element={<RequireAccess><Values /></RequireAccess>} />
          <Route path="/onboarding/strivings" element={<RequireAccess><Strivings /></RequireAccess>} />
          <Route path="/onboarding/duels" element={<RequireAccess><Duels /></RequireAccess>} />
          <Route path="/onboarding/heat" element={<RequireAccess><HeatRatings /></RequireAccess>} />
          <Route path="/onboarding/mirror" element={<RequireAccess><Mirror /></RequireAccess>} />
          <Route path="/onboarding/report" element={<RequireAccess><InsightReportRoute /></RequireAccess>} />

          <Route path="/fork" element={<Paid><ForkRoute /></Paid>} />
          <Route path="/forge" element={<Paid><Forge /></Paid>} />
          <Route path="/rerate" element={<Paid><Rerate /></Paid>} />

          <Route path="/map" element={<RequireAccess><RequireMirror><MapView /></RequireMirror></RequireAccess>} />
          <Route path="/quests" element={<Paid><RequireMirror><Quests /></RequireMirror></Paid>} />
          <Route path="/quest/:id" element={<Paid><RequireMirror><QuestDetail /></RequireMirror></Paid>} />
          <Route path="/ledger" element={<Paid><Ledger /></Paid>} />
          <Route path="/stats" element={<Paid><Stats /></Paid>} />

          <Route path="/support" element={<Support />} />
          <Route path="/science" element={<Science />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/unlock" element={<RequireAccess><Unlock /></RequireAccess>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refunds" element={<Refunds />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </Layout>
      <UpdatePrompt />
    </HashRouter>
  );
}
