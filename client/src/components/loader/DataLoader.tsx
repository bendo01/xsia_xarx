import { JSX, mergeProps, Show } from "solid-js";
import { Loader } from "./Loader";
import { ErrorFallback, ErrorAccentColor } from "./ErrorFallback";
import { SpinnerColor, SpinnerSize } from "./Spinner";

export interface DataLoaderProps {
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  reset?: () => void;
  loadingMessage?: string;
  loadingSubtitle?: string;
  errorTitle?: string;
  retryText?: string;
  color?: SpinnerColor;
  accentColor?: ErrorAccentColor;
  size?: SpinnerSize;
  loaderClass?: string;
  errorClass?: string;
  children?: JSX.Element;
}

export function DataLoader(rawProps: DataLoaderProps): JSX.Element {
  const props = mergeProps(
    {
      color: "indigo" as SpinnerColor,
      accentColor: "teal" as ErrorAccentColor,
      size: "lg" as SpinnerSize,
    },
    rawProps
  );

  return (
    <Show
      when={!props.error}
      fallback={
        <ErrorFallback
          error={props.error}
          title={props.errorTitle}
          onRetry={props.onRetry}
          reset={props.reset}
          retryText={props.retryText}
          accentColor={props.accentColor}
          class={props.errorClass}
        />
      }
    >
      <Show
        when={!props.loading}
        fallback={
          <Loader
            message={props.loadingMessage}
            subtitle={props.loadingSubtitle}
            color={props.color}
            size={props.size}
            class={props.loaderClass}
          />
        }
      >
        {props.children}
      </Show>
    </Show>
  );
}

export default DataLoader;
