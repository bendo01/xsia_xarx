import { JSX, mergeProps, Show } from "solid-js";

export type ErrorAccentColor = "teal" | "indigo" | "blue" | "red";

export interface ErrorFallbackProps {
  error?: any;
  title?: string;
  onRetry?: () => void;
  reset?: () => void;
  retryText?: string;
  accentColor?: ErrorAccentColor;
  variant?: "card" | "inline" | "banner";
  class?: string;
}

const buttonColors: Record<ErrorAccentColor, string> = {
  teal: "bg-teal-600 hover:bg-teal-500",
  indigo: "bg-indigo-600 hover:bg-indigo-500",
  blue: "bg-blue-600 hover:bg-blue-500",
  red: "bg-red-600 hover:bg-red-500",
};

export function ErrorFallback(rawProps: ErrorFallbackProps): JSX.Element {
  const props = mergeProps(
    {
      title: "Terjadi Kendala Memuat Data",
      retryText: "Coba Muat Ulang",
      accentColor: "teal" as ErrorAccentColor,
      variant: "card" as const,
    },
    rawProps
  );

  const getErrorMessage = () => {
    if (!props.error) return "Unknown error occurred";
    if (typeof props.error === "string") return props.error;
    if (props.error instanceof Error) return props.error.message;
    if (typeof props.error === "object" && "message" in props.error) {
      return String(props.error.message);
    }
    return JSON.stringify(props.error);
  };

  const handleRetry = () => {
    if (props.reset) {
      props.reset();
    } else if (props.onRetry) {
      props.onRetry();
    }
  };

  const hasRetry = () => Boolean(props.reset || props.onRetry);

  return (
    <Show
      when={props.variant === "card"}
      fallback={
        <div
          class={`p-4 rounded-xs border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 flex items-center justify-between gap-4 ${props.class || ""}`}
        >
          <div class="flex items-center gap-3 min-w-0">
            <svg class="size-5 shrink-0 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="text-xs truncate">
              <span class="font-bold mr-2">{props.title}:</span>
              <span class="font-mono">{getErrorMessage()}</span>
            </div>
          </div>
          <Show when={hasRetry()}>
            <button
              type="button"
              onClick={handleRetry}
              class={`px-3 py-1.5 rounded-xs text-white text-xs font-semibold shadow-xs transition-colors shrink-0 ${buttonColors[props.accentColor] || buttonColors.teal}`}
            >
              {props.retryText}
            </button>
          </Show>
        </div>
      }
    >
      <div
        class={`p-8 max-w-xl mx-auto my-12 bg-white dark:bg-neutral-800 rounded-xs border border-red-200 dark:border-red-900/50 shadow-xl text-center space-y-4 ${props.class || ""}`}
      >
        <div class="size-12 mx-auto rounded-xs bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
          <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
          {props.title}
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-900 p-3 rounded-xs break-all max-h-48 overflow-y-auto">
          {getErrorMessage()}
        </p>
        <Show when={hasRetry()}>
          <button
            type="button"
            onClick={handleRetry}
            class={`px-4 py-2 rounded-xs text-white text-xs font-semibold shadow-md transition-colors ${buttonColors[props.accentColor] || buttonColors.teal}`}
          >
            {props.retryText}
          </button>
        </Show>
      </div>
    </Show>
  );
}

export default ErrorFallback;
