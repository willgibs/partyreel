"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import {
  ShieldOff,
  UserCheck,
  UserPlus,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  blockProfileAction,
  followProfileAction,
  unblockProfileAction,
  unfollowProfileAction,
  type ProfileActionResult,
} from "@/app/(guest)/u/[slug]/actions";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { cn } from "@/lib/utils";

/**
 * ONE CONTROL FOR A RELATION, ONE CONTRACT (crumbs-44; the `profile-page` board's finding: "three
 * hand-rolled toggles do one job"). Following someone and blocking someone are the two relations a
 * person keeps with another, and three controls flipped them with three sets of manners: the
 * profile's Follow flipped at once and refreshed the page by hand, the menu's Block waited and
 * toasted its success, and the Connections card's Unfollow and Unblock spelled "…ing" and toasted
 * theirs, each through its own pair of Server Functions. Now every face of a relation runs
 * `useRelation`, and the contract is this, in one place:
 *
 *   - a press flips the control at once (`useOptimistic`), and a flip in flight takes no second press;
 *   - ★ turning a block ON asks first (`BlockConfirm`, the one copy of what a block does); every
 *     other flip acts at once, since each is undone by one more press;
 *   - a refused flip springs back and says the server's words in one toast; a landed flip says
 *     nothing, because the control already shows it;
 *   - ★ A FLIP THAT LANDED STAYS THE CONTROL'S OWN. The optimistic value lasts only while its
 *     Server Function runs, so the settled answer becomes this control's own once a flip lands, or a
 *     Follow on a page that never re-reads it (the moment card, a claimed event's row) sprang back to
 *     "Follow" as its action ended; a changed answer from the server still wins;
 *   - ★ NOTHING CALLS `router.refresh()`. The four Server Functions revalidate every page a relation
 *     shapes (each profile, Account's Connections), and Next renders the page the control sits on
 *     into the Server Function's own response, so what a page derives from a relation (a block hides
 *     Follow, a Connections row leaves its list) follows in the same round trip. The hand-called
 *     refresh rendered that page a second time.
 *
 * The faces: `RelationToggle` is the button (the profile's Follow, the quieter Follow beside an
 * album, the Connections card's rows), and the profile menu's Block row (`ProfileActionsMenu`) runs
 * the same hook and renders its ask, since a menu row cannot hold a dialog that outlives its menu.
 */

export type Relation = "follow" | "block";

/** What a flip may answer: the four Server Functions' result. */
export type RelationResult = ProfileActionResult;

/** Writes one relation, ON or OFF. The real ones are the Server Functions; the Library hands its own. */
export type RelationAct = (on: boolean) => Promise<RelationResult>;

/**
 * The Server Function per relation and direction. Read inside the arrow, never at module scope: a
 * test that mocks the actions module with the follow pair alone must still load this file.
 */
const SERVER: Record<
  Relation,
  (profileId: string, on: boolean) => Promise<RelationResult>
> = {
  follow: (profileId, on) =>
    on ? followProfileAction(profileId) : unfollowProfileAction(profileId),
  block: (profileId, on) =>
    on ? blockProfileAction(profileId) : unblockProfileAction(profileId),
};

/**
 * THE WORDS AND GLYPHS, per relation and state. Follow names the state it is in once on ("Following",
 * a toggle that reads as pressed); Block names the act in both states ("Block", "Unblock"), because a
 * row that read "Blocked" would ask a person to press the word for what they did to undo it.
 */
export const RELATION_FACE: Record<
  Relation,
  Record<"off" | "on", { label: string; icon: LucideIcon }>
> = {
  follow: {
    off: { label: "Follow", icon: UserPlus },
    on: { label: "Following", icon: UserCheck },
  },
  block: {
    off: { label: "Block", icon: UserRoundX },
    on: { label: "Unblock", icon: ShieldOff },
  },
};

export type RelationState = {
  /** The relation as the control shows it: the optimistic flip while one runs, else the settled answer. */
  on: boolean;
  /** A flip is in flight (the control takes no second press until it lands). */
  pending: boolean;
  /** The one press: flips, or for a block being turned ON, opens its ask. */
  press: () => void;
  /** The ask for a block, bound to this relation: render it where it outlives a menu. Null for a follow. */
  ask: ReactNode;
};

/** THE CONTRACT (the module's header says each clause's reason). */
export function useRelation({
  relation,
  profileId,
  on: serverOn,
  person,
  act,
}: {
  relation: Relation;
  profileId: string;
  /** The server's answer: whether I follow, or block, this person now. */
  on: boolean;
  /** Their name, for the ask ("Block Maya?"). */
  person?: string | null;
  /** The write; the Server Functions unless a caller (the Library) hands its own. */
  act?: RelationAct;
}): RelationState {
  const [pending, startTransition] = useTransition();
  const [settled, setSettled] = useState(serverOn);
  const [serverSaid, setServerSaid] = useState(serverOn);
  if (serverOn !== serverSaid) {
    setServerSaid(serverOn);
    setSettled(serverOn);
  }
  const [shown, setShown] = useOptimistic(settled);
  const [asking, setAsking] = useState(false);

  function flip(next: boolean) {
    startTransition(async () => {
      setShown(next);
      const result = await (act
        ? act(next)
        : SERVER[relation](profileId, next));
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSettled(next);
    });
  }

  function press() {
    if (pending) return;
    const next = !shown;
    if (relation === "block" && next) {
      setAsking(true);
      return;
    }
    flip(next);
  }

  return {
    on: shown,
    pending,
    press,
    ask:
      relation === "block" ? (
        <BlockConfirm
          open={asking}
          onOpenChange={setAsking}
          person={person}
          onConfirm={() => {
            setAsking(false);
            flip(true);
          }}
        />
      ) : null,
  };
}

/**
 * THE ASK BEFORE A BLOCK, the one copy of what a block does (profiles-social.md: blocking is mutual
 * severance, private, and it prevents a re-follow). A confirmation, so the centred dialog that asks
 * before it acts (`popups` r1); Block is its one destructive word.
 */
export function BlockConfirm({
  open,
  onOpenChange,
  person,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: string | null;
  onConfirm: () => void;
}) {
  return (
    <Popup open={open} onOpenChange={onOpenChange}>
      <PopupContent kind="confirm">
        <PopupHeader
          title={`Block ${person ?? "this person"}?`}
          description={
            <>
              You&rsquo;ll stop following each other, and neither of you can
              follow the other again while the block is on. They won&rsquo;t be
              notified, and they can&rsquo;t see that you blocked them. You can
              undo this anytime from your account settings.
            </>
          }
        />
        <PopupFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Block
          </Button>
        </PopupFooter>
      </PopupContent>
    </Popup>
  );
}

/**
 * THE BUTTON FACE of a relation: the profile's Follow (filled until it is on), the quieter Follow
 * beside an album's own actions (`quiet`, a small ghost in the muted ink), and the Connections card's
 * rows (`size="sm"`). Follow is a toggle (`aria-pressed`, its label the state); Block is an act whose
 * label says which, so it carries no pressed state.
 */
export function RelationToggle({
  relation,
  profileId,
  on,
  person,
  label,
  quiet = false,
  size,
  act,
}: {
  relation: Relation;
  profileId: string;
  on: boolean;
  /** Their name, for a block's ask. */
  person?: string | null;
  /** Whom the button names, where nothing beside it does ("Follow Tom"). */
  label?: string;
  quiet?: boolean;
  /** The button's size; the quiet one defaults to `sm`, the rest to the default. */
  size?: "xs" | "sm" | "default";
  act?: RelationAct;
}) {
  const state = useRelation({ relation, profileId, on, person, act });
  const face = RELATION_FACE[relation][state.on ? "on" : "off"];
  const Icon = face.icon;
  const variant = quiet
    ? "ghost"
    : relation === "follow"
      ? state.on
        ? "outline"
        : "default"
      : state.on
        ? "outline"
        : "destructive";

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size ?? (quiet ? "sm" : "default")}
        onClick={state.press}
        aria-pressed={relation === "follow" ? state.on : undefined}
        aria-busy={state.pending || undefined}
        data-relation={relation}
        data-on={state.on}
        className={cn(quiet && "text-muted-foreground")}
      >
        <Icon />
        {label ? `${face.label} ${label}` : face.label}
      </Button>
      {state.ask}
    </>
  );
}
