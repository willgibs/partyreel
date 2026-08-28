"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, Copy, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_TOPICS,
  type ContactTopicValue,
} from "@/lib/constants/contact";
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { showActionError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";

import { submitContactForm } from "./actions";

// Shared card shell so the live form and the success state render in one
// identical container: submitting swaps the inner content without the frame
// appearing or reflowing. The form is this page's primary instrument, so the
// card carries the float shadow at rest (the help search-field precedent).
function FormCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-float ring-1 ring-foreground/5 sm:p-8">
      {children}
    </div>
  );
}

// Marketing-scale field grammar (the app default is h-8; a marketing page
// wants the CTA register). Overrides ride className, no new primitives.
const FIELD = "h-11 rounded-xl text-base md:text-base";

/**
 * The rail's plain-email door with the copy-to-clipboard micro-delight: one
 * tap, the icon swaps to the drawn-check green for a beat. Clipboard failure
 * (odd browsers, permissions) falls back to a toast carrying the address.
 */
export function ContactEmailCard() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast(SUPPORT_EMAIL, { description: "Copy the address from here." });
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground">
          <Mail aria-hidden className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="font-heading text-base font-medium">
            Prefer plain email?
          </p>
          <div className="flex items-center gap-1.5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="truncate font-mono text-sm tracking-wide text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
            >
              {SUPPORT_EMAIL}
            </a>
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy email address"}
              className="flex size-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-[border-color,color,transform] duration-150 hover:border-foreground/30 hover:text-foreground active:scale-[0.92]"
            >
              {copied ? (
                <Check aria-hidden className="size-3.5 text-success" />
              ) : (
                <Copy aria-hidden className="size-3.5" />
              )}
            </button>
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            Notes land in the same inbox as the form.
          </p>
        </div>
      </div>
      {/* The standard reply line earns a second seat at the commit point (the
          hero states it a full scroll away); same wording, never a variant. */}
      <div className="mt-5 flex items-start gap-4 border-t pt-5">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground">
          <Clock aria-hidden className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-base font-medium">Reply time</p>
          <p className="text-sm text-pretty text-muted-foreground">
            Every note gets a reply, usually within a day.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactForm({
  helpSubjects,
}: {
  /**
   * Build-time slug map for the help handoff (?about=<slug>): the article
   * title prefills the subject and its category pre-picks the topic chip.
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
  // (never a wall in front of the message field).
  const topicValue = form.watch("topic");
  const hint = CONTACT_TOPICS.find((t) => t.value === topicValue)?.hint ?? null;

  // Help handoff: prefill subject + topic from ?about=<slug>, allowlisted
  // against the build-time map so nothing attacker-controlled reaches a field.
  // Read in a mount effect (never useSearchParams: on this static route it
  // would demand a Suspense boundary or deopt the page; the motion-tuner
  // precedent). Server and first client render both produce "" — no mismatch.
  useEffect(() => {
    if (!helpSubjects) return;
    const slug = new URLSearchParams(window.location.search).get("about");
    const entry = slug ? helpSubjects[slug] : undefined;
    if (!entry) return;
    if (!form.getValues("subject")) {
      form.setValue("subject", `Help: ${entry.title}`, { shouldDirty: false });
    }
    if (!form.getValues("topic")) {
      form.setValue("topic", entry.topic, { shouldDirty: false });
    }
  }, [form, helpSubjects]);

  async function onSubmit(values: ContactInput) {
    const result = await submitContactForm(values);
    if (result.ok) {
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
        {/* h-full + justify-center so the short confirmation sits centered in
            the stretched card frame. The drawn check is the 10-success-check
            recipe (marketing.css ch. 2): data-state="in" fires on mount, the
            inline dasharray (24 ≈ path length + 1) scopes the draw to THIS
            icon, and success green is the sanctioned state accent. */}
        <div
          data-contact-success
          className="flex h-full flex-col items-start justify-center gap-3"
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
          <h3 className="font-heading text-lg font-medium">Message sent</h3>
          <p className="text-sm text-pretty text-muted-foreground">
            Thanks for reaching out. Every note gets a reply, usually within a
            day.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <Button
              variant="outline"
              size="sm"
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
          {/* The topic router: sr-only radios inside styled labels, so keyboard
              semantics (arrow keys, groups) come from the platform while the
              chips carry the marketing register. Selected = the ink inversion
              (the pricing segmented-control grammar). */}
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What&rsquo;s this about?</FormLabel>
                <FormControl>
                  <div
                    role="radiogroup"
                    aria-label="Topic"
                    className="flex flex-wrap gap-2 pt-1"
                  >
                    {CONTACT_TOPICS.map((topic) => (
                      /* Selected state rides cn() off the CONTROLLED value, not
                         :has(:checked): React flips the checked property and at
                         least one Chromium-embedded engine never re-resolves
                         the ancestor's :has() (verified 2026-08-28: a clone of
                         the same node styled correctly while the live one
                         stayed stale). The state is already in JS; use it.
                         :has survives only for the focus ring (non-critical). */
                      <label
                        key={topic.value}
                        className={cn(
                          "ease-emphasis inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40 active:scale-[0.97] motion-reduce:transition-none",
                          field.value === topic.value
                            ? "border-foreground bg-foreground text-background"
                            : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name={field.name}
                          value={topic.value}
                          checked={field.value === topic.value}
                          onChange={() => field.onChange(topic.value)}
                          onBlur={field.onBlur}
                        />
                        <topic.icon
                          aria-hidden
                          className="size-4"
                          strokeWidth={1.5}
                        />
                        {topic.label}
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* The fastest-path hint swaps with the topic (keyed remount so the
              entrance replays per pick; occasional frequency, standard beat). */}
          {hint && (
            <div
              key={topicValue}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground duration-200 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
            >
              <span className="text-pretty">{hint.text}</span>
              <Link
                href={hint.href}
                className="mkt-learn inline-flex items-center gap-1 font-medium text-foreground"
              >
                {hint.linkLabel}
                <LearnChevron />
              </Link>
            </div>
          )}
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
                    className="min-h-36 rounded-xl text-base md:text-base"
                    placeholder="What's going on?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className={cn(
              "h-11 self-start px-6 text-base",
              "transition-transform active:scale-[0.98]",
            )}
          >
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
        </form>
      </Form>
    </FormCard>
  );
}
