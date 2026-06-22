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

/** POST the (possibly large) token to the Worker via a hidden form+iframe → native download, no nav. */
function postToWorker(workerUrl: string, token: string) {
  const iframe = document.createElement("iframe");
  iframe.name = `pr-export-${Date.now()}`;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = workerUrl;
  form.target = iframe.name;
  form.style.display = "none";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "t";
  input.value = token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
  // The download is handed to the browser's download manager once it starts, independent of the iframe;
  // clean up well after that.
  window.setTimeout(() => iframe.remove(), 60_000);
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
