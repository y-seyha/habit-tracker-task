import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseFetch } from "../lib/supabase";
import type { Habit, HabitForm } from "../types";
import { emptyHabitForm } from "../types";

export default function HabitTracker() {
  const navigate = useNavigate();
  const [session, setSession] = useState<null | { user: { id: string } }>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<HabitForm>(emptyHabitForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadHabits = async (activeSession: { user: { id: string } }) => {
    try {
      const rows = await supabaseFetch("/rest/v1/habits", {
        method: "GET",
        query: {
          select: "*",
          user_id: `eq.${activeSession.user.id}`,
          order: "created_at.desc",
        },
      });

      setHabits(rows || []);
      setError("");
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Could not load your habits.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!isMounted) {
        return;
      }

      setSession(currentSession);

      if (currentSession) {
        await loadHabits(currentSession);
      } else {
        setLoading(false);
      }
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: string, currentSession: Session | null) => {
        if (!isMounted) {
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          await loadHabits(currentSession);
        } else {
          setHabits([]);
          setLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const resetForm = () => {
    setForm(emptyHabitForm);
    setEditingId(null);
  };

  const handleSaveHabit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    if (!form.name.trim()) {
      setError("Habit name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        user_id: session.user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        completed: form.completed,
      };

      if (editingId) {
        await supabaseFetch("/rest/v1/habits", {
          method: "PATCH",
          query: {
            id: `eq.${editingId}`,
            user_id: `eq.${session.user.id}`,
          },
          body: payload,
        });
      } else {
        await supabaseFetch("/rest/v1/habits", {
          method: "POST",
          body: payload,
        });
      }

      await loadHabits(session);
      resetForm();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Could not save the habit.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHabit = async (habit: Habit) => {
    if (!session) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await supabaseFetch("/rest/v1/habits", {
        method: "PATCH",
        query: {
          id: `eq.${habit.id}`,
          user_id: `eq.${session.user.id}`,
        },
        body: {
          completed: !habit.completed,
        },
      });

      await loadHabits(session);
    } catch (toggleError) {
      const message =
        toggleError instanceof Error
          ? toggleError.message
          : "Could not update this habit.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async (habit: Habit) => {
    if (!session) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await supabaseFetch("/rest/v1/habits", {
        method: "DELETE",
        query: {
          id: `eq.${habit.id}`,
          user_id: `eq.${session.user.id}`,
        },
      });

      await loadHabits(session);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this habit.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
              Daily Progress
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
              Habit tracker
            </h1>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl border border-neutral-300 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Sign out
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr]">
          <section className="rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-950">
              {editingId ? "Edit habit" : "Add a new habit"}
            </h2>

            <form onSubmit={handleSaveHabit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="habit-name"
                  className="mb-2 block text-sm font-medium text-neutral-700"
                >
                  Name
                </label>
                <input
                  id="habit-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-neutral-900"
                  placeholder="Morning run"
                />
              </div>

              <div>
                <label
                  htmlFor="habit-description"
                  className="mb-2 block text-sm font-medium text-neutral-700"
                >
                  Description
                </label>
                <textarea
                  id="habit-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-neutral-900"
                  placeholder="30 minutes outside before breakfast."
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.completed}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      completed: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                Mark as completed
              </label>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update habit"
                      : "Create habit"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-neutral-950">
                Your habits
              </h2>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                {habits.length} total
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
                Loading habits...
              </div>
            ) : habits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
                No habits yet. Add your first routine above.
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <article
                    key={habit.id}
                    className="rounded-2xl border border-neutral-300 bg-neutral-50 p-4 transition hover:border-neutral-400"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleHabit(habit)}
                            aria-label={`Toggle ${habit.name}`}
                            className={`h-5 w-5 rounded-full border-2 transition ${
                              habit.completed
                                ? "border-neutral-900 bg-neutral-900"
                                : "border-neutral-400 bg-white"
                            }`}
                          />
                          <h3
                            className={`text-base font-bold ${
                              habit.completed
                                ? "text-neutral-500 line-through"
                                : "text-neutral-950"
                            }`}
                          >
                            {habit.name}
                          </h3>
                        </div>

                        {habit.description ? (
                          <p className="mt-2 text-sm text-neutral-600">
                            {habit.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(habit.id);
                            setForm({
                              name: habit.name,
                              description: habit.description,
                              completed: habit.completed,
                            });
                          }}
                          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHabit(habit)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
