import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/utils";

type DivProps = JSX.HTMLAttributes<HTMLDivElement>;

function make(base: string) {
  return (props: DivProps) => {
    const [local, rest] = splitProps(props, ["class"]);
    return <div class={cn(base, local.class)} {...rest} />;
  };
}

export const Card = make("rounded-xl border border-border bg-card text-card-foreground shadow-xs");
export const CardHeader = make("flex flex-col gap-1.5 p-5");
export const CardTitle = make("font-semibold leading-none tracking-tight");
export const CardDescription = make("text-sm text-muted-foreground");
export const CardContent = make("p-5 pt-0");
export const CardFooter = make("flex items-center p-5 pt-0");
