import { createSignal, onCleanup, onMount } from "solid-js";
import { Toaster as SonnerToaster, toast as sonner } from "solid-sonner";

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

// Thin wrapper over Sonner (solid-sonner) that preserves the legacy `toast.*` API
// used across the app.
export const toast = {
  add: (options: Omit<ToastMessage, "id">): string => {
    const opts = { duration: options.duration ?? 3000 };
    let id: string | number;
    switch (options.type) {
      case "success":
        id = sonner.success(options.message, opts);
        break;
      case "danger":
        id = sonner.error(options.message, opts);
        break;
      case "warning":
        id = sonner.warning(options.message, opts);
        break;
      case "info":
        id = sonner.info(options.message, opts);
        break;
      default:
        id = sonner(options.message, opts);
    }
    return String(id);
  },
  remove: (id: string) => {
    // Sonner ids are numeric when auto-generated.
    const n = Number(id);
    sonner.dismiss(Number.isNaN(n) ? id : n);
  },
  clear: () => {
    sonner.dismiss();
  },
  default: (message: string, duration = 3000) => toast.add({ type: "default", message, duration }),
  info: (message: string, duration = 3000) => toast.add({ type: "info", message, duration }),
  success: (message: string, duration = 3000) => toast.add({ type: "success", message, duration }),
  danger: (message: string, duration = 3000) => toast.add({ type: "danger", message, duration }),
  warning: (message: string, duration = 3000) => toast.add({ type: "warning", message, duration }),
};

const positionMap: Record<ToastPosition, "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"> = {
  "top-left": "top-left",
  "top-center": "top-center",
  "top-right": "top-right",
  center: "top-center",
  "bottom-left": "bottom-left",
  "bottom-center": "bottom-center",
  "bottom-right": "bottom-right",
};

export function Toaster(props: { position?: ToastPosition }) {
  const [dark, setDark] = createSignal(false);
  onMount(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    onCleanup(() => obs.disconnect());
  });
  return (
    <SonnerToaster
      position={positionMap[props.position ?? "top-right"]}
      closeButton
      richColors
      theme={dark() ? "dark" : "light"}
    />
  );
}
