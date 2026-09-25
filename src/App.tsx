import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import HabitTracker from "./components/HabitTracker";
import ProtectedRoute from "./components/ProtectedRoute";
import UpdateToast from "./components/UpdateToast";

function App() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
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

      <UpdateToast />

      {!isOnline ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg">
            <span>
              Offline mode: queued changes will sync when you reconnect.
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default App;
