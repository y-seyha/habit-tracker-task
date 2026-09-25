import { useRegisterSW } from "virtual:pwa-register/react";

export default function UpdateToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(
      swUrl: string,
      registration: ServiceWorkerRegistration | undefined,
    ) {
      console.info("PWA service worker registered:", swUrl, registration);
    },
    onRegisterError(error: unknown) {
      console.error("PWA registration failed:", error);
    },
  });

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-neutral-300 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        {needRefresh ? (
          <>
            <span className="text-sm font-medium text-neutral-900">
              New version available
            </span>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Refresh
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-neutral-900">
              App ready to work offline
            </span>
            <button
              type="button"
              onClick={() => setOfflineReady(false)}
              className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            >
              Close
            </button>
          </>
        )}

        {needRefresh ? (
          <button
            type="button"
            onClick={() => {
              setNeedRefresh(false);
              setOfflineReady(false);
            }}
            className="text-xs font-medium text-neutral-500 transition hover:text-neutral-700"
            aria-label="Dismiss update notification"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
