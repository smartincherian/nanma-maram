import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import React from "react";
import "./App.css";
import { SnackbarProvider } from "./components/Snackbar";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import PrayerForm from "./pages/PrayerForm";
import Home from "./pages/Home";
import IntentionsList from "./pages/IntentionsList";
import Counter from "./pages/Counter";
import ThousandBeads from "./pages/1000beads";
import TeensPersonalPrayer from "./pages/TeensPersonalPrayer";
import TeensPersonalPrayerDashboard from "./pages/TeensPrayerDashboard";
import TeensGame from "./pages/TeensGame";
import PrayerBank from "./pages/PrayerBank";
import Register from "./pages/PrayerBank/Register";
import SlotEventAdmin from "./pages/SlotEventAdmin";
import SlotBookingEvent from "./pages/SlotBookingEvent";
import Admins from "./pages/Admins";
import VideosDashboard from "./pages/Videos";
import VideoForm from "./pages/Videos/VideoForm";
import VideoDetail from "./pages/Videos/VideoDetail";
import VideoConfig from "./pages/VideoConfig";
import CrewJoin from "./pages/CrewJoin";
import CrewHome from "./pages/CrewHome";
import CrewProfile from "./pages/CrewProfile";
import OrgManage from "./pages/Org/OrgManage";
import OrgCounterForm from "./pages/Org/OrgCounterForm";
import OrgLanding from "./pages/Org/OrgLanding";
import OrgCounter from "./pages/Org/OrgCounter";
import OrgAdmin from "./pages/Org/OrgAdmin";

// Carries the legacy /videos/:id (and /edit) id through to the canonical
// /admin/media/:id path so old deep links keep working.
function RedirectMedia({ edit = false }) {
  const { id } = useParams();
  return <Navigate to={`/admin/media/${id}${edit ? "/edit" : ""}`} replace />;
}

function App() {
  return (
    <SnackbarProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intention-add"
            element={
              <ProtectedRoute>
                <PrayerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intention-edit/:id"
            element={
              <ProtectedRoute>
                <PrayerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intention-list"
            element={
              <ProtectedRoute>
                <IntentionsList />
              </ProtectedRoute>
            }
          />
          <Route path="/counter/:id" element={<Counter />} />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute>
                <VideosDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media/new"
            element={
              <ProtectedRoute>
                <VideoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media/:id"
            element={
              <ProtectedRoute>
                <VideoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media/:id/edit"
            element={
              <ProtectedRoute>
                <VideoForm />
              </ProtectedRoute>
            }
          />
          {/* Legacy /videos URLs redirect to the canonical /admin/media paths. */}
          <Route path="/videos" element={<Navigate to="/admin/media" replace />} />
          <Route path="/videos/new" element={<Navigate to="/admin/media/new" replace />} />
          <Route path="/videos/:id" element={<RedirectMedia />} />
          <Route path="/videos/:id/edit" element={<RedirectMedia edit />} />
          <Route
            path="/video-config"
            element={
              <ProtectedRoute>
                <VideoConfig />
              </ProtectedRoute>
            }
          />
          <Route path="/crew/join" element={<CrewJoin />} />
          <Route path="/crew/profile" element={<CrewProfile />} />
          <Route path="/crew" element={<CrewHome />} />
          {/* Same page; the extra param opens the work sheet as a modal route so
              the browser/Android back button dismisses it and works are deep-linkable. */}
          <Route path="/crew/work/:videoId/:stageId" element={<CrewHome />} />
          <Route
            path="/admins"
            element={
              <ProtectedRoute>
                <Admins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intention-mother"
            element={
              <ProtectedRoute>
                <PrayerForm path={"mother"} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/1000-beads-extra"
            element={<ThousandBeads />}
          />
          <Route
            path="/prayer-bank/:id"
            element={
              <ProtectedRoute>
                <PrayerBank />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teens-personal-prayer"
            element={
              <ProtectedRoute>
                <TeensPersonalPrayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teens-dashboard"
            element={
              <ProtectedRoute>
                <TeensPersonalPrayerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teens-game"
            element={
              <ProtectedRoute>
                <TeensGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-prayer-bank"
            element={
              <ProtectedRoute>
                <Register />
              </ProtectedRoute>
            }
          />
          {["/chapel-slot", "/chapel", "/event"].map((base) => (
            <React.Fragment key={base}>
              <Route
                path={base}
                element={
                  <ProtectedRoute>
                    <SlotEventAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`${base}/:eventId`}
                element={<SlotBookingEvent />}
              />
              <Route
                path={`${base}/:eventId/:date`}
                element={<SlotBookingEvent />}
              />
              <Route
                path={`${base}/:eventId/:date/power`}
                element={<SlotBookingEvent />}
              />
            </React.Fragment>
          ))}
          <Route
            path="/org-manage"
            element={
              <ProtectedRoute>
                <OrgManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org-manage/:orgId/counter/new"
            element={
              <ProtectedRoute>
                <OrgCounterForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org-manage/:orgId/counter/:counterId/edit"
            element={
              <ProtectedRoute>
                <OrgCounterForm />
              </ProtectedRoute>
            }
          />
          {/* Org public routes — keep LAST so static routes above win. */}
          <Route path="/:orgSlug" element={<OrgLanding />} />
          <Route path="/:orgSlug/counter/:id" element={<OrgCounter />} />
          <Route path="/:orgSlug/admin" element={<OrgAdmin />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
