import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import HabitTracker from "./components/HabitTracker";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HabitTracker />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
