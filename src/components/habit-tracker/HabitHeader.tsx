import type { ChangeEvent } from "react";
import type { Session } from "@supabase/supabase-js";

type HabitHeaderProps = {
  session: Session | null;
  avatarError: string;
  shareStatus: string;
  uploadingAvatar: boolean;
  displayAvatarUrl: string | null;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onShare: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function HabitHeader({
  session,
  avatarError,
  shareStatus,
  uploadingAvatar,
  displayAvatarUrl,
  onAvatarUpload,
  onShare,
  onSignOut,
}: HabitHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-neutral-300 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <label className="group flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-neutral-300 bg-neutral-100 shadow-sm transition hover:border-neutral-500">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt="User avatar"
                className="h-full w-full object-cover"
                loading="lazy"
                width={56}
                height={56}
                decoding="async"
              />
            ) : (
              <span className="text-lg font-black text-neutral-500">
                {session?.user.email?.[0]?.toUpperCase() ?? "U"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarUpload}
            />
          </label>
          {uploadingAvatar ? (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
              Uploading
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            Daily Progress
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
            Habit tracker
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {avatarError ? (
          <div className="max-w-xs rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {avatarError}
          </div>
        ) : null}

        {shareStatus ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {shareStatus}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onShare}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Share
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="rounded-xl border border-neutral-300 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
