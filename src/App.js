import { BrowserRouter, Route, Routes } from "react-router-dom";
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
