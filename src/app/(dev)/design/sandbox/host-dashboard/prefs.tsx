"use client";

import { ArrowLeft, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { RuleId } from "./model";
import { type Picks, RuleChoices } from "./stage-slot";

/**
 * WHERE A HOST'S DASHBOARD PREFERENCES LIVE, for the two `rule` options that
 * keep the rule away from the stage:
 *  - `head`: Customize in the page head, beside the storage ring and New
 *    event: the stage's rule and the Recent row, the page's own preferences;
 *  - `settings`: Settings' account page, a "Your dashboard" section, drawn as
 *    a stand-in of Settings (its nav and its one section; nothing else of the
 *    account page is drawn or asked here).
 */

type RuleProps = {
  rule: RuleId;
  onRule: (r: RuleId) => void;
  picks: Picks;
  ends: Record<string, string>;
  today: string;
};

/** `head`: the page's Customize, the stage's rule first. */
export function HeadCustomize({
  open,
  onOpen,
  recent,
  onRecent,
  ...rule
}: RuleProps & {
  open: boolean;
  onOpen: (open: boolean) => void;
  /** Whether the Recent row shows. */
  recent: boolean;
  onRecent: (on: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-hd-rule={rule.rule}
          data-hd-customize=""
          aria-label="Customize your dashboard"
        >
          <Settings2 /> <span className="max-sm:hidden">Customize</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[26rem] space-y-3 p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="px-2.5 pt-1.5 text-xs text-muted-foreground">
          Lead your dashboard with
        </p>
        <RuleChoices {...rule} dense />
        <label className="flex items-center justify-between gap-3 border-t border-border px-2.5 pt-3 pb-1.5 text-sm">
          <span>
            <span className="block font-medium">Recent</span>
            <span className="block text-xs text-muted-foreground">
              The events you opened lately, over the rest
            </span>
          </span>
          <Switch checked={recent} onCheckedChange={onRecent} />
        </label>
      </PopoverContent>
    </Popover>
  );
}

const NAV = ["Account", "Your dashboard", "Notifications", "Plan & billing"];

/** `settings`: Settings' account page, its "Your dashboard" section. */
export function SettingsPage({
  onBack,
  wide,
  ...rule
}: RuleProps & { onBack: () => void; wide: boolean }) {
  return (
    <section data-hd-settings="" aria-label="Settings" className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2"
        data-hd-back=""
      >
        <ArrowLeft /> Dashboard
      </Button>
      <h1 className="font-heading text-page">Settings</h1>
      <div className={cn("flex gap-10", !wide && "flex-col gap-4")}>
        <nav
          aria-label="Settings"
          className={cn(
            "flex shrink-0 gap-1",
            wide
              ? "w-52 flex-col"
              : "[scrollbar-width:none] overflow-x-auto",
          )}
        >
          {NAV.map((n) => (
            <span
              key={n}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm",
                n === "Your dashboard"
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {n}
            </span>
          ))}
        </nav>
        <div className="max-w-2xl min-w-0 flex-1 space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-subsection">Your dashboard</h2>
            <p className="text-sm text-muted-foreground">
              How your dashboard opens, on every device you sign in on.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-border p-2">
            <p className="px-2.5 pt-1.5 text-sm font-medium">
              Lead your dashboard with
            </p>
            <RuleChoices {...rule} />
          </div>
        </div>
      </div>
    </section>
  );
}
