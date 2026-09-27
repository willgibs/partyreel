"use client";

import type { ReactNode } from "react";
import {
  Ban,
  DoorClosed,
  EyeOff,
  Images,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { EVENT, RICK } from "./fixtures";
import { AccountPage, Face, HostHub, HostPage } from "./grounds";
import { type PhoneScene, Scenes } from "./scene";
import {
  BottomSheet,
  CentredDialog,
  FOCUSED,
  forSize,
  MenuRow,
  PageOnKeyboard,
  type Parts,
  SidePanel,
  type Size,
  UndoToast,
} from "./surfaces";

/**
 * CONFIRMATIONS: blocking Rick from the wedding (`event-safety`'s Block
 * question, moved here with its three options), removing three photos from
 * the host's album (`bulk-bar.tsx`), and deleting an account, whose password
 * field raises the keyboard (`account-delete-card.tsx`). Every string is
 * production's, or `event-safety`'s where Block is not built yet.
 *
 * ★ `undo` IS A RULE WITH TWO HALVES, drawn as both: what can come back (a
 * removal to Deleted, a block the host can lift) happens at once with Undo on
 * the toast; what cannot (an account) still asks, in a centred dialog.
 */

export type ConfirmOption = "dialog" | "sheet" | "undo" | "inline";
export type ConfirmScreen = "block" | "remove" | "account";

export const confirmAtOf = (v: string | undefined): ConfirmScreen =>
  v === "remove" || v === "account" ? v : "block";

const OPTION_TITLE: Record<ConfirmOption, string> = {
  dialog: "A centred dialog",
  sheet: "The one Sheet",
  undo: "Undo, wherever it can be undone",
  inline: "The button asks a second time",
};

const SCREEN_TITLE: Record<ConfirmScreen, string> = {
  block: "blocking Rick",
  remove: "removing three photos",
  account: "deleting an account, the password focused",
};

/* ── what each confirmation says ─────────────────────────────────────────── */

function Leaves({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icon}
      <span className="text-sm text-pretty">{children}</span>
    </li>
  );
}

/** event-safety's one-browser note, with the switch that closes the gap. */
function OneBrowserNote() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm text-pretty">
        <span className="font-medium">{`${RICK.name} typed a name, `}</span>
        <span className="text-muted-foreground">
          so this holds on the one browser they used. Under a new name, they
          could come back.
        </span>
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Require verified emails</p>
          <p className="text-xs text-pretty text-muted-foreground">
            Newcomers confirm an email first. Everyone who typed a name confirms
            one at their next photo.
          </p>
        </div>
        <Switch
          checked={false}
          tabIndex={-1}
          aria-label="Require verified emails"
        />
      </div>
    </div>
  );
}

const BLOCK: Parts = {
  title: `Block ${RICK.name}?`,
  description: `From ${EVENT.name}. Nothing happens until you press Block.`,
  body: (
    <div className="space-y-4">
      <ul className="flex flex-col gap-3">
        <Leaves icon={<DoorClosed />}>
          {`They can't open the album, add or like anything in ${EVENT.name}.`}
        </Leaves>
        <Leaves icon={<Images />}>
          {`Their ${RICK.uploads} uploads leave the album for Deleted, where you can restore any of them.`}
        </Leaves>
        <Leaves icon={<Users />}>
          They come off the guest list and every count.
        </Leaves>
        <Leaves icon={<EyeOff />}>
          They meet a closed album. Nothing tells them they were blocked.
        </Leaves>
      </ul>
      <OneBrowserNote />
    </div>
  ),
  act: { label: `Block ${RICK.name}`, tone: "destructive", icon: <Ban /> },
  cancel: "Cancel",
};

const REMOVE: Parts = {
  title: "Remove 3 items?",
  description:
    "They disappear from the album right away and move to Deleted, where you can restore them for 30 days. Guests won’t see them.",
  act: { label: "Remove", tone: "destructive" },
  cancel: "Cancel",
};

/** account-delete-card.tsx: Maya hosts two events and pays nothing. */
function AccountBody({ inPlace = false }: { inPlace?: boolean }) {
  return (
    <div className="space-y-4">
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-pretty text-muted-foreground">
        <li>
          Your 2 events are deleted, with everything guests uploaded to them.
        </li>
        <li>
          Photos you added to other people’s events stay in those albums,
          without your name or email. Ask the host if you want them removed.
        </li>
        <li>
          Your account cannot be restored, and this email can start over only as
          a brand new account.
        </li>
      </ul>
      <div className="space-y-2">
        <Label htmlFor={inPlace ? "pw-inline" : "pw"}>
          Enter your password to confirm
        </Label>
        <Input
          id={inPlace ? "pw-inline" : "pw"}
          type="password"
          defaultValue="correcthorse"
          readOnly
          tabIndex={-1}
          data-pop-field=""
          className={FOCUSED}
        />
      </div>
    </div>
  );
}

const ACCOUNT: Parts = {
  title: "Delete your account?",
  description: "This happens right away and cannot be undone.",
  body: <AccountBody />,
  act: { label: "Delete my account", tone: "destructive" },
  cancel: "Keep my account",
  typing: true,
  enter: "go",
};

const PARTS: Record<ConfirmScreen, Parts> = {
  block: BLOCK,
  remove: REMOVE,
  account: ACCOUNT,
};

/* ── the host's Guests room, where Block is pressed ──────────────────────── */

const ROOM = [
  { name: "Dom", seed: "pop-dom", second: "dom.aldana@gmail.com", photos: 12 },
  { name: "Jay", seed: "pop-jay", second: "jay.reyes@gmail.com", photos: 11 },
  { name: "Nina", second: "Typed a name", photos: 6 },
  { name: RICK.name, second: "Typed a name", photos: RICK.uploads },
  { name: "Ava B.", second: "Typed a name", photos: 3 },
  { name: "Ben C.", seed: "pop-ben", second: "ben.c@outlook.com", photos: 5 },
] as const;

/** event-safety's person menu, held open under Rick's row, its destructive
 *  act on its own footer rail, which `inline` grows into the question. */
function PersonMenu({ asking }: { asking: boolean }) {
  return (
    <div
      className={cn(
        "absolute top-full right-0 z-40 mt-1 w-72 p-1 text-sm",
        floatingPanel,
      )}
    >
      <div className="px-2.5 pt-1.5 pb-2">
        <p className="font-medium">{RICK.name}</p>
        <p className="text-xs text-muted-foreground">Typed a name · 7 photos</p>
      </div>
      <MenuRow icon={<Images />}>See their uploads</MenuRow>
      <div className="-mx-1 my-1 h-px bg-border" />
      {asking ? (
        <div data-pop-surface="inline" className="space-y-2 px-2 py-2">
          <p className="text-sm text-pretty">
            <span className="font-medium text-destructive">{`Block ${RICK.name}?`}</span>{" "}
            <span className="text-muted-foreground">
              {`They go out, and their ${RICK.uploads} uploads move to Deleted. Holds on the one browser used.`}
            </span>
          </p>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" tabIndex={-1}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              tabIndex={-1}
              data-pop-primary=""
            >
              <Ban /> Block
            </Button>
          </div>
        </div>
      ) : (
        <MenuRow icon={<Ban />} tone="destructive">
          Block from this event
        </MenuRow>
      )}
    </div>
  );
}

function GuestsRoom({
  size,
  menu,
  gone = false,
  overlay,
}: {
  size: Size;
  menu?: ReactNode;
  /** Rick is already out (an act done at once). */
  gone?: boolean;
  overlay?: ReactNode;
}) {
  const rows = gone ? ROOM.filter((r) => r.name !== RICK.name) : ROOM;
  return (
    <HostPage size={size} trail={[EVENT.name, "Guests"]} overlay={overlay}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <PageHeading>Guests</PageHeading>
          <p className="mt-1 text-sm text-muted-foreground">
            {`${EVENT.guests - (gone ? 1 : 0)} guests added photos. Only you see their addresses.`}
          </p>
        </div>
        <ul className="divide-y divide-border rounded-xl border">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-3 px-3 py-2.5">
              <Face
                name={r.name}
                seed={"seed" in r ? r.seed : undefined}
                size="default"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.second}
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{`${r.photos} photos`}</span>
              <span className="relative">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-action-sm",
                    r.name === RICK.name && menu !== undefined && "bg-muted",
                  )}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </span>
                {r.name === RICK.name && menu}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </HostPage>
  );
}

/* ── the four shapes ─────────────────────────────────────────────────────── */

function surfaceFor(
  parts: Parts,
  size: Size,
  option: "dialog" | "sheet",
  width: "sm" | "md",
) {
  const p = forSize(parts, size);
  if (option === "dialog") return <CentredDialog parts={p} width={width} />;
  return size === "desk" ? <SidePanel parts={p} /> : <BottomSheet parts={p} />;
}

function draw(
  option: ConfirmOption,
  screen: ConfirmScreen,
  size: Size,
): ReactNode {
  const parts = PARTS[screen];
  // `undo` answers only what can come back; an account asks as `dialog` does.
  const shape = option === "undo" && screen === "account" ? "dialog" : option;

  if (screen === "block") {
    if (shape === "inline")
      return <GuestsRoom size={size} menu={<PersonMenu asking />} />;
    if (shape === "undo")
      return (
        <GuestsRoom
          size={size}
          gone
          overlay={
            <UndoToast
              below={
                <p className="text-muted-foreground">
                  A new name could get back in.{" "}
                  <span className="font-medium text-foreground underline underline-offset-4">
                    Require verified emails
                  </span>
                </p>
              }
            >
              <span className="font-medium">{`${RICK.name} is out, on the browser they used.`}</span>{" "}
              <span className="text-muted-foreground">{`${RICK.uploads} uploads moved to Deleted.`}</span>
            </UndoToast>
          }
        />
      );
    return (
      <GuestsRoom size={size} overlay={surfaceFor(parts, size, shape, "md")} />
    );
  }

  if (screen === "remove") {
    if (shape === "inline")
      return (
        <HostHub
          size={size}
          select={{
            count: 3,
            del: {
              replace: (
                <span
                  data-pop-surface="inline"
                  className="flex items-center gap-1.5 rounded-[calc(var(--radius-action)*0.7)] bg-destructive/10 py-0.5 pr-0.5 pl-2"
                >
                  <span className="text-xs whitespace-nowrap text-destructive">
                    Remove 3?
                  </span>
                  <Button
                    variant="destructive"
                    size="xs"
                    tabIndex={-1}
                    data-pop-primary=""
                  >
                    <Trash2 /> Remove
                  </Button>
                </span>
              ),
            },
          }}
        />
      );
    if (shape === "undo")
      return (
        <HostHub
          size={size}
          gone={3}
          overlay={
            <UndoToast>
              <span className="font-medium">3 items moved to Deleted.</span>{" "}
              <span className="text-muted-foreground">
                Guests won’t see them.
              </span>
            </UndoToast>
          }
        />
      );
    return (
      <HostHub
        size={size}
        select={{ count: 3 }}
        overlay={surfaceFor(parts, size, shape, "sm")}
      />
    );
  }

  // The account: its password field is focused, so a phone's keyboard is up.
  if (shape === "inline") {
    const card = (
      <div data-pop-surface="inline" className="space-y-4">
        <div className="space-y-1">
          <p className="font-heading text-card-title font-medium text-destructive">
            Delete your account?
          </p>
          <p className="text-sm text-muted-foreground">
            This happens right away and cannot be undone.
          </p>
        </div>
        <AccountBody inPlace />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" tabIndex={-1}>
            Keep my account
          </Button>
          <Button variant="destructive" tabIndex={-1} data-pop-primary="">
            Delete my account
          </Button>
        </div>
      </div>
    );
    const page = (
      <AccountPage size={size} plan="free" danger={{ replace: card }} />
    );
    return size === "phone" ? (
      <PageOnKeyboard enter="go">{page}</PageOnKeyboard>
    ) : (
      page
    );
  }
  // An account cannot come back, so `undo` asks here exactly as `dialog` does.
  const asks = shape === "sheet" ? "sheet" : "dialog";
  return (
    <AccountPage
      size={size}
      plan="free"
      overlay={surfaceFor(parts, size, asks, "md")}
    />
  );
}

const PHONES: readonly ConfirmScreen[] = ["block", "remove", "account"];

export function ConfirmPreview({
  option,
  at,
}: {
  option: ConfirmOption;
  at: ConfirmScreen;
}) {
  const phones: PhoneScene[] = PHONES.map((screen) => ({
    title: SCREEN_TITLE[screen],
    node: draw(option, screen, "phone"),
  }));
  return (
    <Scenes
      id={`confirm-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, at, "desk")}
      laptopTitle={SCREEN_TITLE[at]}
      phones={phones}
    />
  );
}
