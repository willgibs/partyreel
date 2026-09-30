"use client";

import { useEffect } from "react";

import { ClaimAsk } from "@/components/shared/claim-ask";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

// Fires the anonymous-upload claim once on mount. Mounted on the (app) layout, the post-auth landing
// (loud: "We added your uploads to your account." whenever the claim carried uploads). The album page
// does not mount this: it claims through `useConfirmReturn`, which also decides what the album says
// about a claim (the follow moment for its own uploads, the toast only for other events'). The helper
// self-guards (logged-out / no stored tokens -> no-op) and self-dedupes across every call site, so a
// second mount is safe. `silent` suppresses the success toast.
//
// ★ AND IT ASKS WHAT THE CLAIM WOULD NOT TAKE IN SILENCE (shared-claims): a ticket this phone holds
// that was typed under a name at odds with the account (`ClaimAsk`, which draws nothing until there is
// something to ask). The album page mounts the same screen beside its own claim.
export function ClaimUploadsOnAuth({ silent = false }: { silent?: boolean }) {
  useEffect(() => {
    void claimAnonymousUploads({ silent });
  }, [silent]);
  return <ClaimAsk />;
}
