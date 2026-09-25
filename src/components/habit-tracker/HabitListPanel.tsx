import type { Dispatch, SetStateAction } from "react";

import type { Habit, HabitForm } from "../../types";

type HabitListPanelProps = {
  habits: Habit[];
  loading: boolean;
  error: string;
  saving: boolean;
  handleToggleHabit: (habit: Habit) => Promise<void>;
  handleDeleteHabit: (habit: Habit) => Promise<void>;
  setEditingId: Dispatch<SetStateAction<number | null>>;
  setForm: Dispatch<SetStateAction<HabitForm>>;
  editingId: number | null;
  resetForm: () => void;
  queuedCount: number;
  isOnline: boolean;
};

export default function HabitListPanel({
  habits,
  loading,
  error,
  saving,
  handleToggleHabit,
  handleDeleteHabit,
  setEditingId,
  setForm,
  editingId,
  resetForm,
  queuedCount,
  isOnline,
}: HabitListPanelProps) {
  return (
    <section className="rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-950">Your habits</h2>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              isOnline
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
            {habits.length} total
          </span>
        </div>
      </div>

      {queuedCount > 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {queuedCount} habit{queuedCount > 1 ? "s" : ""} queued to sync.
        </div>
      ) : null}

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

                  {habit.id < 0 ? (
                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                      queued
                    </span>
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

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {saving && !loading ? (
        <div className="mt-4 text-sm text-neutral-600">Updating...</div>
      ) : null}

      {editingId ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Cancel edit
          </button>
        </div>
      ) : null}
    </section>
  );
}
