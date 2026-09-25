"use client";

import { useEffect, useRef, useState } from "react";

import { EntryShell } from "@/components/guest/entry-shell";
import { EntryStepTransition } from "@/components/guest/entry-step-transition";
import { GuestNameStep } from "@/components/guest/guest-name-step";
import { Button } from "@/components/ui/button";
import { floatingKeyboardFoot } from "@/components/ui/floating-layer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * THE KEYBOARD SHEET BENCH: the door's own shell over a fake album, swapping steps, with the
 * viewport read out live inside the sheet, for walking the keyboard on a phone or a simulator.
 *
 * The shell is production's (`EntryShell`, the responsive Sheet, its keyboard hook and the door's
 * padding), and so is the name step (`GuestNameStep`, its ghost email line and sticky foot). The
 * other three steps are replicas at the same measure, with nothing wired to send: the identify
 * screen's button, the code field and the report box go nowhere, so a walk can type freely.
 *
 * The readout is the one line a keyboard walk needs: the layout viewport, the visual viewport and
 * its pan, the document's own scroll (the page behind must never move), the height the keyboard
 * took from the visible area (the rest height less the current one, Safari's form bar included),
 * and what the sheet wrote on itself (`--kb-inset`, `data-keyboard`). It sits inside the sheet so
 * assistive tech and a UI test can read it while the dialog hides the page.
 */
type Step = "name" | "identify" | "code" | "report";

const STEPS: { id: Step; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "identify", label: "Identify" },
  { id: "code", label: "Code" },
  { id: "report", label: "Report" },
];

export function KeyboardBench() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<Step>("name");
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");

  return (
    <div data-keyboard-bench>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setOpen(true)}>
          Open the sheet
        </Button>
        <p className="text-reading text-muted-foreground">
          Tap a field with the software keyboard on. The sheet should sit on the
          keyboard, the primary stay in reach, and the album behind never
          scroll.
        </p>
      </div>
      <FakeAlbum />
      {/* A second way in at the album's foot, so the sheet can open over a page already scrolled
          (the Report sheet's own situation), and the page's scroll read while the sheet is shut. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Open it down here
        </Button>
        {!open && <Readout />}
      </div>
      <EntryShell
        open={open}
        dismissMode="free"
        onDismiss={() => setOpen(false)}
        title="Keyboard sheet"
        description="A bench for the door's sheet under a software keyboard."
      >
        <Readout />
        <div className="mb-3 flex gap-1" role="tablist" aria-label="Steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={step === s.id}
              onClick={() => {
                setDirection(
                  i >= STEPS.findIndex((x) => x.id === step) ? "fwd" : "back",
                );
                setStep(s.id);
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
                step === s.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <EntryStepTransition stepKey={step} direction={direction}>
          <div className="relative pt-1">
            {step === "name" && (
              <GuestNameStep
                qrToken="keyboard-bench"
                mode="join"
                onNamed={() => {}}
              />
            )}
            {step === "identify" && <IdentifyReplica />}
            {step === "code" && <CodeReplica />}
            {step === "report" && <ReportReplica />}
          </div>
        </EntryStepTransition>
      </EntryShell>
    </div>
  );
}

/** The viewport, read once a frame while anything that moves it fires. */
function Readout() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [line, setLine] = useState("");

  useEffect(() => {
    const vv = window.visualViewport;
    let frame = 0;
    // The visible height with nothing typed, so the keyboard's share of it can be said.
    let rest = vv?.height ?? window.innerHeight;
    const read = () => {
      frame = 0;
      const sheet = ref.current?.closest<HTMLElement>("[data-entry-sheet]");
      const vvh = vv?.height ?? window.innerHeight;
      const typing =
        sheet?.contains(document.activeElement) &&
        /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? "");
      if (!typing) rest = vvh;
      const inset = sheet?.style.getPropertyValue("--kb-inset") || "0px";
      const kb = sheet?.getAttribute("data-keyboard") ?? "closed";
      const a = document.activeElement;
      setLine(
        [
          `active ${a ? a.tagName.toLowerCase() + (a.id ? "#" + a.id : "") : "-"}`,
          `ih ${window.innerHeight}`,
          `vv ${Math.round(vvh)} @ ${Math.round(vv?.offsetTop ?? 0)}`,
          `scroll ${Math.round(window.scrollY)}`,
          `keyboard ${Math.round(rest - vvh)}`,
          `inset ${inset}`,
          kb,
          `sheet ${sheet ? `${Math.round(sheet.scrollTop)}/${sheet.scrollHeight}/${sheet.clientHeight}` : "-"}`,
        ].join(" · "),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    const tick = setInterval(schedule, 500);
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearInterval(tick);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, []);

  return (
    <p
      ref={ref}
      data-kb-readout
      className="mb-2 font-mono text-[11px] leading-tight text-muted-foreground"
    >
      {line}
    </p>
  );
}

/** The album behind: tall enough that the page itself scrolls, as the event page does. */
function FakeAlbum() {
  return (
    <div className="grid grid-cols-3 gap-1 sm:grid-cols-4" aria-hidden>
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-sm bg-muted"
          style={{ opacity: 0.45 + ((i * 37) % 55) / 100 }}
        />
      ))}
    </div>
  );
}

/** Identify at its measure: a name and an email under the gate line, one button that sends nothing. */
function IdentifyReplica() {
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <p className="font-heading text-page text-balance">
          24 photos &amp; videos are waiting
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          The host has asked guests to confirm an email for safety. One tap and
          you&rsquo;re in.
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="bench-name">Your name</Label>
          <Input
            id="bench-name"
            autoComplete="name"
            enterKeyHint="next"
            className="h-11 text-base"
          />
          <p className="text-reading text-muted-foreground">
            If you already have a Partyreel account, its name is the one that
            shows.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bench-email">Email</Label>
          <Input
            id="bench-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="send"
            className="h-11 text-base"
          />
        </div>
        <div
          data-sheet-primary
          className={cn("relative", floatingKeyboardFoot)}
        >
          <Button type="submit" size="cta" className="w-full">
            Email me a code
          </Button>
        </div>
      </div>
    </form>
  );
}

/** The code screen at its measure: six digits, the one-time-code keyboard. */
function CodeReplica() {
  return (
    <div className="space-y-4 text-center">
      <div className="space-y-1">
        <p className="text-sm font-medium">Enter your code</p>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">priya@example.com</span>
          .
        </p>
      </div>
      <Input
        aria-label="Your code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="mx-auto h-11 max-w-48 text-center text-lg tracking-[0.5em]"
      />
      <p className="text-xs text-muted-foreground">
        Or tap the link in the same email to sign in.
      </p>
    </div>
  );
}

/** Report at its measure: the one guest sheet with a textarea. */
function ReportReplica() {
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <p className="font-heading text-card-title font-medium">
        Report this event
      </p>
      <p className="text-sm text-muted-foreground">
        Tell us what&rsquo;s wrong and our team will review it. Reports are
        anonymous.
      </p>
      <Label htmlFor="bench-reason">Reason (optional)</Label>
      <Textarea
        id="bench-reason"
        rows={4}
        placeholder="What's the problem here?"
      />
      <div data-sheet-primary className={cn("relative", floatingKeyboardFoot)}>
        <Button type="submit" className="w-full">
          Submit report
        </Button>
      </div>
    </form>
  );
}
