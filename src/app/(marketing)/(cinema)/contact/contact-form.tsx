"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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

import { submitContactForm } from "./actions";

// THE NOTE on THE DESK (the desk's composite, 2026-08-28 sitting): the V2
// desk structure carries the form, dressed in V1's stationery identity (the
// photo postage stamp + the letterhead line), on the Biograph gray panel so
// the WHITE fields read against the card (his biograph.com/contact reference).
// The stamp is the page's one media gesture (the desk spread was dropped as
// too busy next to it). Shared shell for the live form AND the success state
// so submitting swaps content without the frame reflowing.
function FormCard({ children }: { children: ReactNode }) {
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

export function ContactForm({
  helpSubjects,
}: {
  /**
   * Build-time slug map for the help handoff (?about=<slug>): the article
   * title prefills the subject and its category pre-picks the topic.
   */
  helpSubjects?: Record<string, { title: string; topic: ContactTopicValue }>;
}) {
  const [submitted, setSubmitted] = useState(false);
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
    const result = await submitContactForm(values);
    if (result.ok) {
      track("contact_submit");
      setSubmitted(true);
      form.reset();
      toast.success("Thanks! Your message is on its way.");
    } else {
      showActionError(result);
    }
  }

  if (submitted) {
    return (
      <FormCard>
        {/* The drawn check is the 10-success-check recipe (marketing.css
            ch. 2): data-state="in" fires on mount, the inline dasharray
            (24 ≈ path length + 1) scopes the draw to THIS icon, and success
            green is the sanctioned state accent. */}
        <div
          data-contact-success
          className="flex min-h-72 flex-col items-start justify-center gap-3"
        >
          <span className="mkt-check text-success" data-state="in" aria-hidden>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M20 6 9 17l-5-5"
                style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
              />
            </svg>
          </span>
          <h3 className="font-heading text-subsection">Message sent</h3>
          <p className="text-sm text-pretty text-muted-foreground">
            Thanks for reaching out. {REPLY_LINE}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="bg-background"
              onClick={() => setSubmitted(false)}
            >
              Send another
            </Button>
            <Link
              href="/help"
              className="mkt-learn inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Browse the help center
              <LearnChevron />
            </Link>
          </div>
        </div>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
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
    </FormCard>
  );
}
