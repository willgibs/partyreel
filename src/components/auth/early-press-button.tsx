"use client";

import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type RefObject,
} from "react";

import { Button } from "@/components/ui/button";
import { EARLY_PRESS_ATTR, takeEarlyPress } from "@/lib/early-press";

/**
 * Run the press a control missed, once, the moment it is hydrated. Put the ref on the control (which also
 * carries `data-early-press`): in the layout effect of the commit that hydrates it its handler is
 * attached, so `click()` answers through the very handler a tap would have.
 */
export function useReplayEarlyPress(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && takeEarlyPress(el)) el.click();
    // At mount only: the press it missed is the one before its handler existed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * A BUTTON WHOSE WHOLE ANSWER IS ITS HANDLER, that keeps the tap made before the page could hear it
 * (`early-press.ts`): Continue with Google starts its sign-in from the browser, so on a cold phone the
 * first tap, made a second before hydration, reached nothing and the second one went. The tap is
 * remembered by the auth layout's recorder and answered here, once, the moment the handler exists.
 */
export function EarlyPressButton(props: ComponentProps<typeof Button>) {
  const ref = useRef<HTMLButtonElement>(null);
  useReplayEarlyPress(ref);
  return <Button ref={ref} {...{ [EARLY_PRESS_ATTR]: "" }} {...props} />;
}
