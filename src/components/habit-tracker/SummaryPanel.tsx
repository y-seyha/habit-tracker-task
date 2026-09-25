import type { Habit } from "../../types";

type SummaryPanelProps = {
  habits: Habit[];
  completedCount: number;
};

export default function SummaryPanel({
  habits,
  completedCount,
}: SummaryPanelProps) {
  return (
    <div className="rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
        Summary
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Total
          </p>
          <p className="mt-2 text-3xl font-black text-neutral-950">
            {habits.length}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Done
          </p>
          <p className="mt-2 text-3xl font-black text-neutral-950">
            {completedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Rate
          </p>
          <p className="mt-2 text-3xl font-black text-neutral-950">
            {habits.length === 0
              ? 0
              : Math.round((completedCount / habits.length) * 100)}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
