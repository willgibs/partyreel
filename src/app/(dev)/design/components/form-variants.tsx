import { ChevronRight, Trash2 } from "lucide-react";

import { PhoneShell } from "../screens/phone-shell";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the forms & inputs language (event settings is the heaviest
 * host surface). The same settings in three architectures; this choice
 * cascades into every form Phase 5 builds.
 */
export function FormVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Card sections"
        rationale="Each concern gets a card: clear territory, labels above fields. Familiar, a little tall on long forms."
      >
        <Page title="Event settings">
          <div data-dir-card className="mt-4 space-y-3.5 p-4">
            <SectionLabel>Details</SectionLabel>
            <Field label="Event name" value="Maya & Jay's Wedding" />
            <Field label="Event date" value="June 14, 2026" />
          </div>
          <div data-dir-card className="mt-3 space-y-1 p-4">
            <SectionLabel>Access</SectionLabel>
            <ToggleRow label="Accepting uploads" on />
            <ToggleRow label="Require guest accounts" />
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-destructive/10 py-2.5 text-xs font-medium text-destructive">
            <Trash2 className="size-3.5" />
            Delete event
          </button>
        </Page>
      </Variant>

      <Variant
        n={2}
        name="Inline rows"
        rationale="The settings-app register: label left, value right, hairline dividers. Densest, calmest, scales to many options."
      >
        <Page title="Event settings">
          <div data-dir-card className="mt-4 overflow-hidden p-0">
            <Row label="Name" value="Maya & Jay's Wedding" />
            <Row label="Date" value="June 14, 2026" />
            <Row label="Custom link" value="maya-and-jay" />
            <ToggleRow label="Accepting uploads" on inset />
            <ToggleRow label="Require guest accounts" inset />
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] font-medium text-destructive">
                Delete event
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </div>
        </Page>
      </Variant>

      <Variant
        n={3}
        name="Focused column"
        rationale="One concern at a time, display-type labels: the form as a conversation. Slowest, but nothing competes for attention."
      >
        <Page title="">
          <p className="mt-2 text-[11px] tracking-widest text-muted-foreground uppercase">
            Settings · 1 of 3
          </p>
          <p data-dir-display className="mt-2 text-2xl leading-snug">
            What&rsquo;s the event called?
          </p>
          <div className="mt-5 rounded-[var(--radius)] border border-input bg-card px-4 py-3.5 text-sm">
            Maya & Jay&rsquo;s Wedding
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Guests see this name on the invite and the album.
          </p>
          <button
            data-dir-press
            className="mt-6 h-11 w-full rounded-[var(--radius)] bg-primary text-sm font-medium text-primary-foreground"
          >
            Continue
          </button>
        </Page>
      </Variant>
    </div>
  );
}

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PhoneShell>
      <div className="absolute inset-0 overflow-hidden px-4 pt-12">
        {title && (
          <p data-dir-display className="text-xl leading-snug">
            {title}
          </p>
        )}
        {children}
      </div>
    </PhoneShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium">{label}</p>
      <div className="rounded-[calc(var(--radius)*0.8)] border border-input bg-background px-3 py-2 text-[13px]">
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <span className="shrink-0 text-[13px] font-medium">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-[13px] text-muted-foreground">
        <span className="truncate">{value}</span>
        <ChevronRight className="size-3.5 shrink-0" />
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  on = false,
  inset = false,
}: {
  label: string;
  on?: boolean;
  inset?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        inset ? "border-b border-border px-4 py-3" : "py-1.5"
      }`}
    >
      <span className="text-[13px] font-medium">{label}</span>
      <span
        className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          on ? "bg-foreground" : "bg-muted"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-background ${on ? "ml-auto" : ""}`}
        />
      </span>
    </div>
  );
}
