import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { HabitForm } from "../../types";

type HabitFormSectionProps = {
  form: HabitForm;
  error: string;
  saving: boolean;
  editingId: number | null;
  setForm: Dispatch<SetStateAction<HabitForm>>;
  resetForm: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function HabitFormSection({
  form,
  error,
  saving,
  editingId,
  setForm,
  resetForm,
  onSubmit,
}: HabitFormSectionProps) {
  return (
    <section className="rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-950">
        {editingId ? "Edit habit" : "Add a new habit"}
      </h2>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
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
            {saving ? "Saving..." : editingId ? "Update habit" : "Create habit"}
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
  );
}
