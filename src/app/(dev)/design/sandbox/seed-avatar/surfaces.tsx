import type { ReactNode } from "react";
import { ArrowLeft, LifeBuoy, LogOut, Palette, Settings } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";

import type { Chip } from "@/app/(dev)/design/sandbox/profile-page/fixtures";

import {
  CAST,
  CAST_SMALL,
  EVENT,
  HOST,
  NEWCOMER,
  type SeedSource,
  seedOf,
  VISITOR,
} from "./fixtures";
import {
  BigOrb,
  type CrowdMode,
  initialOf,
  type OrbOptions,
  SeedAvatar,
} from "./orb";

/**
 * THE REAL AVATAR SURFACES, RE-COMPOSED.
 *
 * ★ WHY THESE ARE QUOTED RATHER THAN MOUNTED, and it is the same reason
 * `profile-page` gives for the same components. `GuestList` renders its own `<ul>`
 * and takes NO per-chip slot, so a seeded fallback cannot be handed to it from
 * outside: the wiring lane changes `AvatarFallback` itself and the shipped list then
 * gets the orb without one line changing here. `UserMenu` and `GuestAccountMenu`
 * both resolve a live Supabase session on mount (the guest one fetches
 * `/api/me/menu` once per frame), so mounting either would draw whatever account the
 * author happens to be signed in as, once per tile.
 *
 * So the MARKUP is copied line for line from the shipped files (`guest-list.tsx`'s
 * `CHIP` string, `user-menu.tsx`'s rows, `account-avatar-form.tsx`'s control,
 * `/u/[slug]`'s identity row) and everything that is a real component stays one:
 * `Avatar`, `Button`, `Logo` and the floating-layer surfaces are imported.
 */

/* ── 1. The crowd: the guest list under an album ─────────────────────────── */

/** `guest-list.tsx`'s own chip, character for character. */
const CHIP =
  "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";

/** Faces on the row before the +N, and the threshold, both from the shipped file. */
const FACES = 6;

const HEADING =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

function Face({
  person,
  source,
  options,
}: {
  person: Chip;
  source: SeedSource;
  options: OrbOptions;
}) {
  return (
    <SeedAvatar
      seed={seedOf(person, source)}
      name={person.displayName}
      photo={person.avatarUrl}
      size="sm"
      options={options}
    />
  );
}

/**
 * ★ THE GREY LIST IS DRAWN BESIDE EVERY OPTION, ALWAYS. Will's argument is a
 * comparison ("without avatars/color it feels very bland"), and an option judged
 * without the thing it replaces beside it is judged against a memory. This is the
 * shipped fallback: one letter on `bg-muted`, nineteen times.
 */
function GreyFace({ person }: { person: Chip }) {
  return person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- a fixture still, cropped as the shipped page crops a real avatar
    <img
      src={person.avatarUrl}
      alt=""
      className="size-6 shrink-0 rounded-full border border-border object-cover"
    />
  ) : (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] text-muted-foreground">
      {initialOf(person.displayName)}
    </span>
  );
}

function Chips({
  people,
  source,
  options,
  grey,
}: {
  people: Chip[];
  source: SeedSource;
  options: OrbOptions;
  grey?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5" data-seed-list>
      {people.map((person) => (
        <li key={person.id}>
          <span
            className={`${CHIP} ${person.slug ? "text-foreground" : "text-muted-foreground"}`}
          >
            {grey ? (
              <GreyFace person={person} />
            ) : (
              <Face person={person} source={source} options={options} />
            )}
            <span className="max-w-40 truncate">
              {person.displayName ?? "Guest"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The condensed row: six faces, a count, the sentence beside it. */
function FacesRow({
  source,
  options,
  grey,
}: {
  source: SeedSource;
  options: OrbOptions;
  grey?: boolean;
}) {
  const faces = CAST.slice(0, FACES);
  return (
    <div className="flex items-center gap-3">
      <div className="group/avatar-group flex -space-x-2 *:ring-2 *:ring-background *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
        {faces.map((person) =>
          grey ? (
            <GreyFace key={person.id} person={person} />
          ) : (
            <Face
              key={person.id}
              person={person}
              source={source}
              options={options}
            />
          ),
        )}
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground ring-2 ring-background">
          +{CAST.length - faces.length}
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        {EVENT.guests} guests added photos
      </span>
    </div>
  );
}

/**
 * The whole tail of an album: the condensed row a reader meets, and the opened
 * list under it. Both, because the condensed row is what the colour has to survive
 * at six faces and the opened list is the thing Will described going bland.
 */
export function Crowd({
  source,
  options,
  crowd = "full",
  grey,
  short,
  reference,
}: {
  source: SeedSource;
  options: OrbOptions;
  crowd?: CrowdMode;
  /** Draw today's grey instead: the comparison every option is judged against. */
  grey?: boolean;
  /** Twelve names, the size at which the shipped list never condenses. */
  short?: boolean;
  /** Add today's grey as a strip under the list, in the same frame. */
  reference?: boolean;
}) {
  // `quiet` keeps colour on the row a reader meets and leaves the wrapping list
  // grey; `soft` colours everything and holds the chroma back inside the list.
  const rowOptions = options;
  const listOptions: OrbOptions =
    crowd === "soft" ? { ...options, muted: true } : options;
  const listGrey = grey || crowd === "quiet";
  return (
    <section className="space-y-4" data-seed-crowd>
      <div className="space-y-2">
        <h2 className={HEADING}>Guests</h2>
        {!short && <FacesRow source={source} options={rowOptions} grey={grey} />}
      </div>
      <Chips
        people={short ? CAST_SMALL : CAST}
        source={source}
        options={listOptions}
        grey={listGrey}
      />
      {reference && !grey && <TodayStrip />}
    </section>
  );
}

/* ── 2. The dashboard's user menu ────────────────────────────────────────── */

function MenuRow({ children }: { children: ReactNode }) {
  return (
    <span
      className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm ${floatingRow} [&>svg:first-child]:text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0`}
    >
      {children}
    </span>
  );
}

const GROUP_LABEL =
  "px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground";

/** The host app's header bar with the account menu open under it: `user-menu.tsx`'s
 *  trigger, header and rows, in the 224px panel its own comment measures. */
export function Dashboard({
  source,
  options,
  grey,
  photo,
}: {
  source: SeedSource;
  options: OrbOptions;
  grey?: boolean;
  photo?: boolean;
}) {
  const person: Chip = {
    id: HOST.id,
    displayName: HOST.name,
    slug: HOST.slug,
    avatarMarker: null,
    avatarUrl: photo ? HOST.photo : null,
  };
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <span aria-label="Partyreel home">
          <Logo />
        </span>
        <div className="relative flex h-8 items-center">
          {grey ? (
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-sm text-muted-foreground">
              {initialOf(HOST.name)}
            </span>
          ) : (
            <SeedAvatar
              seed={seedOf(person, source)}
              name={HOST.name}
              photo={person.avatarUrl}
              options={options}
            />
          )}
          <div
            className={`absolute top-full right-0 z-50 mt-1 w-56 p-1 ${floatingPanel}`}
          >
            <div className="px-2 pt-1.5 pb-2 text-sm font-medium">
              <span className="block truncate">{HOST.name}</span>
              <span className="block truncate text-xs leading-tight font-normal text-muted-foreground">
                {HOST.email}
              </span>
            </div>
            <p className={GROUP_LABEL}>Your account</p>
            <MenuRow>
              <Settings /> Account
            </MenuRow>
            <MenuRow>
              <Palette /> Theme
            </MenuRow>
            <p className={GROUP_LABEL}>Partyreel</p>
            <MenuRow>
              <ArrowLeft /> Back to site
            </MenuRow>
            <MenuRow>
              <LifeBuoy /> Help center
            </MenuRow>
            <div className="mt-1 rounded-sm bg-muted/50 p-1">
              <MenuRow>
                <LogOut /> Sign out
              </MenuRow>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 px-4 py-5">
        <h1 className="font-heading text-xl">Your events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two albums, one still collecting.
        </p>
      </div>
    </div>
  );
}

/* ── 3. The guest event page's account menu ──────────────────────────────── */

/** `guest-account-menu.tsx` reuses the host menu's trigger and `initial()` exactly,
 *  so the orb reaches it the same way: one change in `AvatarFallback`. */
export function GuestBar({
  source,
  options,
  grey,
}: {
  source: SeedSource;
  options: OrbOptions;
  grey?: boolean;
}) {
  const person: Chip = {
    id: VISITOR.id,
    displayName: VISITOR.name,
    slug: null,
    avatarMarker: null,
    avatarUrl: null,
  };
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm">{EVENT.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {EVENT.dateLabel}
          </p>
        </div>
        <div className="relative flex h-8 items-center">
          {grey ? (
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-sm text-muted-foreground">
              {initialOf(VISITOR.name)}
            </span>
          ) : (
            <SeedAvatar
              seed={seedOf(person, source)}
              name={VISITOR.name}
              options={options}
            />
          )}
          <div
            className={`absolute top-full right-0 z-50 mt-1 w-56 p-1 ${floatingPanel}`}
          >
            <div className="px-2 pt-1.5 pb-2 text-sm font-medium">
              <span className="block truncate">{VISITOR.name}</span>
              <span className="block truncate text-xs leading-tight font-normal text-muted-foreground">
                {VISITOR.email}
              </span>
            </div>
            <MenuRow>
              <Settings /> Your photos
            </MenuRow>
            <MenuRow>
              <Palette /> Theme
            </MenuRow>
            <div className="mt-1 rounded-sm bg-muted/50 p-1">
              <MenuRow>
                <LogOut /> Sign out
              </MenuRow>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 px-4 py-5 text-sm text-muted-foreground">
        214 photos and videos
      </div>
    </div>
  );
}

/* ── 4. The account page's avatar control ────────────────────────────────── */

/** `account-avatar-form.tsx`'s own 64px control, with its two buttons. */
export function AccountForm({
  source,
  options,
  grey,
  photo,
}: {
  source: SeedSource;
  options: OrbOptions;
  grey?: boolean;
  photo?: boolean;
}) {
  const person: Chip = {
    id: HOST.id,
    displayName: HOST.name,
    slug: HOST.slug,
    avatarMarker: null,
    avatarUrl: null,
  };
  return (
    <div className="flex min-h-full flex-col bg-background p-4 text-foreground">
      <h1 className="font-heading text-xl">Account</h1>
      <div className="mt-5 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">Photo</p>
        <div className="mt-4 flex items-center gap-4">
          {grey ? (
            <span className="flex size-16 items-center justify-center rounded-full border border-border bg-muted text-lg text-muted-foreground">
              {initialOf(HOST.name)}
            </span>
          ) : (
            <BigOrb
              seed={seedOf(person, source)}
              name={HOST.name}
              photo={photo ? HOST.photo : null}
              px={64}
              options={options}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              {photo ? "Change photo" : "Upload a photo"}
            </Button>
            {photo && (
              <Button variant="ghost" size="sm">
                Remove
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {photo
            ? "Your photo shows on every album you add to."
            : "Until you add one, this colour is yours on every album you add to."}
        </p>
      </div>
    </div>
  );
}

/* ── 5. The profile's identity row ───────────────────────────────────────── */

/** `/u/[slug]`'s own 80px row, quoted from `profile-page`'s `Identity`. */
export function IdentityRow({
  source,
  options,
  grey,
}: {
  source: SeedSource;
  options: OrbOptions;
  grey?: boolean;
}) {
  const person: Chip = {
    id: NEWCOMER.id,
    displayName: NEWCOMER.name,
    slug: NEWCOMER.slug,
    avatarMarker: null,
    avatarUrl: null,
  };
  return (
    <div className="flex min-h-full flex-col bg-background p-5 text-foreground">
      <section className="flex flex-wrap items-center gap-5">
        {grey ? (
          <div className="flex size-20 items-center justify-center rounded-full border border-border bg-muted text-2xl font-medium text-muted-foreground">
            {initialOf(NEWCOMER.name)}
          </div>
        ) : (
          <BigOrb
            seed={seedOf(person, source)}
            name={NEWCOMER.name}
            px={80}
            options={options}
          />
        )}
        <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-6.25rem)]">
          <h1 className="font-heading text-page text-balance">
            {NEWCOMER.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            <span>@{NEWCOMER.slug}</span>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>{NEWCOMER.joined}</span>
          </p>
        </div>
      </section>
      <p className="mt-6 text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    </div>
  );
}

/* ── 6. Today, drawn small, under whatever replaced it ───────────────────── */

/** The shipped fallback, compressed into one strip: the reference every option on
 *  this board is judged against, in the same frame rather than from memory. */
export function TodayStrip() {
  return (
    <div className="mt-6 border-t border-border/60 pt-4">
      <p className={`${HEADING} mb-2`}>Today</p>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 *:ring-2 *:ring-background">
          {CAST.slice(0, FACES).map((person) => (
            <GreyFace key={person.id} person={person} />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          one grey disc, nineteen times
        </span>
      </div>
    </div>
  );
}

/* ── 7. What a rename does, which is the whole of the seed question ──────── */

/**
 * ★ THE ONLY WAY TO DRAW A SEED DECISION. The three options produce colours that
 * differ, which tells a reviewer nothing on its own. What separates them is what
 * happens to one person over time, so the same person is drawn three times: as they
 * signed up, after they tidied their own name, and after they claimed a handle. An
 * option that changes colour between these columns changes colour on every album
 * that person has ever uploaded to.
 */
export function RenameProof({
  source,
  options,
}: {
  source: SeedSource;
  options: OrbOptions;
}) {
  const base: Chip = {
    id: "u-priya",
    displayName: "priya r",
    slug: null,
    avatarMarker: null,
    avatarUrl: null,
  };
  const moments: [string, Chip][] = [
    ["The day they signed up", base],
    ["After they tidied their name", { ...base, displayName: "Priya Raman" }],
    ["After they claimed a handle", { ...base, displayName: "Priya Raman", slug: "priya" }],
  ];
  return (
    <div className="space-y-3" data-seed-rename>
      {moments.map(([when, person]) => (
        <div key={when} className="flex items-center gap-3">
          <SeedAvatar
            seed={seedOf(person, source)}
            name={person.displayName}
            size="lg"
            options={options}
          />
          <div className="min-w-0">
            <p className="truncate text-sm">{person.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{when}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 8. What a photograph leaves of the colour ───────────────────────────── */

/** Every surface that can hold a photograph, with one: the 24px faces, the 64px
 *  account control, the 80px identity row, and that row while the presigned URL is
 *  still in flight, which is the state the `under` option exists for. */
export function PhotoProof({
  source,
  options,
}: {
  source: SeedSource;
  options: OrbOptions;
}) {
  const withPhoto = CAST.filter((p) => p.avatarUrl).slice(0, 4);
  const host: Chip = {
    id: HOST.id,
    displayName: HOST.name,
    slug: HOST.slug,
    avatarMarker: null,
    avatarUrl: HOST.photo,
  };
  const rowOrb = (
    <BigOrb
      seed={seedOf(host, source)}
      name={HOST.name}
      photo={HOST.photo}
      px={80}
      options={options}
    />
  );
  return (
    <div className="space-y-6" data-seed-photo>
      <div className="space-y-2">
        <p className={HEADING}>A guest list, four of them with a face</p>
        <div className="flex items-center gap-1.5">
          {withPhoto.map((person) => (
            <Face key={person.id} person={person} source={source} options={options} />
          ))}
          {CAST.filter((p) => !p.avatarUrl)
            .slice(0, 3)
            .map((person) => (
              <Face
                key={person.id}
                person={person}
                source={source}
                options={options}
              />
            ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className={HEADING}>The account page, and a profile</p>
        <div className="flex flex-wrap items-center gap-5">
          <BigOrb
            seed={seedOf(host, source)}
            name={HOST.name}
            photo={HOST.photo}
            px={64}
            options={options}
          />
          {rowOrb}
        </div>
      </div>
      <div className="space-y-2">
        <p className={HEADING}>The same row, while the photograph is in flight</p>
        {options.after === "replace" ? (
          // ★ TODAY'S TRUTH, AND THE REASON THIS OPTION IS DRAWN AT ALL. The 80px
          // identity row and the account control are plain `<img>` elements with no
          // fallback behind them, so a presign still in flight is an empty disc.
          // Only the options that paint the colour on the ELEMENT reach them.
          <div className="size-20 rounded-full border border-border bg-muted" />
        ) : (
          <BigOrb
            seed={seedOf(host, source)}
            name={HOST.name}
            px={80}
            options={options}
          />
        )}
      </div>
    </div>
  );
}

/* ── 9. The size ladder the Avatar contract names ────────────────────────── */

/** 24, 32 and 40 side by side, which is the only way the `letter` decision can be
 *  judged: the question is whether an initial still reads at the smallest one. */
export function SizeLadder({
  source,
  options,
}: {
  source: SeedSource;
  options: OrbOptions;
}) {
  const people = CAST.slice(1, 5);
  return (
    <div className="space-y-4" data-seed-ladder>
      {(
        [
          ["sm", "24, a guest list"],
          ["default", "32, a menu"],
          ["lg", "40, a row"],
        ] as const
      ).map(([size, label]) => (
        <div key={size} className="flex items-center gap-3">
          <div className="flex w-44 shrink-0 items-center gap-1.5">
            {people.map((person) => (
              <SeedAvatar
                key={person.id}
                seed={seedOf(person, source)}
                name={person.displayName}
                size={size}
                options={options}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
