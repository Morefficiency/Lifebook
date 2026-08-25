import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ACCESS_MODE } from './config';
import { useStore } from './store/useStore';
import { ONBOARDING_PATH, isOnboardingComplete, onboardingStep } from './store/progress';
import { S } from './strings';

import Landing from './routes/Landing';
import Values from './routes/onboarding/Values';
import Strivings from './routes/onboarding/Strivings';
import Duels from './routes/onboarding/Duels';
import HeatRatings from './routes/onboarding/Heat';
import Mirror from './routes/onboarding/Mirror';
import InsightReportRoute from './routes/onboarding/Report';
import ForkRoute from './routes/Fork';
import Forge from './routes/Forge';
import Rerate from './routes/Rerate';
import MapView from './routes/MapView';
import Quests from './routes/Quests';
import QuestDetail from './routes/QuestDetail';
import Ledger from './routes/Ledger';
import Stats from './routes/Stats';
import Support from './routes/Support';
import Science from './routes/Science';
import Settings from './routes/Settings';

/** Blocks everything but the landing gate and the two static pages until unlocked (§12). */
function RequireAccess({ children }: { children: ReactNode }) {
  const unlocked = useStore((s) => s.unlocked);
  if (ACCESS_MODE === 'code' && !unlocked) return <Navigate to="/" replace />;
  return <>{children}</>;
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

  useEffect(() => { void hydrate(); }, [hydrate]);

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
        <Routes>
          <Route path="/" element={<Landing />} />

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
      </Layout>
    </HashRouter>
  );
}
