import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ACCESS_MODE, isCloudEnabled } from './config';
import { useStore } from './store/useStore';
import { initAccounts, flushPush } from './store/account';
import { ONBOARDING_PATH, isOnboardingComplete, onboardingStep } from './store/progress';
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
import Current from './routes/lifebook/Current';
import Reflect from './routes/lifebook/Reflect';
import SelfImage from './routes/lifebook/SelfImage';
import Becoming from './routes/lifebook/Becoming';
import Blueprint from './routes/lifebook/Blueprint';
import Gap from './routes/lifebook/Gap';
const Print = lazy(() => import('./routes/lifebook/Print'));

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
          <Route path="/current" element={<RequireAccess><Current /></RequireAccess>} />
          <Route path="/reflect" element={<RequireAccess><Reflect /></RequireAccess>} />
          <Route path="/self-image" element={<RequireAccess><SelfImage /></RequireAccess>} />
          <Route path="/becoming" element={<RequireAccess><Becoming /></RequireAccess>} />
          <Route path="/blueprint" element={<RequireAccess><Blueprint /></RequireAccess>} />
          <Route path="/gap" element={<RequireAccess><Gap /></RequireAccess>} />
          <Route path="/print" element={<RequireAccess><Print /></RequireAccess>} />

          {/* v1 — the goal-conflict map and the evidence loop. Still reachable. */}
          <Route path="/onboarding/values" element={<RequireAccess><Values /></RequireAccess>} />
          <Route path="/onboarding/strivings" element={<RequireAccess><Strivings /></RequireAccess>} />
          <Route path="/onboarding/duels" element={<RequireAccess><Duels /></RequireAccess>} />
          <Route path="/onboarding/heat" element={<RequireAccess><HeatRatings /></RequireAccess>} />
          <Route path="/onboarding/mirror" element={<RequireAccess><Mirror /></RequireAccess>} />
          <Route path="/onboarding/report" element={<RequireAccess><InsightReportRoute /></RequireAccess>} />

          <Route path="/fork" element={<RequireAccess><ForkRoute /></RequireAccess>} />
          <Route path="/forge" element={<RequireAccess><Forge /></RequireAccess>} />
          <Route path="/rerate" element={<RequireAccess><Rerate /></RequireAccess>} />

          <Route path="/map" element={<RequireAccess><RequireMirror><MapView /></RequireMirror></RequireAccess>} />
          <Route path="/quests" element={<RequireAccess><RequireMirror><Quests /></RequireMirror></RequireAccess>} />
          <Route path="/quest/:id" element={<RequireAccess><RequireMirror><QuestDetail /></RequireMirror></RequireAccess>} />
          <Route path="/ledger" element={<RequireAccess><Ledger /></RequireAccess>} />
          <Route path="/stats" element={<RequireAccess><Stats /></RequireAccess>} />

          <Route path="/support" element={<Support />} />
          <Route path="/science" element={<Science />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </Layout>
      <UpdatePrompt />
    </HashRouter>
  );
}
