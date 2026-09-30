"use client";

import { useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { AtSign, Check, Mail } from "lucide-react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import { FollowButton } from "@/components/social/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/ui/client-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCount } from "@/lib/format/count";
import { otherEventsLine, toldNameLine } from "@/lib/guest/confirm-beat";
import { checkDisplayName } from "@/lib/guest/join";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

/**
 * THE MOMENT AFTER CONFIRMING, where the capture flow pays off: a guest who had no account now keeps
 * the event and their uploads in it, and can follow the host.
 *
 * The sequence a name-only guest walks is three beats and this is the third: they add photographs,
 * the door's last screen asks them to keep the photographs, and the second the address is confirmed
 * this card takes the album's post-upload slot and says what they now have. ★ IT IS ONE CARD AT A
 * TIME, never a stack under an album somebody came to look at: `claim-handle-prompt.tsx` owns the
 * slot and decides which card stands.
 *
 * ★ IT IS THE CONFIRMATION'S ONE BEAT (`guest-capture` r1, Will's `follow=card`: "needs to work
 * within any multi-claim handling"; `confirm-beat.ts`). Everything the confirmation has to say is
 * said here and nowhere else: what she keeps here, OTHER events (said once, in one line, never a
 * second toast), the name her photographs now carry (`name=told`, with a Change that changes it in
 * place), the host to follow, the handle.
 *
 * ★ THE OTHER EVENTS ARE ONE LINE THAT ACKNOWLEDGES AND NEVER LEADS OUT (`identity-claims` r3,
 * `pointer=line`: "Main goal after confirmation is still acting as an active, contributing guest at
 * that event"). Her uploads at other events alone finish the sentence about what she keeps, since
 * they are what she keeps too. Events waiting under her email are a row of their own, right under
 * what she keeps and above the host (the order his `line` tile drew, its carried `line-place`), with
 * the dashboard banner's envelope and no button or link: they are sorted on her dashboard, whenever
 * she likes, and the album stays the host's. When both are true the row says both
 * (`otherEventsLine`), so the card never says "other events" twice.
 *
 * ★ THE HOST IS THE ONE FOLLOW WORTH OFFERING HERE, in the card's own row, as shipped. The other
 * guests are already on this page, in the Guests list, where a signed-in viewer's chips carry their
 * own Follow (`social/guest-list.tsx`): a second copy of those names inside this card would be the
 * same list twice on one screen. His note ("Follow doesn't have to be pushed as hard as a feature
 * relative to uploads/verifications") is the card's ORDER and its Follow's WEIGHT: what she keeps and
 * who she is now lead, the host's row follows them with the quieter Follow (`FollowButton`'s `quiet`,
 * the one a claimed event's row in the claims review wears too), and the handle comes last.
 *
 * ★ NOTHING HERE IS SHOWN WITHOUT ITS OBJECT. No host card resolved means no host row (a locked or
 * hostless event, or a host with no public page); a profile that already has a handle means no
 * handle line; no name typed here means no told line. A card with nothing to say beyond its heading
 * does not render at all, which is the caller's check, not a stub.
 */

export type FollowMomentHost = {
  id: string;
  slug: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** seedFor(host id), so the host wears the colour they wear everywhere else. */
  seed?: string | null;
};

export function FollowMomentCard({
  host,
  needsHandle,
  count,
  elsewhere = 0,
  waiting = 0,
  toldName = null,
  onRenamed,
}: {
  /** The event's host as a public card, or null (nothing to follow). */
  host: FollowMomentHost | null;
  /** This account has no handle yet: the second line earns its place. */
  needsHandle: boolean;
  /**
   * Photographs this guest added in this session (the sentence's number), or
   * null when they added none this visit: a guest back from Google or a magic
   * link is holding photos from before the redirect, and the card will not
   * invent a number for them.
   */
  count: number | null;
  /** The same claim's rows at other events: said once, as a line. */
  elsewhere?: number;
  /**
   * Other events with photos waiting under her confirmed email in her dashboard's claims review,
   * never this album (the server's count, `confirm-beat-action.ts`): said in the same one line.
   */
  waiting?: number;
  /** The name her photographs carry now, when she typed one here; null tells none. */
  toldName?: string | null;
  /** The told name was changed here. */
  onRenamed?: (displayName: string) => void;
}) {
  const hostName = host?.displayName?.trim() || null;
  const canFollowHost = Boolean(host?.slug && hostName);
  const others = otherEventsLine({ elsewhere, waiting });
  // Waiting events stand as their own row; her uploads elsewhere alone finish the keep's sentence.
  const othersRow = others !== null && waiting > 0;
  if (!canFollowHost && !needsHandle && !toldName && !others) {
    return null;
  }

  return (
    <div
      data-media-tile
      data-follow-moment
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-subsection">
            {count === 1 ? "Your photo is safe" : "Your photos are safe"}
          </p>
          {/* ★ "In your account", never "on your profile": the claim puts the
              photographs in the account and the event comes with them (a Guest
              card on the dashboard), while a profile shows nothing until its
              owner chooses it (profiles-social.md), so a profile line here
              would be false. */}
          <p className="mt-0.5 text-reading text-pretty text-muted-foreground">
            {count === 1
              ? "It is in your account now, and this event came with it."
              : count === null
                ? "They are in your account now, and this event came with them."
                : `All ${formatCount(count)} are in your account now, and this event came with them.`}
            {others && !othersRow && ` ${others}`}
          </p>
          {toldName && (
            <ToldName
              key={toldName}
              name={toldName}
              onRenamed={(renamed) => onRenamed?.(renamed)}
            />
          )}
        </div>
      </div>

      {othersRow && (
        <p
          data-follow-moment-others
          className="flex items-start gap-2.5 border-t border-border/60 pt-4 text-reading text-pretty text-muted-foreground"
        >
          <Mail
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          {others}
        </p>
      )}

      {canFollowHost && host?.slug && hostName && (
        <div
          data-follow-moment-host
          className="flex items-center justify-between gap-3 border-t border-border/60 pt-4"
        >
          <Link
            href={`/u/${host.slug}`}
            className="flex min-w-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Avatar seed={host.seed ?? undefined} size="sm">
              <AvatarImage src={host.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>
                {hostName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-reading font-medium">
                {hostName}
              </span>
              <span className="block text-working text-muted-foreground">
                Your host
              </span>
            </span>
          </Link>
          <FollowButton
            profileId={host.id}
            slug={host.slug}
            initialFollowing={false}
            quiet
          />
        </div>
      )}

      {needsHandle && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground">
            <AtSign
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            Claim a handle and your name becomes a page.
          </p>
          {/* The door is the page's own setup (profile-setup's wizard, where the handle is
              claimed last, at Finish): the offer and the act that answers it are one. An
              account that already has a page is sent on to its choices by the setup itself. */}
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={PROFILE_SETUP_PATH}>Claim</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * THE NAME, TOLD, AND CHANGED WHERE IT IS SAID (`name=told`; Will: "Rather than 'Change it in
 * Account', we could likely have a simple 'Change' link to actually do so. This is better UX.").
 *
 * ★ THE LIGHTEST SURFACE THAT WORKS WITH THE KEYBOARD UP: the line itself becomes the field, in the
 * page's own flow (a phone scrolls a focused field above its keyboard by itself; a popover would be
 * covered by it, and a sheet is a second thing to dismiss). Focus moves inside the Change tap, so
 * iOS raises the keyboard for it, and nowhere else. It writes through the one display-name action
 * (profanity-checked, the account's own row), refused in place like every other name field.
 */
function ToldName({
  name,
  onRenamed,
}: {
  name: string;
  onRenamed: (displayName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function openEditor() {
    flushSync(() => {
      setValue(name);
      setRefusal(null);
      setEditing(true);
    });
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  function save() {
    const checked = checkDisplayName(value);
    if (!checked.ok) {
      setRefusal(checked.refusal.message);
      return;
    }
    if (checked.name === name) {
      setEditing(false);
      return;
    }
    startSave(async () => {
      const result = await updateDisplayNameAction(checked.name);
      if (!result.ok) {
        setRefusal(result.message ?? "That name isn't available.");
        return;
      }
      setEditing(false);
      onRenamed(checked.name);
    });
  }

  if (!editing) {
    return (
      <p
        data-told-name
        className="mt-2 text-reading text-pretty text-muted-foreground"
      >
        {toldNameLine(name)}{" "}
        <button
          type="button"
          onClick={openEditor}
          className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Change
        </button>
      </p>
    );
  }

  return (
    <ClientForm
      data-told-name-edit
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mt-2 flex flex-col gap-1.5"
    >
      <Label htmlFor="pr-told-name" className="sr-only">
        Your name
      </Label>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id="pr-told-name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (refusal) setRefusal(null);
          }}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="done"
          aria-invalid={refusal ? true : undefined}
          aria-describedby={refusal ? "pr-told-name-hint" : undefined}
          // 16px, so iOS does not zoom the page into the field.
          className="h-9 min-w-0 flex-1 text-base"
        />
        <Button type="submit" size="lg" disabled={saving || !value.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
      {refusal && (
        <p id="pr-told-name-hint" className="text-reading text-destructive">
          {refusal}
        </p>
      )}
    </ClientForm>
  );
}
