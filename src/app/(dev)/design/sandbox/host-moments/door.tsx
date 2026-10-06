"use client";

import { KeyRound, UsersRound } from "lucide-react";

import { DoorPage } from "@/components/app/event-settings/door-page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCount } from "@/lib/format/count";

import { Panel, WeddingSettings, weddingEvent } from "./chrome";
import { EVENT, GUESTS, NIGHT, PARTY } from "./fixtures";
import type { ScreenId } from "./knobs";
import { Graft, Mark, Press } from "./scene";

/**
 * B1, A PASSWORD ON AN ALBUM GUESTS ARE ALREADY IN: production's own door page
 * (`door-page.tsx`) over the wedding at 9:40 pm, You let each person in as
 * its gate, 31 guests in and 3 waiting, the moment Maya picks A password (the
 * frame presses it, so the field and its warning are production's own state).
 *
 * Today's warning is production's: the waiting line on the password's panel
 * and the "already in" note under the gates. A candidate hides those two and
 * draws its own in their place, so the rest of the page stays production's.
 */

export type PasswordWay = "today" | "both" | "picture";

const PRODUCTION_LINES =
  "[data-door-password-waiting], [data-door-inside] { display: none !important; }";

const people = (n: number, one: string, many: string) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

/** The two groups, said in one place before the field: who stays in, who meets it. */
function BothLines() {
  return (
    <div data-hm-read="what she reads" className="mb-2.5 space-y-1.5">
      <p className="flex items-start gap-2 rounded-lg bg-(--track) px-3 py-2 text-sm text-pretty">
        <UsersRound
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span>
          <span className="font-medium tabular-nums">
            {`${people(PARTY.in, "guest is", "guests are")} in, and stay in`}
          </span>{" "}
          <span className="text-muted-foreground">
            on every phone they used. Nobody inside is asked for it.
          </span>
        </span>
      </p>
      <p className="flex items-start gap-2 rounded-lg bg-(--track) px-3 py-2 text-sm text-pretty">
        <KeyRound
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span>
          <span className="font-medium tabular-nums">
            {`${people(PARTY.waiting, "person waits", "people wait")} at the door`}
          </span>{" "}
          <span className="text-muted-foreground">
            and stop waiting on you: they get in with the password, like anyone
            new.
          </span>
        </span>
      </p>
    </div>
  );
}

/** What each group meets once it saves, drawn small: the album for those in, the password for those waiting. */
function TwoPictures() {
  return (
    <div data-hm-read="what she sees" className="mb-2.5 grid grid-cols-2 gap-2">
      <figure className="space-y-1.5">
        <div className="relative h-24 overflow-hidden rounded-lg bg-muted">
          <div className="absolute inset-0 grid grid-cols-3 gap-px">
            {NIGHT.slice(3, 9).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph
              <img
                key={p.id}
                src={p.src}
                alt=""
                className="size-full object-cover"
              />
            ))}
          </div>
          <span className="absolute bottom-1.5 left-1.5 flex -space-x-1.5">
            {GUESTS.slice(0, 3).map((g) => (
              <Avatar key={g.seed} size="sm" seed={g.seed}>
                <AvatarFallback className="text-[10px]">
                  {g.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </span>
        </div>
        <figcaption className="text-caption text-pretty">
          <span className="font-medium tabular-nums">{`${formatCount(PARTY.in)} in`}</span>{" "}
          <span className="text-muted-foreground">
            keep the album, on every phone
          </span>
        </figcaption>
      </figure>
      <figure className="space-y-1.5">
        <div className="flex h-24 flex-col justify-center gap-1.5 rounded-lg bg-(--track) px-3">
          <span className="truncate text-xs font-medium">{`${EVENT.name} is private`}</span>
          <span className="flex h-7 items-center rounded-md bg-background px-2 text-xs text-muted-foreground inset-ring inset-ring-(--key-line)">
            Password
          </span>
          <span className="flex h-6 items-center justify-center rounded-md bg-primary text-[11px] font-medium text-primary-foreground">
            Unlock
          </span>
        </div>
        <figcaption className="text-caption text-pretty">
          <span className="font-medium tabular-nums">{`${formatCount(PARTY.waiting)} at the door`}</span>{" "}
          <span className="text-muted-foreground">
            meet the password instead
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

export function PasswordMoment({
  screen,
  way,
}: {
  screen: ScreenId;
  way: PasswordWay;
}) {
  return (
    <WeddingSettings
      event={weddingEvent({ door: "approve", visibility: "private" })}
      counts={{ in: PARTY.in, waiting: PARTY.waiting }}
    >
      <Panel screen={screen} title="Who can get in" up>
        <DoorPage guestsHref={`/dashboard/${EVENT.id}?room=guests`} />
      </Panel>
      <Press
        at='[data-door-gate="password"] button[role="radio"]'
        until="[data-door-password-waiting]"
      />
      {way === "today" ? (
        <>
          <Mark at="[data-door-password-waiting]" as="the waiting line" />
          <Mark at="[data-door-inside]" as="the inside note" />
        </>
      ) : (
        <>
          <style>{PRODUCTION_LINES}</style>
          <Graft at="[data-door-password-waiting]" place="before">
            {way === "both" ? <BothLines /> : <TwoPictures />}
          </Graft>
        </>
      )}
    </WeddingSettings>
  );
}
