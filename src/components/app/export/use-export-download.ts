"use client";

import { useCallback } from "react";

import { toast } from "sonner";

import type { ExportSummary } from "@/lib/export/build-manifest";

// The client side of "Download all": fetch the modal's count/size SUMMARY, and MINT-then-trigger the
// actual download. The download itself never streams through the app — the mint route returns a signed
// token + the Worker URL, and we form-POST the token to the Worker (into a hidden iframe so an error
// response doesn't navigate the page away); the Worker streams the zip and the browser's native download
// dialog takes over. Mirrors the per-item Save's "bytes go straight from the edge to the browser".

export type ExportScope = "host" | "guest";

/**
 * POST the (possibly large) token to the Worker to start the zip download.
 *
 * Submits a TOP-LEVEL form (no target → the current frame). The Worker responds with
 * `Content-Disposition: attachment`, so the browser hands it to the download manager and does NOT
 * navigate the page away (standard attachment behavior). We deliberately do NOT use a hidden iframe:
 * Chrome BLOCKS downloads initiated through a cross-origin iframe, so the file silently never saves
 * (verified live, 2026-06-22). A same-frame navigation needs no user gesture (so it survives the awaited
 * mint) and is never download-blocked. The happy path is always a 200 attachment (the token is freshly
 * minted + valid; the mint refuses to issue one when downloads are paused), so the page never unloads.
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

type MintBody = Record<string, unknown>;

export function useExportDownload() {
  const fetchSummary = useCallback(
    async (scope: ExportScope, body: MintBody): Promise<ExportSummary | null> => {
      try {
        const res = await fetch(`/api/export/${scope}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ step: "summary", ...body }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          summary?: ExportSummary;
        } | null;
        if (!res.ok || !data?.ok || !data.summary) return null;
        return data.summary;
      } catch {
        return null;
      }
    },
    [],
  );

  const startDownload = useCallback(
    async (scope: ExportScope, body: MintBody): Promise<boolean> => {
      const id = toast.loading("Preparing your download…");
      try {
        const res = await fetch(`/api/export/${scope}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ step: "mint", ...body }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          token?: string;
          workerUrl?: string;
          message?: string;
        } | null;
        if (!res.ok || !data?.ok || !data.token || !data.workerUrl) {
          toast.error(data?.message ?? "Couldn't start that download.", { id });
          return false;
        }
        postToWorker(data.workerUrl, data.token);
        toast.success("Your download is starting.", { id });
        return true;
      } catch {
        toast.error("Couldn't start that download.", { id });
        return false;
      }
    },
    [],
  );

  return { fetchSummary, startDownload };
}
