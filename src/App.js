import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import React from "react";
import "./App.css";
import { SnackbarProvider } from "./components/Snackbar";
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
import SlotBooking from "./pages/SlotBooking";
import AdminRouteGate, {
  hasLeaderAccess,
} from "./components/AdminRouteGate";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const isPrayerBankPublicRoute =
    location.pathname === "/register-prayer-bank" ||
    location.pathname.startsWith("/prayer-bank/");

  if (isPrayerBankPublicRoute) {
    return children;
  }

  if (hasLeaderAccess()) {
    return children;
  }

  return <AdminRouteGate />;
}

function App() {
  return (
    <SnackbarProvider>
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
          <Route
            path="/chapel-slot"
            element={
              <ProtectedRoute>
                <SlotBooking />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
