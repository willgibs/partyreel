"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useForm, useWatch } from "react-hook-form";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics/web";
import {
  CONTACT_TOPICS,
  type ContactHint,
  type ContactTopicValue,
  REPLY_LINE,
} from "@/lib/constants/contact";
import { marketingImage } from "@/lib/constants/marketing-media";
import { showActionError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";

import { submitContactForm, type ContactResult } from "./actions";
import {
  ContactReceipt,
  Postmark,
  receiptFrom,
  type ContactReceiptData,
} from "./contact-receipt";

// THE NOTE on THE DESK (the desk's composite, 2026-08-28 sitting): the V2
// desk structure carries the form, dressed in V1's stationery identity (the
// photo postage stamp + the letterhead line), on the Biograph gray panel so
// the WHITE fields read against the card (his biograph.com/contact reference).
// The stamp is the page's one media gesture (the desk spread was dropped as
// too busy next to it). Shared shell for the live form AND the receipt so
// submitting swaps content inside one frame; once the note is sent the stamp is
// postmarked (contact-receipt.tsx), the card's own way of saying "posted".
function FormCard({
  children,
  postmark,
}: {
  children: ReactNode;
  postmark?: ContactReceiptData["postmark"];
}) {
  const stamp = marketingImage("party-balloons");
  return (
    <div className="relative rounded-2xl border bg-muted/50 p-6 ring-1 ring-foreground/5 sm:p-8">
      {/* The postage stamp: white border, a hair of rotation, and shadow-lift
          because it really overhangs the card's top edge (one object on
          another is the small shadow's case; it was a stock shadow-lg).
          aria-hidden: pure stationery identity. */}
      <div aria-hidden className="absolute -top-4 right-6 rotate-3 sm:right-8">
        <Image
          src={stamp.src}
          alt=""
          width={64}
          height={64}
          className="size-16 rounded-tile border-4 border-background object-cover shadow-lift"
        />
      </div>
      {postmark && <Postmark date={postmark} />}
      <Caption>A note to Partyreel</Caption>
      <div className="mt-5">{children}</div>
    </div>
  );
}

// Marketing-scale field grammar on the gray panel: fields go bg-background
// (paper white) so they pop against the card, per the Biograph reference.
const FIELD = "h-11 rounded-xl bg-background text-base md:text-base";

/**
 * The topic's own note and answers (contact-page r1 `urgency`: "custom per topic
 * instead of one generic 'try troubleshooting'"): one sentence, then the help
 * articles that settle THIS topic's questions, so a visitor can be answered
 * before writing. The links leave the page, which is why the hint stands above
 * the fields: a pick comes first, and nothing typed yet is lost to a click.
 */
function TopicHint({ hint }: { hint: ContactHint }) {
  return (
    <div className="flex animate-in flex-col gap-3 rounded-xl bg-background px-4 py-3.5 text-sm duration-200 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <p className="text-pretty text-muted-foreground">{hint.text}</p>
      {/* Stacked in a hand (one edge to scan, a row a thumb can hit), one
          wrapping line from sm up. */}
      <ul className="-my-1 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-5">
        {hint.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="mkt-learn inline-flex items-center gap-1 py-1.5 font-medium text-foreground"
            >
              {link.label}
              <LearnChevron />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The form's exit before the receipt: exits are faster than entrances. */
const FORM_EXIT_MS = 150;

export function ContactForm({
  helpSubjects,
}: {
  /**
   * Build-time slug map for the help handoff (?about=<slug>): the article
   * title prefills the subject and its category pre-picks the topic.
   */
  helpSubjects?: Record<string, { title: string; topic: ContactTopicValue }>;
}) {
  // The receipt's data once a note is sent (null while the form stands), the
  // form's short exit before the swap, and "Send another"'s arrival: three
  // states of one card, never three components.
  const [receipt, setReceipt] = useState<ContactReceiptData | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [returning, setReturning] = useState(false);
  // The height the form held when it was sent: from lg the receipt keeps that
  // frame (the desk's composition never changes under it), and in a hand it
  // condenses from it to its own height (contact-receipt.tsx).
  const [frame, setFrame] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
    },
  });
  const { isSubmitting } = form.formState;

  // The fastest-path hint for the picked topic: deflection INSIDE the form
  // (never a wall in front of the message field). `useWatch` rather than
  // `form.watch()`, whose returned function the React Compiler cannot memoize,
  // so it skipped this whole component.
  const topicValue = useWatch({ control: form.control, name: "topic" });
  const hint = CONTACT_TOPICS.find((t) => t.value === topicValue)?.hint ?? null;

  // Help handoff: prefill subject + topic from ?about=<slug>, allowlisted
  // against the build-time map so nothing attacker-controlled reaches a field.
  // Read in a mount effect (never useSearchParams: on this static route it
  // would demand a Suspense boundary or deopt the page; same as the
  // motion-tuner). Server and first client render both produce "" — no mismatch.
  useEffect(() => {
    if (!helpSubjects) return;
    const slug = new URLSearchParams(window.location.search).get("about");
    // An OWN key only: a plain object also answers "constructor" and
    // "__proto__" with an inherited member, which would prefill "Help: undefined".
    const entry =
      slug && Object.hasOwn(helpSubjects, slug)
        ? helpSubjects[slug]
        : undefined;
    if (!entry) return;
    const values = form.getValues();
    if (values.subject || values.topic) return;
    // reset() over setValue(): with the Select's empty-emission guard both
    // now work, but reset() also makes the handoff the form's BASELINE, so
    // the post-success "Send another" keeps the article context instead of
    // wiping it. At mount the form is empty; merging over values is safe.
    form.reset({
      ...values,
      subject: `Help: ${entry.title}`,
      topic: entry.topic,
    });
  }, [form, helpSubjects]);

  async function onSubmit(values: ContactInput) {
    // A Server Function that never answers (a dropped connection, a deploy
    // mid-request) rejects rather than returning a failure arm: it reads as the
    // same failed send, never as a button that quietly springs back.
    const result: ContactResult = await submitContactForm(values).catch(() => ({
      ok: false as const,
      code: "send_failed" as const,
    }));
    if (!result.ok) {
      showActionError(result);
      return;
    }
    track("contact_submit");
    const sent = receiptFrom(values, new Date());
    // Exits are faster than entrances: the form leaves in 150ms and the receipt
    // arrives on its own beats. Awaited here so the button stays disabled (and
    // the form inert) until the swap; a reader who asked for less motion gets
    // the swap at once, and the receipt's arrival is motion-safe on its own.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLeaving(true);
      await new Promise((resolve) => setTimeout(resolve, FORM_EXIT_MS));
    }
    // reset() lands on the form's baseline (the help handoff's article context,
    // when there was one), after the swap so the fields never blank mid-exit.
    form.reset();
    setLeaving(false);
    setReturning(false);
    setReceipt(sent);
  }

  function sendAnother() {
    setReceipt(null);
    setReturning(true);
  }

  // "Send another" hands the keyboard back to the first field, the way the
  // receipt took it from the button that sent.
  useEffect(() => {
    if (!returning) return;
    body.current
      ?.querySelector<HTMLElement>('[role="combobox"]')
      ?.focus({ preventScroll: true });
  }, [returning]);

  return (
    <FormCard postmark={receipt?.postmark}>
      <div
        ref={body}
        style={
          receipt && frame
            ? ({ "--frame": `${frame}px` } as CSSProperties)
            : undefined
        }
      >
        {receipt ? (
          <ContactReceipt receipt={receipt} onAnother={sendAnother} />
        ) : (
          <Form {...form}>
            <form
              onSubmit={(event) => {
                // The frame is measured as the send starts, while the form still
                // stands; the receipt keeps it (a ref read belongs in a handler).
                setFrame(body.current?.offsetHeight ?? 0);
                return form.handleSubmit(onSubmit)(event);
              }}
              inert={leaving}
              className={cn(
                "flex flex-col gap-5",
                // The exit and the return, each motion-safe by construction.
                "blur-[0px] transition-[opacity,filter,scale] duration-150 ease-emphasis motion-reduce:transition-none",
                leaving &&
                  "pointer-events-none scale-[0.985] opacity-0 blur-[2px]",
                returning &&
                  "animate-in duration-200 fade-in motion-reduce:animate-none",
              )}
            >
              {/* Honeypot — hidden from real users; bots that fill it are silently dropped. */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                {...form.register("website")}
              />
              {/* The topic router as ONE clean field (from that sitting: seven
                  open chips ate the form; a dropdown keeps the routing without the
                  room). The portaled content must carry the paper skin itself
                  (the portal rule, portal-skin.ts). */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What&rsquo;s this about?</FormLabel>
                    {/* value stays undefined until set — Radix treats a controlled
                        "" as a real (empty) selection and latches the placeholder,
                        which ate the ?about= handoff's programmatic pre-pick. The
                        trigger display is rendered manually from CONTACT_TOPICS
                        instead of <SelectValue>: with the popper closed the items
                        never mounted, so Radix cannot resolve a label for a value
                        set without opening (the same handoff path). */}
                    {/* The onChange guard: Radix's hidden native-select bridge
                        emits an EMPTY onValueChange during mount cycles, which
                        clobbered the handoff's programmatic pre-pick (observed:
                        "" -> reset lands "billing" -> a stray "" wipes it). No
                        real selection is ever "", so empties are dropped. */}
                    <Select
                      onValueChange={(v) => {
                        if (v) field.onChange(v);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "w-full rounded-xl bg-background text-base data-[size=default]:h-11 md:text-base",
                          )}
                        >
                          {(() => {
                            const picked = CONTACT_TOPICS.find(
                              (t) => t.value === field.value,
                            );
                            return picked ? (
                              <span className="flex items-center gap-2">
                                <picked.icon
                                  aria-hidden
                                  className="size-4"
                                  strokeWidth={1.5}
                                />
                                {picked.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Pick a topic
                              </span>
                            );
                          })()}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        data-mkt=""
                        position="popper"
                        className="surface-paper rounded-xl"
                      >
                        {CONTACT_TOPICS.map((topic) => (
                          <SelectItem
                            key={topic.value}
                            value={topic.value}
                            className="rounded-lg py-2.5"
                          >
                            <topic.icon
                              aria-hidden
                              className="size-4"
                              strokeWidth={1.5}
                            />
                            {topic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* The topic's own answers, under the picker (keyed remount so the
                  entrance replays per pick; on the gray panel the hint sits on
                  paper white for contrast). Its text also rides a persistent live
                  region: the picker keeps focus after a pick, so a screen reader
                  would never meet the swap otherwise. sr-only is out of flow, so it
                  adds no gap to the form's flex column. */}
              {hint && <TopicHint key={topicValue} hint={hint} />}
              <p role="status" className="sr-only">
                {hint
                  ? `${hint.text} ${hint.links.map((link) => link.label).join(", ")}.`
                  : ""}
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          className={FIELD}
                          placeholder="Your name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          className={FIELD}
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Subject{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={FIELD}
                        placeholder="One line, if it helps"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-36 rounded-xl bg-background text-base md:text-base"
                        placeholder="What's going on?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button
                  type="submit"
                  size="cta"
                  disabled={isSubmitting}
                  className="transition-transform active:scale-[0.98]"
                >
                  {isSubmitting ? "Sending…" : "Send message"}
                </Button>
                {/* The V1 steal: the reply line seated at the commit point. */}
                <p className="text-xs text-muted-foreground">{REPLY_LINE}</p>
              </div>
            </form>
          </Form>
        )}
      </div>
    </FormCard>
  );
}
