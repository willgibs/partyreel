"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";

import { DemoModal } from "./demo-modal";
import {
  closeDemoModal,
  hasHost,
  hostMounted,
  readDemoModal,
  subscribeDemoModal,
} from "./store";

/**
 * THE PAGE'S ONE DEMO MODAL, drawn from the store (`store.ts`), whichever
 * door asked for it. Focus goes back to that door on close, or, when the door
 * has left the page since (the nav's pane, whose panel closed under the
 * modal), to the fallback it named.
 */
export function DemoModalHost() {
  const state = useSyncExternalStore(
    subscribeDemoModal,
    readDemoModal,
    readDemoModal,
  );
  useEffect(() => hostMounted(), []);
  return (
    <DemoModal
      open={state.open}
      onOpenChange={(open) => {
        if (!open) closeDemoModal();
      }}
      href={state.href}
      onCloseAutoFocus={(e) => {
        const back = [state.opener, state.fallback].find(
          (el) => el?.isConnected,
        );
        if (!back) return;
        e.preventDefault();
        back.focus({ preventScroll: true });
      }}
    />
  );
}

let root: Root | null = null;

/**
 * ★ THE HOST MOUNTS ITSELF, ON THE FIRST PRESS, BESIDE THE APP RATHER THAN IN
 * IT. The marketing layouts are not this module's to edit, and every door on
 * a page may leave it (a panel closing, a section unmounting), so the one
 * thing that must outlive them all gets a root of its own on <body>, which is
 * where the dialog portals anyway. It needs nothing from the app's tree: the
 * card is paper by its own class, the Dialog brings its own context, and the
 * links are plain anchors. A `DemoModalHost` rendered in the tree (a layout
 * one day, a test today) is found first and this stands down.
 */
export function ensureDemoModalHost() {
  if (root || hasHost() || typeof document === "undefined") return;
  const el = document.createElement("div");
  el.setAttribute("data-demo-modal-host", "");
  document.body.appendChild(el);
  root = createRoot(el);
  root.render(<DemoModalHost />);
}
