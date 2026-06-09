"use client";

import { useEffect } from "react";

import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

// Fires the anonymous-upload claim once on mount, then renders nothing. Mounted on post-auth landing
// surfaces: the (app) layout (loud — the account context) and the guest EventExperience (silent). The
// helper self-guards (logged-out / no stored tokens -> no-op) and self-dedupes across every call site, so
// mounting it in more than one place is safe. `silent` suppresses the success toast (the guest /e/ paths,
// where it would otherwise stack with the "Saved" toast).
export function ClaimUploadsOnAuth({ silent = false }: { silent?: boolean }) {
  useEffect(() => {
    void claimAnonymousUploads({ silent });
  }, [silent]);
  return null;
}
