import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { SnackbarProvider } from "./components/Snackbar";
import PrayerForm from "./pages/PrayerForm";
import Home from "./pages/Home";
import IntentionsList from "./pages/IntentionsList";
import Counter from "./pages/Counter";

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
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
