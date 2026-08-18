import { createStore } from "solid-js/store";
import { For, Match, Switch } from "solid-js";
import { Portal } from "solid-js/web";
import { TransitionGroup } from "solid-transition-group";

export type ToastType = "default" | "info" | "success" | "danger" | "warning";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Global store for toasts
const [toasts, setToasts] = createStore<ToastMessage[]>([]);

// Helper to manage toasts
export const toast = {
  add: (options: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((t) => [...t, { ...options, id }]);

    const duration = options.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        toast.remove(id);
      }, duration);
    }
    return id;
  },
  remove: (id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  },
  default: (message: string, duration = 3000) => toast.add({ type: "default", message, duration }),
  info: (message: string, duration = 3000) => toast.add({ type: "info", message, duration }),
  success: (message: string, duration = 3000) => toast.add({ type: "success", message, duration }),
  danger: (message: string, duration = 3000) => toast.add({ type: "danger", message, duration }),
  warning: (message: string, duration = 3000) => toast.add({ type: "warning", message, duration }),
};

const positionClasses: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4 flex-col",
  "top-center": "top-4 left-1/2 -translate-x-1/2 flex-col items-center",
  "top-right": "top-4 right-4 flex-col items-end",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center",
  "bottom-left": "bottom-4 left-4 flex-col-reverse",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 flex-col-reverse items-center",
  "bottom-right": "bottom-4 right-4 flex-col-reverse items-end",
};

export function Toaster(props: { position?: ToastPosition }) {
  const position = () => props.position || "top-right";

  return (
    <Portal>
      <div class={`fixed z-50 flex gap-2 pointer-events-none p-4 ${positionClasses[position()]}`}>
        <style>{`
          .toast-enter {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          .toast-enter-active {
            opacity: 1;
            transform: translateY(0) scale(1);
            transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
          }
          .toast-exit {
            opacity: 1;
            transform: scale(1);
          }
          .toast-exit-active {
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 200ms cubic-bezier(0.4, 0, 1, 1), transform 200ms cubic-bezier(0.4, 0, 1, 1);
          }
          @keyframes toast-shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          .toast-progress {
            animation: toast-shrink linear forwards;
          }
        `}</style>
        <TransitionGroup name="toast">
          <For each={toasts}>
            {(t) => (
              <div class="pointer-events-auto shrink-0 w-full max-w-sm">
                <ToastItem toast={t} />
              </div>
            )}
          </For>
        </TransitionGroup>
      </div>
    </Portal>
  );
}

function ToastItem(props: { toast: ToastMessage }) {
  const baseToastClass = "relative overflow-hidden flex items-center w-full max-w-sm p-4 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700";
  const closeBtnClass = "ms-auto flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-transparent box-border border border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:ring-4 focus:ring-neutral-200 dark:focus:ring-neutral-600 font-medium leading-5 rounded-full text-sm h-8 w-8 focus:outline-none transition-colors";

  return (
    <Switch>
      <Match when={props.toast.type === "default" || props.toast.type === "info"}>
        <div class={baseToastClass} role="alert">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.122 17.645a7.185 7.185 0 0 1-2.656 2.495 7.06 7.06 0 0 1-3.52.853 6.617 6.617 0 0 1-3.306-.718 6.73 6.73 0 0 1-2.54-2.266c-2.672-4.57.287-8.846.887-9.668A4.448 4.448 0 0 0 8.07 6.31 4.49 4.49 0 0 0 7.997 4c1.284.965 6.43 3.258 5.525 10.631 1.496-1.136 2.7-3.046 2.846-6.216 1.43 1.061 3.985 5.462 1.754 9.23Z" /></svg>
          <div class="ms-2.5 text-sm border-s border-neutral-200 dark:border-neutral-700 ps-3.5">{props.toast.message}</div>
          <button type="button" class={closeBtnClass} onClick={() => toast.remove(props.toast.id)} aria-label="Close">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
          </button>
          {props.toast.duration && props.toast.duration > 0 && (
            <div class="absolute bottom-0 left-0 h-1 bg-blue-500/20 dark:bg-blue-400/20 toast-progress" style={{ "animation-duration": `${props.toast.duration}ms` }} />
          )}
        </div>
      </Match>
      <Match when={props.toast.type === "success"}>
        <div class={baseToastClass} role="alert">
          <div class="inline-flex items-center justify-center shrink-0 w-7 h-7 text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900 rounded-full">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>
            <span class="sr-only">Check icon</span>
          </div>
          <div class="ms-3 text-sm font-normal">{props.toast.message}</div>
          <button type="button" class={closeBtnClass} onClick={() => toast.remove(props.toast.id)} aria-label="Close">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
          </button>
          {props.toast.duration && props.toast.duration > 0 && (
            <div class="absolute bottom-0 left-0 h-1 bg-green-500/30 dark:bg-green-400/30 toast-progress" style={{ "animation-duration": `${props.toast.duration}ms` }} />
          )}
        </div>
      </Match>
      <Match when={props.toast.type === "danger"}>
        <div class={baseToastClass} role="alert">
          <div class="inline-flex items-center justify-center shrink-0 w-7 h-7 text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900 rounded-full">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
            <span class="sr-only">Error icon</span>
          </div>
          <div class="ms-3 text-sm font-normal">{props.toast.message}</div>
          <button type="button" class={closeBtnClass} onClick={() => toast.remove(props.toast.id)} aria-label="Close">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
          </button>
          {props.toast.duration && props.toast.duration > 0 && (
            <div class="absolute bottom-0 left-0 h-1 bg-red-500/30 dark:bg-red-400/30 toast-progress" style={{ "animation-duration": `${props.toast.duration}ms` }} />
          )}
        </div>
      </Match>
      <Match when={props.toast.type === "warning"}>
        <div class={baseToastClass} role="alert">
          <div class="inline-flex items-center justify-center shrink-0 w-7 h-7 text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900 rounded-full">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            <span class="sr-only">Warning icon</span>
          </div>
          <div class="ms-3 text-sm font-normal">{props.toast.message}</div>
          <button type="button" class={closeBtnClass} onClick={() => toast.remove(props.toast.id)} aria-label="Close">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
          </button>
          {props.toast.duration && props.toast.duration > 0 && (
            <div class="absolute bottom-0 left-0 h-1 bg-yellow-500/30 dark:bg-yellow-400/30 toast-progress" style={{ "animation-duration": `${props.toast.duration}ms` }} />
          )}
        </div>
      </Match>
    </Switch>
  );
}
