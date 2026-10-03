"use client";

import { useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

import {
  SettingsCard,
  SettingsNote,
  StackSetting,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { cn } from "@/lib/utils";

import { Mark } from "./add";
import {
  ALBUM_STILLS,
  EVENT,
  ROLL,
  STYLE_LINES,
  STYLE_NAMES,
  STYLES,
  type StyleId,
} from "./fixtures";
import { StylePicture } from "./pictures";

/**
 * SETTINGS' "WHAT GUESTS CAN ADD", ON PAPER: where the add step's pick lands
 * the moment Create returns, drawn so Create and Settings can be read side by
 * side. Production's own popup (`kind="settings"`: a panel at a desk, the whole
 * screen in a hand) and its furniture, with the album styles `wait-wiring`
 * builds (`AlbumStyles` in `camera-settings.tsx` on its branch): the three
 * cards, the develop time and the page's switches in one card, the look note,
 * and Customize. Retyped here, on purpose, until that lane merges; the wiring
 * that follows this board mounts the real one.
 *
 * ★ HELD ON PAPER WHATEVER THE LAB'S THEME: Settings follows the theme, and
 * paper is where it differs most from the room, so this frame holds its own
 * document light (the frame copies the lab's theme onto its `<html>`, so the
 * hold re-asserts on every change, as the identity board's ground does).
 */

/** Holds a frame's own document on paper (its `<html>`, never the lab's); returns the release. */
function holdPaper(doc: Document): () => void {
  const html = doc.documentElement;
  const win = doc.defaultView;
  if (!win) return () => {};
  const hold = () => {
    if (html.classList.contains("dark")) html.classList.remove("dark");
    if (!html.classList.contains("light")) html.classList.add("light");
    if (html.style.colorScheme !== "light") html.style.colorScheme = "light";
  };
  hold();
  const mo = new win.MutationObserver(hold);
  mo.observe(html, { attributes: true, attributeFilter: ["class", "style"] });
  return () => mo.disconnect();
}

/** One album style, Settings' card: its picture, its name and its line, the whole card the choice. */
function StyleCard({ style, on }: { style: StyleId; on: boolean }) {
  return (
    <div
      data-album-style={style}
      data-state={on ? "on" : "off"}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border p-2.5",
        on
          ? "border-foreground/40 bg-muted/40 ring-1 ring-foreground/15"
          : "border-border",
      )}
    >
      <StylePicture
        style={style}
        moment="party"
        className="h-[72px] w-[88px]"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-base">
          {STYLE_NAMES[style]}
        </span>
        <span className="block text-caption text-pretty text-muted-foreground">
          {STYLE_LINES[style]}
        </span>
      </span>
      <Mark on={on} />
    </div>
  );
}

/** The event behind the panel at a desk: its name, and the album's first rows. */
function Behind() {
  return (
    <div className="mx-auto max-w-5xl px-8 pt-16">
      <p className="font-heading text-page">{EVENT.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">Saturday, October 10</p>
      <div className="mt-6 grid grid-cols-5 gap-1.5">
        {ALBUM_STILLS.slice(0, 10).map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- a still of the album behind the panel
          <img
            key={`${s.id}-${i}`}
            src={s.src}
            alt=""
            className="aspect-square w-full rounded-md object-cover"
          />
        ))}
      </div>
    </div>
  );
}

/** Settings' page as the add step's pick leaves it. */
export function SettingsOnPaper({ picked }: { picked: StyleId }) {
  const ground = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const doc = ground.current?.ownerDocument;
    return doc ? holdPaper(doc) : undefined;
  }, []);
  const developing = picked === "disposable";
  return (
    <div
      ref={ground}
      data-cw-paper=""
      className="min-h-screen bg-background text-foreground"
    >
      <Behind />
      <Popup open onOpenChange={() => {}}>
        <PopupContent kind="settings" routed>
          <PopupHeader
            title="What guests can add"
            up={{ label: "Settings", onUp: () => {} }}
          />
          <PopupBody className="space-y-6 pb-6" data-settings-page="adds">
            <div className="space-y-4" data-album-styles={picked}>
              <section className="space-y-2">
                <p className="px-1 text-sm font-medium">Album style</p>
                <div
                  role="radiogroup"
                  aria-label="Album style"
                  className="space-y-2"
                >
                  {STYLES.map((s) => (
                    <StyleCard key={s} style={s} on={s === picked} />
                  ))}
                </div>
              </section>
              <SettingsCard label="What guests can add">
                {developing ? (
                  <StackSetting
                    label="Develop time"
                    line="Everyone's photos appear at once."
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={`Sun, Oct 11, ${ROLL.develops}`}
                        className="max-w-48"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        tabIndex={-1}
                      >
                        Develop now
                      </Button>
                    </div>
                  </StackSetting>
                ) : null}
                <SwitchSetting
                  label="Accepting uploads"
                  line="Turn off to freeze the album. Guests can still view it."
                  checked
                  onCheckedChange={() => {}}
                />
                <SwitchSetting
                  label="Videos"
                  line="Guests can add videos up to 10 GB each."
                  checked
                  onCheckedChange={() => {}}
                />
              </SettingsCard>
              {developing ? (
                <SettingsNote>
                  {`Before it develops at ${ROLL.develops} tomorrow, look under the cover on your event page to take anything out. Need longer? Move the develop time.`}
                </SettingsNote>
              ) : null}
              <p className="flex w-full items-center justify-between gap-3 px-1 py-1.5 text-sm text-muted-foreground">
                Customize how guests add and when everyone sees
                <ChevronDown aria-hidden className="size-4 shrink-0" />
              </p>
            </div>
          </PopupBody>
        </PopupContent>
      </Popup>
    </div>
  );
}
