import { JSX, mergeProps } from "solid-js";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerColor =
  | "indigo"
  | "teal"
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "red"
  | "white"
  | "current";

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  class?: string;
  label?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "size-3 border-2",
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-3",
  xl: "size-12 border-4",
};

const colorClasses: Record<SpinnerColor, string> = {
  indigo: "border-indigo-600",
  teal: "border-teal-500",
  blue: "border-blue-600",
  emerald: "border-emerald-600",
  purple: "border-purple-600",
  amber: "border-amber-500",
  red: "border-red-600",
  white: "border-white",
  current: "border-current",
};

export function Spinner(rawProps: SpinnerProps): JSX.Element {
  const props = mergeProps(
    { size: "md" as SpinnerSize, color: "indigo" as SpinnerColor, label: "Loading..." },
    rawProps
  );

  const isHidden = () => props["aria-hidden"] === true || props["aria-hidden"] === "true";

  return (
    <div
      role={isHidden() ? undefined : "status"}
      aria-label={isHidden() ? undefined : props.label}
      aria-hidden={isHidden() ? "true" : undefined}
      class={`inline-block border-t-transparent rounded-xs animate-spin shrink-0 ${sizeClasses[props.size] || sizeClasses.md} ${colorClasses[props.color] || props.color} ${props.class || ""}`}
    >
      {!isHidden() && <span class="sr-only">{props.label}</span>}
    </div>
  );
}

export default Spinner;
