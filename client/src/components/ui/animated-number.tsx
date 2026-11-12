import "number-flow";
import type NumberFlowElement from "number-flow";
import { createEffect } from "solid-js";

/** Animated number (NumberFlow web component). */
export function AnimatedNumber(props: {
  value: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  class?: string;
}) {
  let el!: NumberFlowElement;
  createEffect(() => {
    el.update(props.value);
  });
  createEffect(() => {
    el.locales = props.locale;
    el.format = props.format as NumberFlowElement["format"];
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = "number-flow" as any;
  return <Tag ref={el} class={props.class} />;
}
