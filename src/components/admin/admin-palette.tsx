"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Wallet } from "lucide-react";

import { Kbd } from "@/components/shared/kbd";
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  useCommandPaletteQuery,
} from "@/components/ui/command-palette";
import {
  matchPalette,
  PALETTE_ACTIONS,
  paletteSurfaces,
  type PaletteEntry,
} from "@/lib/admin/palette";
import { searchAccountsForPaletteAction } from "@/lib/admin/palette-actions";

/**
 * THE PORTAL'S ⌘K (`nav=rail-palette`, Will 2026-09-20).
 *
 * Three groups: the twelve surfaces (from `nav.ts`), the acts an operator does
 * often enough to want by name, and accounts, which is the one group a nav
 * could never hold. A solo operator does the same eight things a day and this
 * is one component on top of the rail.
 *
 * ★ IT JUMPS AND IT NEVER ACTS. "Pause the purge sweep" takes you to the
 * switch; it does not throw it. `destructive=sheet` was ruled precisely because
 * the portal's most expensive acts were its cheapest clicks, and a palette that
 * fired one on Enter after four letters would be a new cheapest click.
 *
 * ★ ACCOUNTS ARE FETCHED, NOT SHIPPED. The surfaces and the actions are a
 * static index the bundle can carry; the account list is the customer table and
 * stays on the server behind an AAL2-gated action, debounced so typing does not
 * open one request per keystroke.
 */
export function AdminPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // ⌘K / Ctrl+K from anywhere in the portal. `preventDefault` matters: Ctrl+K
  // is Chrome's omnibox search and ⌘K is Firefox's search bar. The guard on
  // `defaultPrevented` is what keeps two palettes on one page from both firing,
  // which is live today (the help centre's binds the same keys on /help).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.repeat &&
        !event.defaultPrevented
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandPalette open={open} onOpenChange={onOpenChange}>
      <CommandPaletteContent label="Search the operations portal">
        <CommandPaletteInput
          label="Search surfaces, actions and accounts"
          placeholder="Search or jump to..."
        />
        <PaletteBody />
        <CommandPaletteFooter>
          <span className="flex items-center gap-1.5">
            <Kbd>{"↑"}</Kbd>
            <Kbd>{"↓"}</Kbd> Move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>{"↵"}</Kbd> Open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>esc</Kbd> Close
          </span>
        </CommandPaletteFooter>
      </CommandPaletteContent>
    </CommandPalette>
  );
}

type AccountHit = { id: string; label: string; meta: string };

function PaletteBody() {
  const query = useCommandPaletteQuery();
  const router = useRouter();
  // ★ THE HITS CARRY THE TERM THEY ANSWER, so nothing has to be CLEARED when
  // the query changes: rows for a stale term are simply not the rows for this
  // one. Clearing in the effect instead would be a setState inside an effect
  // (a cascading render), and it would still paint last term's accounts for a
  // frame on the way through.
  const [hits, setHits] = useState<{ term: string; rows: AccountHit[] }>({
    term: "",
    rows: [],
  });
  const [, startTransition] = useTransition();
  const term = query.trim();

  const surfaces = useMemo(
    () => matchPalette(paletteSurfaces(), query, 8),
    [query],
  );
  const actions = useMemo(
    () => (term ? matchPalette(PALETTE_ACTIONS, query, 5) : []),
    [term, query],
  );
  const accounts = hits.term === term && term.length >= 2 ? hits.rows : [];

  // One request per pause in the typing, never one per keystroke. The cleanup
  // clears the timer AND the flag, so a reply that arrives after the palette
  // has closed is dropped.
  useEffect(() => {
    if (term.length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchAccountsForPaletteAction(term);
        if (live) setHits({ term, rows });
      });
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [term]);

  const empty =
    surfaces.length === 0 && actions.length === 0 && accounts.length === 0;

  return (
    <CommandPaletteList label="Surfaces, actions and accounts">
      {empty ? (
        <CommandPaletteEmpty>
          Nothing matches that. Try a surface name, an account&rsquo;s email, or
          a word from an action.
        </CommandPaletteEmpty>
      ) : null}

      {surfaces.length > 0 ? (
        <CommandPaletteGroup heading="Surfaces">
          {surfaces.map((entry) => (
            <Row key={entry.id} entry={entry} router={router} />
          ))}
        </CommandPaletteGroup>
      ) : null}

      {actions.length > 0 ? (
        <CommandPaletteGroup heading="Actions">
          {actions.map((entry) => (
            <Row key={entry.id} entry={entry} router={router} jump />
          ))}
        </CommandPaletteGroup>
      ) : null}

      {accounts.length > 0 ? (
        <CommandPaletteGroup heading="Accounts">
          {accounts.map((account) => (
            <Row
              key={account.id}
              entry={{
                id: `account-${account.id}`,
                label: account.label,
                href: `/admin/accounts/${account.id}`,
                meta: account.meta,
              }}
              router={router}
              icon={<Wallet aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
            />
          ))}
        </CommandPaletteGroup>
      ) : null}
    </CommandPaletteList>
  );
}

function Row({
  entry,
  router,
  jump = false,
  icon,
}: {
  entry: PaletteEntry;
  router: ReturnType<typeof useRouter>;
  /** True for an action: the row lands on a control rather than on a page. */
  jump?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <CommandPaletteItem
      onSelect={() => {
        // The palette's own dismiss runs first, so the scroll lock is gone
        // before the route change and any #anchor lands.
        requestAnimationFrame(() => router.push(entry.href));
      }}
    >
      {icon ??
        (jump ? (
          <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <CornerDownLeft aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        ))}
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.meta ? (
        <span className="shrink-0 text-caption text-muted-foreground">
          {entry.meta}
        </span>
      ) : null}
    </CommandPaletteItem>
  );
}
