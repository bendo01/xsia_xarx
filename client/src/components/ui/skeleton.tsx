import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/utils";

export function Skeleton(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div class={cn("animate-pulse rounded-md bg-muted", local.class)} {...rest} />;
}
