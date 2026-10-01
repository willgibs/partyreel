"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ClaimAsk } from "@/components/shared/claim-ask";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

// Fires the anonymous-upload claim once on mount. Mounted on the (app) layout, the post-auth landing
// (loud: "We added your uploads to your account." whenever the claim carried uploads). The album page
// does not mount this: it claims through `useConfirmReturn`, which also decides what the album says
// about a claim (the follow moment for its own uploads, the toast only for other events'). The helper
// self-guards (logged-out / no stored tokens -> no-op) and self-dedupes across every call site, so a
// second mount is safe. `silent` suppresses the success toast.
//
// ★ THE PAGE BEHIND FOLLOWS THE CLAIM, AND THE CLAIM ASKS FOR IT (crumbs-40, build 35's red-team). The
// claim is a write landing after the server drew the page: on /dashboard the claims banner and Review's
// card went on offering a row it had just made hers, and her Guest card stayed missing, until a reload.
// The claims review used to listen for it, but the review lives in the page segment, which streams in
// behind `dashboard/loading.tsx` after this layout, so the claim usually landed before anyone listened (a
// soft navigation and a hard load after sign-in alike). This component mounts with the layout, before
// its own claim can land, so it refreshes the route itself once a claim it ran moved uploads, whatever
// page segment is there or still on its way: the server's next render is drawn after the claim. One
// refresh, never one a listener. Not once the layout has left, since the route on screen then was never
// drawn under it.
//
// ★ AND IT ASKS WHAT THE CLAIM WOULD NOT TAKE IN SILENCE (shared-claims): a ticket this phone holds
// that was typed under a name at odds with the account (`ClaimAsk`, which draws nothing until there is
// something to ask, and refreshes after its own yes). The album page mounts the same screen beside its
// own claim.
export function ClaimUploadsOnAuth({ silent = false }: { silent?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    void claimAnonymousUploads({ silent }).then((result) => {
      if (mounted && result && result.here + result.elsewhere > 0) {
        router.refresh();
      }
    });
    return () => {
      mounted = false;
    };
  }, [silent, router]);
  return <ClaimAsk />;
}
