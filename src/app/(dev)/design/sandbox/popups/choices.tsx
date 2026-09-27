"use client";

import type { ReactNode } from "react";
import { Camera, Check, Download, Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HOST, QR_STYLES } from "./fixtures";
import { GuestAlbum, HostHub } from "./grounds";
import { kitParts, StyleGrid, StylePreview } from "./kit";
import { type PhoneScene, Scenes } from "./scene";
import {
  ActionRow,
  ActionSheet,
  AnchoredMenu,
  BottomSheet,
  CentredDialog,
  MenuRow,
  type Parts,
  SidePanel,
  type Size,
} from "./surfaces";

/**
 * QUICK CHOICES: how Priya adds photos (`intent-sheet.tsx`, two doors on the
 * Sheet), what to download (`export-dialog.tsx`, three chips in a dialog), and
 * the code's style (`qr-designer-dialog.tsx`, four styles in a dialog, opened
 * from Customize inside the host's kit). Nothing is typed in any of them.
 *
 * ★ A MENU'S ROW IS THE ACT. In the `menu` shape there is no Save and no
 * Download button under the choices: pressing Take a photo takes one, pressing
 * Photos downloads the photos, pressing Rounded saves Rounded, which is what
 * makes a menu lighter than a dialog and is its whole cost too (no second look
 * before it acts).
 */

export type ChoiceOption = "sheet" | "dialog" | "menu" | "inline";
export type ChoiceScreen = "add" | "download" | "style";

export const pickAtOf = (v: string | undefined): ChoiceScreen =>
  v === "download" || v === "style" ? v : "add";

const OPTION_TITLE: Record<ChoiceOption, string> = {
  sheet: "The one Sheet",
  dialog: "A small centred dialog",
  menu: "A menu at the button, rows at the foot",
  inline: "In place",
};

const SCREEN_TITLE: Record<ChoiceScreen, string> = {
  add: "Priya adds photos",
  download: "downloading the album",
  style: "the code's style, from Customize",
};

const TERMS = "Photos and videos, up to 10 GB each.";
const SETS = [
  { id: "all", label: "Everything", n: "640" },
  { id: "photos", label: "Photos", n: "612" },
  { id: "videos", label: "Videos", n: "28" },
] as const;

/* ── each choice, written once ───────────────────────────────────────────── */

function AddDoors() {
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="cta"
        className="w-full justify-start"
        tabIndex={-1}
        data-pop-primary=""
      >
        <Camera /> Take a photo
      </Button>
      <Button
        variant="outline"
        size="cta"
        className="w-full justify-start"
        tabIndex={-1}
      >
        <Images /> Choose from your album
      </Button>
      <p className="pt-1 text-center text-reading text-muted-foreground">
        {TERMS}
      </p>
    </div>
  );
}

/** `export-dialog.tsx`'s chips, the size and the one act. */
function DownloadBody({ act = false }: { act?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SETS.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm",
              i === 0
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {s.label}
            <span
              className={
                i === 0 ? "text-background/70" : "text-muted-foreground"
              }
            >
              {s.n}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-heading text-subsection tabular-nums">18.4 GB</p>
          <p className="text-xs text-muted-foreground">640 items</p>
        </div>
        {act && (
          <Button tabIndex={-1} data-pop-primary="">
            <Download /> Download
          </Button>
        )}
      </div>
    </div>
  );
}

const PARTS: Record<ChoiceScreen, Parts> = {
  add: {
    title: "Add photos",
    description: `Everything you add joins ${HOST.name}'s album.`,
    body: <AddDoors />,
  },
  download: {
    title: "Download album",
    description: "Pick what to bundle into your copy.",
    body: <DownloadBody />,
    act: { label: "Download", icon: <Download /> },
  },
  style: {
    title: "Customize the QR code",
    description:
      "Pick a style for your guest-join QR. It’s saved to this event and used everywhere you share it.",
    body: <StyleGrid />,
    act: { label: "Save QR style" },
  },
};

/* ── the menu shape: rows under the button, rows at the thumb ────────────── */

function DeskMenu({ screen }: { screen: ChoiceScreen }) {
  if (screen === "add")
    return (
      <AnchoredMenu width={320}>
        <MenuRow icon={<Camera />}>Take a photo</MenuRow>
        <MenuRow icon={<Images />}>Choose from your album</MenuRow>
        <p className="px-2.5 pt-1 pb-1.5 text-xs text-muted-foreground">
          {TERMS}
        </p>
      </AnchoredMenu>
    );
  if (screen === "download")
    return (
      <AnchoredMenu width={288} align="right">
        <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
          Download, as one file
        </p>
        {SETS.map((s, i) => (
          <MenuRow
            key={s.id}
            icon={i === 0 ? <Check /> : <span className="size-4" />}
            hint={s.n}
          >
            {s.label}
          </MenuRow>
        ))}
        <p className="px-2.5 pt-1 pb-1.5 text-xs text-muted-foreground">
          Everything is 18.4 GB.
        </p>
      </AnchoredMenu>
    );
  return (
    <AnchoredMenu width={300} className="p-2">
      <div
        data-pop-rows=""
        data-pop-noun="styles"
        className="grid grid-cols-2 gap-2"
      >
        {QR_STYLES.map((s, i) => (
          <span
            key={s.id}
            data-pop-row=""
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border-2 p-1.5",
              i === 0 ? "border-brand" : "border-transparent",
            )}
          >
            <StylePreview id={s.id} width={96} />
            <span className="text-xs font-medium">{s.name}</span>
          </span>
        ))}
      </div>
    </AnchoredMenu>
  );
}

function PhoneMenu({ screen }: { screen: ChoiceScreen }) {
  if (screen === "add")
    return (
      <ActionSheet
        title={`Everything you add joins ${HOST.name}'s album. ${TERMS}`}
      >
        <ActionRow icon={<Camera />} primary>
          Take a photo
        </ActionRow>
        <ActionRow icon={<Images />}>Choose from your album</ActionRow>
      </ActionSheet>
    );
  if (screen === "download")
    return (
      <ActionSheet title="Download album, as one file">
        {SETS.map((s, i) => (
          <ActionRow
            key={s.id}
            icon={<Download />}
            hint={s.n}
            primary={i === 0}
          >
            {s.label}
          </ActionRow>
        ))}
      </ActionSheet>
    );
  return (
    <ActionSheet title="The code's style, saved everywhere you share it">
      <div data-pop-rows="" data-pop-noun="styles">
        {QR_STYLES.map((s, i) => (
          <ActionRow
            key={s.id}
            icon={<StylePreview id={s.id} width={40} />}
            hint={
              i === 0 ? <Check className="size-4" aria-hidden /> : undefined
            }
            primary={i === 0}
          >
            <span className="block text-base">{s.name}</span>
            <span className="block text-xs text-muted-foreground">
              {s.line}
            </span>
          </ActionRow>
        ))}
      </div>
    </ActionSheet>
  );
}

/* ── the grounds ─────────────────────────────────────────────────────────── */

/** The kit the code's style opens from: the host's share sheet, as today,
 *  its Customize holding whatever the option puts there. */
function KitGround({
  size,
  customize,
  over,
}: {
  size: Size;
  customize?: Parameters<typeof kitParts>[0];
  over?: ReactNode;
}) {
  const kit = kitParts(customize);
  return (
    <HostHub
      size={size}
      overlay={
        <>
          {size === "desk" ? (
            <SidePanel parts={kit} />
          ) : (
            <BottomSheet parts={kit} />
          )}
          {over}
        </>
      }
    />
  );
}

function draw(
  option: ChoiceOption,
  screen: ChoiceScreen,
  size: Size,
): ReactNode {
  const phone = size === "phone";

  if (option === "menu") {
    if (screen === "add")
      return phone ? (
        <GuestAlbum
          size={size}
          view="top"
          overlay={<PhoneMenu screen="add" />}
        />
      ) : (
        <GuestAlbum
          size={size}
          view="top"
          add={{ at: <DeskMenu screen="add" /> }}
        />
      );
    if (screen === "download")
      return phone ? (
        <GuestAlbum
          size={size}
          view="top"
          overlay={<PhoneMenu screen="download" />}
        />
      ) : (
        <GuestAlbum
          size={size}
          view="top"
          download={{ at: <DeskMenu screen="download" /> }}
        />
      );
    return phone ? (
      <KitGround size={size} over={<PhoneMenu screen="style" />} />
    ) : (
      <KitGround size={size} customize={{ at: <DeskMenu screen="style" /> }} />
    );
  }

  if (option === "inline") {
    if (screen === "add")
      return (
        <GuestAlbum
          size={size}
          view="top"
          add={{
            replace: (
              <div data-pop-surface="inline" className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="lg" tabIndex={-1} data-pop-primary="">
                    <Camera /> Take a photo
                  </Button>
                  <Button size="lg" variant="outline" tabIndex={-1}>
                    <Images /> Choose
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {TERMS}
                </p>
              </div>
            ),
          }}
        />
      );
    if (screen === "download")
      return (
        <GuestAlbum
          size={size}
          view="top"
          download={{
            below: (
              <div
                data-pop-surface="inline"
                className="mb-4 rounded-xl border p-4"
              >
                <DownloadBody act />
              </div>
            ),
          }}
        />
      );
    return (
      <KitGround
        size={size}
        customize={{
          replace: (
            <div data-pop-surface="inline" className="w-full pt-1">
              <StyleGrid columns={4} />
            </div>
          ),
        }}
      />
    );
  }

  const parts = PARTS[screen];
  const surface =
    option === "dialog" ? (
      <CentredDialog
        parts={parts}
        width={screen === "style" ? "md" : "sm"}
        scrollBody
      />
    ) : phone ? (
      <BottomSheet parts={parts} />
    ) : (
      <SidePanel parts={parts} />
    );
  if (screen === "style") return <KitGround size={size} over={surface} />;
  return <GuestAlbum size={size} view="top" overlay={surface} />;
}

const PHONES: readonly ChoiceScreen[] = ["add", "download", "style"];

export function ChoicesPreview({
  option,
  at,
}: {
  option: ChoiceOption;
  at: ChoiceScreen;
}) {
  const phones: PhoneScene[] = PHONES.map((screen) => ({
    title: SCREEN_TITLE[screen],
    node: draw(option, screen, "phone"),
  }));
  return (
    <Scenes
      id={`choices-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, at, "desk")}
      laptopTitle={SCREEN_TITLE[at]}
      phones={phones}
    />
  );
}
