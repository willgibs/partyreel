"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { altAnswer, CHANGE, KEEP, RECOMMENDED } from "@/lib/calls/answers";
import type { BuiltCall, QuestionEntry } from "@/lib/calls/calls";
import { cn } from "@/lib/utils";

import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import {
  type HeldCall,
  keepCalls,
  type ReviewStore,
  sentOf,
  setCallNote,
  toggleCallAnswer,
  useReviewStore,
} from "../_desk/review-store";
import { callHoldId } from "../_desk/step-id";

/**
 * THE CALLS PLACE (calls-desk; Will, 2026-10-07: the calls doc "had become a decision log", and "probably just build
 * it into the lab for easier handling"). On the desk beside the boards he sits: the decisions built into Partyreel
 * that he cannot see by using it, the open questions first and then the calls by theme, each read at a glance and
 * answered in a press. A question takes its recommendation, another way or his own words; a call is kept or changed,
 * with his words on what instead.
 *
 * ★ A CALL HE LEAVES IS STILL BUILT, AND STILL HERE. Keeping is the default answer and sends nothing until he says
 * it: an untouched call stays as built and waits for his next sitting, and only a call he kept or changed may leave
 * the list (the record retires it the same day). A silence that let every unread call leave would end the one thing
 * the list is for, his view on what slips into systems unseen; so a keep is a press, and the last one keeps the rest.
 *
 * Every answer lives in the review's own store (this browser only) and rides the one paste the boards' answers ride
 * (`composeSoFar`), so nothing here writes anything. The words are the file's own, `docs/calls.json`.
 */
export function CallsPlace({
  questions,
  themes,
}: {
  questions: QuestionEntry[];
  themes: { theme: string; calls: BuiltCall[] }[];
}) {
  const store = useReviewStore();
  const calls = themes.flatMap((t) => t.calls);
  // The calls with no answer yet: what "Keep the rest" would keep.
  const open = calls.filter((c) => !heldOf(store, c.id).answer);

  if (questions.length === 0 && calls.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Nothing waits on you here: every question has its answer and every call
        its keep or change.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {questions.length > 0 && (
        <div>
          <Heading>Open questions</Heading>
          <ol className="mt-3 space-y-2">
            {questions.map((q) => (
              <Question key={q.id} entry={q} store={store} />
            ))}
          </ol>
        </div>
      )}

      {themes.map(({ theme, calls }) => (
        <div key={theme}>
          <Heading>{theme}</Heading>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {calls.map((c) => (
              <Call key={c.id} entry={c} store={store} />
            ))}
          </ul>
        </div>
      ))}

      {open.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            A call you leave stays as built and waits here for your next
            sitting. A call you keep is done, and leaves the list.
          </p>
          <button
            type="button"
            data-dir-press
            onClick={() => keepCalls(open.map((c) => c.id))}
            className="inline-flex h-9 shrink-0 focus-halo items-center justify-center rounded-lg border border-border px-3 text-xs font-medium transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none"
          >
            {open.length === calls.length
              ? `Keep all ${calls.length}`
              : `Keep the other ${open.length}`}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * What the store holds for an entry, as two strings. The store is this browser's localStorage, so a value of another
 * shape reads as nothing held rather than stopping the desk.
 */
function heldOf(store: ReviewStore, id: string): HeldCall {
  const held: unknown = store.calls?.[id];
  const field = (key: keyof HeldCall) => {
    const value =
      held && typeof held === "object"
        ? (held as Record<string, unknown>)[key]
        : undefined;
    return typeof value === "string" ? value : "";
  };
  return { answer: field("answer"), note: field("note") };
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}

/**
 * A field's words with their `code` spans drawn as such: the file writes an env name or a column in backticks, as the
 * docs do, and a reader should see a name, never the ticks.
 */
function Words({ text }: { text: string }) {
  const parts = text.split("`");
  // An odd count of ticks leaves the last one open: read it as plain text.
  if (parts.length % 2 === 0) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-sm bg-muted px-1 py-px font-sans text-[0.92em] text-foreground"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Its id, quiet, as he may say it in chat ("L2: ..."), and its title and body as one paragraph. */
function Lede({ entry }: { entry: QuestionEntry | BuiltCall }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="mr-1.5 text-[11px] text-faint tabular-nums">
        {entry.id}
      </span>
      <span className="font-medium">
        <Words text={entry.title} />
      </span>{" "}
      <span className="text-muted-foreground">
        <Words text={entry.body} />
      </span>
    </p>
  );
}

/** The faint line a paste leaves on an answer it took: changing the answer takes the mark away. */
function SentMark({ store, id }: { store: ReviewStore; id: string }) {
  const sent = sentOf(store, callHoldId(id));
  if (!sent) return null;
  return (
    <span
      className="text-[11px] text-faint"
      title="It rode a paste. Change it and it goes again as a replacement."
    >
      {sent.build ? `sent on ${sent.build}` : "sent"}
    </span>
  );
}

const FIELD =
  "min-h-9 px-3 py-2 text-[13px] leading-relaxed md:text-[13px] placeholder:text-faint";

function Question({
  entry,
  store,
}: {
  entry: QuestionEntry;
  store: ReviewStore;
}) {
  const { answer: picked, note: words } = heldOf(store, entry.id);
  const options = [
    { answer: RECOMMENDED, label: "Recommended:", text: entry.recommended },
    ...entry.alternatives.map((text, i) => ({
      answer: altAnswer(i),
      label: "Or:",
      text,
    })),
  ];
  return (
    <li className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Tag tone="outline">{entry.theme}</Tag>
        <span className="ml-auto">
          <SentMark store={store} id={entry.id} />
        </span>
      </div>
      <div className="mt-1.5">
        <Lede entry={entry} />
      </div>
      <div
        role="group"
        aria-label={`Your answer to ${entry.id}`}
        className="mt-3 flex flex-col gap-1.5"
      >
        {options.map((o, i) => {
          const chosen = picked === o.answer;
          return (
            <button
              key={o.answer}
              type="button"
              data-dir-press
              aria-pressed={chosen}
              onClick={() => toggleCallAnswer(entry.id, o.answer)}
              className={cn(
                "flex w-full min-w-0 focus-halo items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors duration-150 motion-reduce:transition-none",
                chosen
                  ? "border-foreground/40 bg-muted/40 ring-1 ring-foreground/40"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-px inline-flex size-4.5 shrink-0 items-center justify-center rounded-md border text-[10px] tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                  chosen
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground",
                )}
              >
                {chosen ? <Check className="size-2.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[13px] leading-snug break-words">
                <span className="font-medium">{o.label}</span>{" "}
                <span className="text-muted-foreground">
                  <Words text={o.text} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {/* His own answer is his words with no pick; with a pick they are a
          note on it. One field, so the words survive a change of pick. */}
      <Textarea
        rows={1}
        value={words}
        onChange={(e) => setCallNote(entry.id, e.target.value)}
        aria-label={
          picked
            ? `A note on your answer to ${entry.id}`
            : `Your own answer to ${entry.id}`
        }
        placeholder={
          picked
            ? "A note on your pick (optional)"
            : "Or answer in your own words"
        }
        className={cn("mt-2", FIELD)}
      />
      {!picked && words.trim() && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          This rides as your own answer.
        </p>
      )}
    </li>
  );
}

function Call({ entry, store }: { entry: BuiltCall; store: ReviewStore }) {
  // ★ HIS PRESS ON CHANGE TAKES HIM TO ITS FIELD, A LOAD NEVER DOES. A change
  // held from an earlier visit mounts its field when the store loads, and an
  // `autoFocus` there pulled the desk down to it on every visit; so the press
  // asks for the focus and the field takes it only then.
  const focusNext = useRef(false);
  const { answer, note: words } = heldOf(store, entry.id);
  // ★ A PRESSED ANSWER IS QUIET: a sitting that keeps fifteen calls must not
  // leave fifteen inked buttons down the page, so the held one is a muted
  // fill, its ring and a check, the way the step's own picks read.
  const press = (on: boolean) =>
    cn(
      "inline-flex h-9 min-w-16 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-medium transition-colors duration-150 focus-halo motion-reduce:transition-none",
      on
        ? "border-foreground/40 bg-muted text-foreground ring-1 ring-foreground/40"
        : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
    );
  return (
    <li className="px-4 py-3">
      <Lede entry={entry} />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="italic">Change it if</span>{" "}
          <Words text={entry.changeIf} />
        </p>
        <div
          role="group"
          aria-label={`Keep or change ${entry.id}`}
          className="flex shrink-0 items-center gap-1.5"
        >
          <SentMark store={store} id={entry.id} />
          <button
            type="button"
            data-dir-press
            aria-pressed={answer === KEEP}
            onClick={() => toggleCallAnswer(entry.id, KEEP)}
            className={press(answer === KEEP)}
          >
            {answer === KEEP && <Check className="size-3" aria-hidden />}
            Keep
          </button>
          <button
            type="button"
            data-dir-press
            aria-pressed={answer === CHANGE}
            onClick={() => {
              focusNext.current = toggleCallAnswer(entry.id, CHANGE);
            }}
            className={press(answer === CHANGE)}
          >
            {answer === CHANGE && <Check className="size-3" aria-hidden />}
            Change
          </button>
        </div>
      </div>
      {answer === CHANGE && (
        <div className="mt-2">
          <Textarea
            rows={1}
            ref={(el) => {
              if (el && focusNext.current) {
                focusNext.current = false;
                el.focus();
              }
            }}
            value={words}
            onChange={(e) => setCallNote(entry.id, e.target.value)}
            aria-label={`What ${entry.id} should do instead`}
            aria-required
            placeholder="What should it do instead?"
            className={FIELD}
          />
          {!words.trim() && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Say what it should do instead, and it rides your next paste.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
