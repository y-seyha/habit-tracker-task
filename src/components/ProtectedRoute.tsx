import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<null | { user: { id: string } }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (isMounted) {
        setSession(data.session);
        setLoading(false);
      }
    };

    void initializeSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, currentSession: Session | null) => {
        if (isMounted) {
          setSession(currentSession);
          setLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-900">
        <div className="rounded-2xl border border-neutral-300 bg-white px-6 py-4 text-sm font-medium shadow-sm">
          Loading your habit space...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
