import { JSX, mergeProps, Show } from "solid-js";
import { Spinner, SpinnerColor, SpinnerSize } from "./Spinner";

export type LoaderVariant = "block" | "inline" | "overlay" | "fullscreen";

export interface LoaderProps {
  message?: string;
  subtitle?: string;
  size?: SpinnerSize;
  color?: SpinnerColor;
  variant?: LoaderVariant;
  class?: string;
}

export function Loader(rawProps: LoaderProps): JSX.Element {
  const props = mergeProps(
    {
      variant: "block" as LoaderVariant,
      size: "lg" as SpinnerSize,
      color: "indigo" as SpinnerColor,
    },
    rawProps
  );

  return (
    <Show
      when={props.variant === "block"}
      fallback={
        <Show
          when={props.variant === "inline"}
          fallback={
            <Show
              when={props.variant === "overlay"}
              fallback={
                /* fullscreen */
                <div
                  role="status"
                  aria-label={props.message || "Loading..."}
                  class={`fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-center p-4 ${props.class || ""}`}
                >
                  <Spinner size={props.size} color={props.color} aria-hidden={true} />
                  <Show when={props.message}>
                    <span class="text-xs font-mono font-medium text-white">
                      {props.message}
                    </span>
                  </Show>
                  <Show when={props.subtitle}>
                    <span class="text-[11px] text-neutral-300">
                      {props.subtitle}
                    </span>
                  </Show>
                </div>
              }
            >
              {/* overlay */}
              <div
                role="status"
                aria-label={props.message || "Loading..."}
                class={`absolute inset-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-center p-4 rounded-xs ${props.class || ""}`}
              >
                <Spinner size={props.size} color={props.color} aria-hidden={true} />
                <Show when={props.message}>
                  <span class="text-xs font-mono text-neutral-600 dark:text-neutral-300">
                    {props.message}
                  </span>
                </Show>
                <Show when={props.subtitle}>
                  <span class="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {props.subtitle}
                  </span>
                </Show>
              </div>
            </Show>
          }
        >
          {/* inline */}
          <div
            role="status"
            aria-label={props.message || "Loading..."}
            class={`inline-flex items-center gap-2 ${props.class || ""}`}
          >
            <Spinner
              size={props.size === "lg" || props.size === "xl" ? "sm" : props.size}
              color={props.color}
              aria-hidden={true}
            />
            <Show when={props.message}>
              <span class="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                {props.message}
              </span>
            </Show>
          </div>
        </Show>
      }
    >
      {/* block (default) */}
      <div
        role="status"
        aria-label={props.message || "Loading..."}
        class={`py-24 text-center flex flex-col items-center justify-center gap-3 ${props.class || ""}`}
      >
        <Spinner size={props.size} color={props.color} aria-hidden={true} />
        <Show when={props.message}>
          <span class="text-xs font-mono text-neutral-400">
            {props.message}
          </span>
        </Show>
        <Show when={props.subtitle}>
          <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
            {props.subtitle}
          </span>
        </Show>
      </div>
    </Show>
  );
}

export default Loader;
