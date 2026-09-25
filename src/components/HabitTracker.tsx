import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseFetch } from "../lib/supabase";
import ErrorBoundary from "./ErrorBoundary";
import HabitFormSection from "./habit-tracker/HabitFormSection";
import HabitHeader from "./habit-tracker/HabitHeader";
import HabitListPanel from "./habit-tracker/HabitListPanel";
import SummaryPanel from "./habit-tracker/SummaryPanel";
import type { Habit, HabitForm } from "../types";
import { MAX_AVATAR_SIZE_BYTES, emptyHabitForm } from "../types";

const QUEUE_STORAGE_KEY = "habit-tracker-queued-habits";

function getQueuedHabits(): Habit[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Habit[]) : [];
  } catch {
    return [];
  }
}

function persistQueuedHabits(habits: Habit[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(habits));
}

function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose a valid image file.";
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "Image must be 1 MB or smaller.";
  }

  return null;
}

export default function HabitTracker() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<HabitForm>(emptyHabitForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [queuedHabits, setQueuedHabits] = useState<Habit[]>(() =>
    getQueuedHabits(),
  );
  const [shareStatus, setShareStatus] = useState("");

  const completedCount = useMemo(
    () => habits.filter((habit) => habit.completed).length,
    [habits],
  );

  const syncQueuedHabits = async () => {
    if (!session || !navigator.onLine || queuedHabits.length === 0) {
      return;
    }

    const pending = [...queuedHabits];

    for (const queuedHabit of pending) {
      try {
        await supabaseFetch("/rest/v1/habits", {
          method: "POST",
          body: {
            user_id: session.user.id,
            name: queuedHabit.name,
            description: queuedHabit.description,
            completed: queuedHabit.completed,
          },
        });

        setQueuedHabits((current) => {
          const next = current.filter((habit) => habit.id !== queuedHabit.id);
          persistQueuedHabits(next);
          return next;
        });
      } catch (syncError) {
        console.warn("Queued habit sync failed.", syncError);
        return;
      }
    }

    await loadHabits(session);
  };

  const loadHabits = async (activeSession: Session) => {
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

  const ensureProfileRow = async (activeSession: Session) => {
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: activeSession.user.id,
        avatar_url: null,
      })
      .select("id");

    if (error && error.code !== "23505") {
      throw error;
    }
  };

  const loadProfile = async (activeSession: Session) => {
    try {
      await ensureProfileRow(activeSession);

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", activeSession.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const savedAvatarUrl = data?.avatar_url ?? null;

      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setAvatarUrl(savedAvatarUrl);
      setPreviewUrl(savedAvatarUrl);
      setAvatarError("");
    } catch (profileError) {
      const message =
        profileError instanceof Error
          ? profileError.message
          : "Could not load your profile.";
      setAvatarError(message);
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
        await loadProfile(currentSession);
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
          await loadProfile(currentSession);
        } else {
          setHabits([]);
          setAvatarUrl(null);
          setPreviewUrl(null);
          setLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (session) {
        void syncQueuedHabits();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [session, queuedHabits]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

      if (!navigator.onLine) {
        const queuedHabit: Habit = {
          id: -Date.now(),
          ...payload,
          created_at: new Date().toISOString(),
        };

        const nextQueuedHabits = [queuedHabit, ...queuedHabits];
        setQueuedHabits(nextQueuedHabits);
        persistQueuedHabits(nextQueuedHabits);
        setHabits((current) => [queuedHabit, ...current]);
        setShareStatus("Habit saved offline and queued for sync.");
        resetForm();
        return;
      }

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

      if (habit.id < 0) {
        const nextQueuedHabits = queuedHabits.filter(
          (item) => item.id !== habit.id,
        );
        setQueuedHabits(nextQueuedHabits);
        persistQueuedHabits(nextQueuedHabits);
      }

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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !session) {
      return;
    }

    const fileValidationError = validateAvatarFile(selectedFile);

    if (fileValidationError) {
      setAvatarError(fileValidationError);
      event.target.value = "";
      return;
    }

    setAvatarError("");
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setUploadingAvatar(true);

    try {
      const avatarPath = `${session.user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, selectedFile, {
          upsert: true,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(avatarPath);
      const publicUrl = data.publicUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: session.user.id,
            avatar_url: publicUrl,
          },
          { onConflict: "id" },
        )
        .select();

      if (profileError) {
        throw profileError;
      }

      setAvatarUrl(publicUrl);
      setPreviewUrl(publicUrl);
    } catch (uploadFailure) {
      const message =
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Could not upload the avatar.";
      setAvatarError(message);
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Habit Tracker",
          text: "Check out my routine progress.",
          url: shareUrl,
        });
        setShareStatus("Share sheet opened.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Link copied to clipboard.");
        return;
      }

      setShareStatus("Sharing is unavailable in this browser.");
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== "AbortError") {
        setShareStatus(shareError.message);
      }
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

  const displayAvatarUrl = previewUrl ?? avatarUrl ?? null;

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ErrorBoundary
          fallback={(reset) => (
            <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
              <p className="font-semibold">
                Navigation section failed to load.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-500"
              >
                Try again
              </button>
            </div>
          )}
        >
          <HabitHeader
            session={session}
            avatarError={avatarError}
            shareStatus={shareStatus}
            uploadingAvatar={uploadingAvatar}
            displayAvatarUrl={displayAvatarUrl}
            onAvatarUpload={handleAvatarUpload}
            onShare={handleShare}
            onSignOut={handleSignOut}
          />
        </ErrorBoundary>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_2fr]">
          <div className="space-y-6">
            <ErrorBoundary
              fallback={(reset) => (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                  <p className="font-semibold">
                    The habit form became unavailable.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 rounded-xl bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-500"
                  >
                    Try again
                  </button>
                </div>
              )}
            >
              <HabitFormSection
                form={form}
                error={error}
                saving={saving}
                editingId={editingId}
                setForm={setForm}
                resetForm={resetForm}
                onSubmit={handleSaveHabit}
              />
            </ErrorBoundary>

            <ErrorBoundary
              fallback={(reset) => (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                  <p className="font-semibold">The stats panel crashed.</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 rounded-xl bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-500"
                  >
                    Try again
                  </button>
                </div>
              )}
            >
              <SummaryPanel habits={habits} completedCount={completedCount} />
            </ErrorBoundary>
          </div>

          <ErrorBoundary
            fallback={(reset) => (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                <p className="font-semibold">Your habit list failed to load.</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-xl bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-500"
                >
                  Try again
                </button>
              </div>
            )}
          >
            <HabitListPanel
              habits={habits}
              loading={loading}
              error={error}
              saving={saving}
              handleToggleHabit={handleToggleHabit}
              handleDeleteHabit={handleDeleteHabit}
              setEditingId={setEditingId}
              setForm={setForm}
              editingId={editingId}
              resetForm={resetForm}
              queuedCount={queuedHabits.length}
              isOnline={isOnline}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
