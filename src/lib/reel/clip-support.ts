"use client";

/**
 * CAN THIS BROWSER MAKE A CLIP? Asked of the device, once per page, before anything is offered as
 * if it could (`noencode=greyed`: without an encoder, Make your own stays in its slot, greyed, and a
 * tap explains; nothing is written over the reel).
 *
 * ★ TWO STEPS, CHEAPEST FIRST. A browser with no WebCodecs at all (`VideoEncoder` undefined) is
 * answered at once, with nothing downloaded. Only a browser that has it pays for the real probe
 * (mediabunny's `canEncodeVideo` at the clip's own dimensions, `engine/support.ts`), which arrives
 * as its own chunk so the reel's view never carries the encoder for a viewer who never asks.
 *
 * The answer is the device's, never a guess from the user agent: iPhone Safari and desktop Chrome
 * both encode, and an old or locked-down browser that cannot is told so on a tap.
 */
import { useEffect, useState } from "react";

export type ClipSupport = "checking" | "yes" | "no";

let asked: Promise<boolean> | null = null;

/** Whether this device can encode a clip. One probe per page, shared by every caller. */
export function probeClipSupport(): Promise<boolean> {
  asked ??= (async () => {
    if (typeof window === "undefined" || typeof VideoEncoder === "undefined") {
      return false;
    }
    try {
      const { probeEngineSupport } = await import("@/lib/reel/engine/support");
      return (await probeEngineSupport("portrait")).canEncode;
    } catch {
      return false;
    }
  })();
  return asked;
}

/** The probe's answer for a component: "checking" until it lands, and nothing asked while off. */
export function useClipSupport(enabled: boolean): ClipSupport {
  const [answer, setAnswer] = useState<ClipSupport>("checking");
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void probeClipSupport().then((ok) => {
      if (alive) setAnswer(ok ? "yes" : "no");
    });
    return () => {
      alive = false;
    };
  }, [enabled]);
  return answer;
}
