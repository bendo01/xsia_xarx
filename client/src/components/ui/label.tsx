import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/utils";

export function Label(props: JSX.LabelHTMLAttributes<HTMLLabelElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <label class={cn("text-sm font-medium leading-none", local.class)} {...rest} />;
}
