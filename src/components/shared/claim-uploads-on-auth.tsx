"use client";

import { useEffect } from "react";

import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

// Fires the anonymous-upload claim once on mount, then renders nothing. Mounted on the (app) layout, the
// post-auth landing (loud: "We added your uploads to your account." whenever the claim carried uploads).
// The album page does not mount this: it claims through `useConfirmReturn`, which also decides what the
// album says about a claim (the follow moment for its own uploads, the toast only for other events'). The
// helper self-guards (logged-out / no stored tokens -> no-op) and self-dedupes across every call site, so
// a second mount is safe. `silent` suppresses the success toast.
export function ClaimUploadsOnAuth({ silent = false }: { silent?: boolean }) {
  useEffect(() => {
    void claimAnonymousUploads({ silent });
  }, [silent]);
  return null;
}
