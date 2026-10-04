"use client";

import { useCallback, useEffect } from "react";

import {
  createExportWalker,
  type ExportScope,
  type MintBody,
  type WalkStore,
} from "@/components/app/export/export-walk";
import { exportToasts } from "@/components/app/export/export-toast";
import type { ExportSummary } from "@/lib/export/build-manifest";
import {
  downloadPlaceFor,
  RETRY_PAUSE_MS,
  SUMMARY_TRIES_MS,
} from "@/lib/export/walk";
import { detectPlatform } from "@/lib/media/share-save";

// The client side of "Download all": fetch the menu's count/size SUMMARY, and start a download (the
// walk: mint, the Worker's check, then the file; `export-walk.ts`). The download itself never streams
// through the app — the mint route returns a signed token + the Worker URL, and we form-POST the
// token to the Worker at the top level; the Worker streams the zip and the browser's native download
// takes over. Mirrors the per-item Save's "bytes go straight from the edge to the browser".

export type { ExportScope };

/** What the menu is drawn from: the album's buckets, and (for a guest) her own, when she has any. */
export type ExportMenuSummary = {
  summary: ExportSummary;
  /** Yours (`export-flow` r1, `means=mine`): null when nothing here is hers. */
  yours: ExportSummary | null;
};

/**
 * POST the (possibly large) token to the Worker to start the zip download.
 *
 * Submits a TOP-LEVEL form (no target → the current frame). The Worker responds with
 * `Content-Disposition: attachment`, so the browser hands it to the download manager and does NOT
 * navigate the page away (standard attachment behavior). We deliberately do NOT use a hidden iframe:
 * Chrome BLOCKS downloads initiated through a cross-origin iframe, so the file silently never saves
 * (verified live, 2026-06-22). A same-frame navigation needs no user gesture (so it survives the awaited
 * mint) and is never download-blocked. The walk posts only after the Worker's own check has said it
 * will stream this token (or could not be asked), so a refusal never replaces the page.
 */
function postToWorker(workerUrl: string, token: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = workerUrl;
  form.style.display = "none";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "t";
  input.value = token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

let walks = 0;

/** The tab's own key for the walks it keeps between parts (`export-walk.ts`' reload note). */
export const WALKS_KEY = "pr-export-walks";

/**
 * THE WALKS A RELOAD FINDS, IN THE TAB'S OWN STORE: sessionStorage, which a reload keeps and a new
 * tab never sees. Every read and write may throw (a private window, a full or blocked store), and
 * then a walk is simply not offered after a reload, which is where it stood before.
 */
const tabWalks: WalkStore = {
  load() {
    try {
      const raw = window.sessionStorage.getItem(WALKS_KEY);
      return raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
      return null;
    }
  },
  save(kept) {
    try {
      if (kept.length === 0) window.sessionStorage.removeItem(WALKS_KEY);
      else window.sessionStorage.setItem(WALKS_KEY, JSON.stringify(kept));
    } catch {
      // Not kept: the walk goes on in this page, and a reload forgets it as it always did.
    }
  },
};

/** One engine for the page: a walk outlives the menu that started it, so it lives out here. */
const walker = createExportWalker({
  fetch: (input, init) => fetch(input, init),
  post: postToWorker,
  toast: exportToasts,
  place: () =>
    typeof navigator === "undefined"
      ? "desk"
      : downloadPlaceFor(detectPlatform(navigator)),
  // The browser's own word on its line (E6): "offline" is certain, while "online" says only that a network is
  // attached, so a dropped request is still what names a dropped connection.
  online: () => typeof navigator === "undefined" || navigator.onLine !== false,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  newId: () => `export-${++walks}`,
  store: tabWalks,
});

/** One summary try, with its own ceiling: a menu that hangs is a menu that says it could not add up. */
async function summaryTry(
  scope: ExportScope,
  body: MintBody,
  ceilingMs: number,
): Promise<ExportMenuSummary | "retry" | null> {
  const request = new AbortController();
  const timer = setTimeout(() => request.abort(), ceilingMs);
  try {
    const res = await fetch(`/api/export/${scope}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step: "summary", ...body }),
      signal: request.signal,
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      summary?: ExportSummary;
      yours?: ExportSummary | null;
    } | null;
    if (res.ok && data?.ok && data.summary) {
      return { summary: data.summary, yours: data.yours ?? null };
    }
    return res.status >= 500 ? "retry" : null;
  } catch {
    return "retry";
  } finally {
    clearTimeout(timer);
  }
}

export function useExportDownload() {
  const fetchSummary = useCallback(
    async (
      scope: ExportScope,
      body: MintBody,
    ): Promise<ExportMenuSummary | null> => {
      // The same quiet re-attempt a mint gets (`stuck=retry`), shorter: the menu is open and waiting.
      for (let i = 0; i < SUMMARY_TRIES_MS.length; i++) {
        if (i > 0)
          await new Promise((r) => setTimeout(r, RETRY_PAUSE_MS[i - 1]));
        const got = await summaryTry(scope, body, SUMMARY_TRIES_MS[i]);
        if (got !== "retry") return got;
      }
      return null;
    },
    [],
  );

  const startDownload = useCallback(
    (scope: ExportScope, body: MintBody): Promise<boolean> =>
      walker.start(scope, body),
    [],
  );

  // ★ A WALK A RELOAD LEFT BETWEEN PARTS IS OFFERED AGAIN by the first page that can start one (the
  // album's Download all, the hub's bulk bar, the size list), once per page life (`resume` keeps its
  // own guard). A tick late on purpose: the toaster subscribes in its own effect, which runs after
  // this one (it sits after the page in the root layout), and a toast shown before it is never heard.
  useEffect(() => {
    const timer = window.setTimeout(() => walker.resume(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { fetchSummary, startDownload };
}
