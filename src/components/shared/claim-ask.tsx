"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { layerIsUp } from "@/components/ui/layer-is-up";
import {
  Popup,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { showErrorToast } from "@/lib/errors/toast";
import { lastClaimPlayedMoment } from "@/lib/guest/confirm-beat";
import {
  claimAskWords,
  currentClaimAsks,
  rememberNotMine,
  settleClaimAsk,
  subscribeClaimAsks,
  type ClaimAsk as Ask,
} from "@/lib/guest/claim-ask";
import { CLAIMED_TOAST, claimAskedUploads } from "@/lib/guest/claim-uploads";

const NONE: readonly Ask[] = [];

/**
 * This screen's own question, which is never "another layer" (`layerIsUp`, `ui/layer-is-up.ts`: the door and
 * its held sheets, a confirm, a panel, a menu, a listbox): `PopupContent` below wears the mark.
 */
const OWN_LAYER = "[data-claim-ask]";

/**
 * "3 PHOTOS WERE ADDED ON THIS PHONE AS DANA. ARE THEY YOURS?" (shared-claims).
 *
 * The one screen that asks what a shared phone's claim would not take in silence: tickets typed under
 * a name at odds with the account that just signed in (`claim-ask.ts` holds the queue, the memory and
 * the words; `claim-uploads.ts` fills the queue after every claim). Mounted wherever a claim runs, the
 * (app) layout and the album page, and drawing nothing until there is something to ask.
 *
 *   - ★ IT WAITS FOR A CALM MOMENT: never over the door, a sheet or a menu the person is still
 *     answering (a sign-in lands on a door as often as not); it asks once none is up, and stays up
 *     whatever opens over it afterwards.
 *   - ONE QUESTION A NAME, one at a time, as the popups' `confirm` kind (a dialog that asks one thing
 *     and waits, the safe answer first).
 *   - "Not mine" is remembered for that account on those albums and moves nothing: the photos stay
 *     the phone's, for whoever typed them. "They're mine" claims exactly those tickets (never one
 *     that names another address: the server refuses it whatever the answer), says it once, and
 *     refreshes the page behind, whose credits and cards follow. ★ On the album whose own photos it
 *     carried, the follow moment says it (crumbs-24: her yes is a confirmation of those very photos,
 *     `use-confirm-return.ts`); anywhere else, the claim's own words.
 *   - Closed without an answer, it is put away for this visit and asked again on a later one: an
 *     unanswered question is never read as either answer.
 */
export function ClaimAsk() {
  const router = useRouter();
  const asks = useSyncExternalStore(
    subscribeClaimAsks,
    currentClaimAsks,
    () => NONE,
  );
  // The question on screen, kept while it leaves so its words do not blank mid-exit.
  const [shown, setShown] = useState<Ask | null>(null);
  const [pending, startTransition] = useTransition();
  const open = shown !== null && asks.includes(shown);
  const next = open ? null : (asks[0] ?? null);

  useEffect(() => {
    if (!next) return;
    const ask = () => {
      if (!layerIsUp({ except: OWN_LAYER })) setShown(next);
    };
    // A beat first, so a door opening in the same breath as the claim is seen before this asks.
    const first = window.setTimeout(ask, 0);
    const watch = new MutationObserver(ask);
    watch.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role"],
    });
    return () => {
      window.clearTimeout(first);
      watch.disconnect();
    };
  }, [next]);

  const words = shown ? claimAskWords(shown) : null;

  function notMine() {
    if (!shown || pending) return;
    rememberNotMine(shown);
    settleClaimAsk(shown);
  }

  function mine() {
    if (!shown || pending) return;
    const asked = shown;
    startTransition(async () => {
      const moved = await claimAskedUploads(asked);
      settleClaimAsk(asked);
      if (moved === null) {
        showErrorToast(
          "failed",
          "Those photos couldn't be added to your account. We'll ask again next time.",
        );
        return;
      }
      // Heard inside the claim by the album's own listener: the moment's card says it, other events too.
      const momentSaysIt =
        moved.album !== null && lastClaimPlayedMoment(moved.album);
      if (!momentSaysIt && moved.here + moved.elsewhere > 0) {
        toast.success(CLAIMED_TOAST);
      }
      router.refresh();
    });
  }

  return (
    <Popup
      open={open}
      onOpenChange={(isOpen) => {
        // Put away unanswered: this visit only, never remembered.
        if (!isOpen && shown && !pending) settleClaimAsk(shown);
      }}
    >
      <PopupContent kind="confirm" size="sm" data-claim-ask="">
        {words && (
          <>
            <PopupHeader title={words.title} description={words.question} />
            <PopupFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={notMine}
              >
                {words.notMine}
              </Button>
              <Button type="button" disabled={pending} onClick={mine}>
                {words.mine}
              </Button>
            </PopupFooter>
          </>
        )}
      </PopupContent>
    </Popup>
  );
}
