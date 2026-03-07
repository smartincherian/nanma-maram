import { BrowserRouter, Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <SnackbarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intention-add" element={<PrayerForm />} />
          <Route path="/intention-list" element={<IntentionsList />} />
          <Route path="/counter/:id" element={<Counter />} />
          <Route
            path="/intention-mother"
            element={<PrayerForm path={"mother"} />}
          />
          <Route path="/1000-beads-extra" element={<ThousandBeads />} />
          <Route path="/prayer-bank/:id" element={<PrayerBank />} />
          <Route
            path="/teens-personal-prayer"
            element={<TeensPersonalPrayer />}
          />
          <Route
            path="/teens-dashboard"
            element={<TeensPersonalPrayerDashboard />}
          />
          <Route path="/teens-game" element={<TeensGame />} />
          <Route path="/register-prayer-bank" element={<Register />} />
          <Route path="/chapel-slot" element={<SlotBooking />} />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
