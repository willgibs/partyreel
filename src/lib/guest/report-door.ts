"use client";

import { useSyncExternalStore } from "react";

/**
 * ONE CHANNEL BETWEEN A PHOTO'S REPORT AND THE ALBUM'S REPORT FORM (admin-triage r2: "A photo can be reported").
 *
 * The viewer's capsule sits four components deep in the lightbox the album opens, and the report form is the
 * album page's own, at its foot. The same problem `name-door.ts` solves between the header and the page, solved
 * the same way: a module singleton, shared across the client bundle, is the one place both can meet without the
 * lightbox growing a prop through every surface that mounts it.
 *
 * ★ IT CARRIES A REQUEST, NEVER STATE. The capsule asks for the form with its photograph named; the form (the
 * one thing that subscribes, `report-dialog.tsx`) owns everything after that. And a capsule on a surface with no
 * form listening (the host's own album, the dashboard's feeds) draws no Report at all: `useReportDoorOpen`
 * answers whether anyone is listening, so the control never promises a form nothing will open.
 */

export type PhotoReportRequest = {
  mediaId: string;
  type: "photo" | "video";
  /** A small picture of it for the form's "This photo" row, when the viewer has one. */
  previewUrl: string | null;
};

type Listener = (request: PhotoReportRequest) => void;

const listeners = new Set<Listener>();
const watchers = new Set<() => void>();

function changed() {
  for (const watch of watchers) watch();
}

/** The capsule's Report asks; the album's form answers. */
export function requestPhotoReport(request: PhotoReportRequest) {
  for (const listener of listeners) listener(request);
}

/** Subscribe (the album's report form). Returns the unsubscribe, for an effect's cleanup. */
export function onPhotoReportRequest(listener: Listener): () => void {
  listeners.add(listener);
  changed();
  return () => {
    listeners.delete(listener);
    changed();
  };
}

function subscribe(watch: () => void) {
  watchers.add(watch);
  return () => {
    watchers.delete(watch);
  };
}

const listening = () => listeners.size > 0;
const nobody = () => false;

/** Whether a report form is listening on this page (the server's render always says no). */
export function useReportDoorOpen(): boolean {
  return useSyncExternalStore(subscribe, listening, nobody);
}
