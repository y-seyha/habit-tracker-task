/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:pwa-register/react" {
  export function useRegisterSW(options?: {
    onRegisteredSW?: (
      swUrl: string,
      registration?: ServiceWorkerRegistration,
    ) => void;
    onRegisterError?: (error: unknown) => void;
  }): {
    offlineReady: [boolean, (value: boolean) => void];
    needRefresh: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
