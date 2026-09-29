"use client";

import { useState, useTransition } from "react";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * THE REPORTER'S ANSWER (admin-triage r2, `proof=confirm`), one field and one press. It goes to the report through
 * `/api/reports/answer` with the link's own token, and says so in place once it lands: the link is spent then, so
 * the page never offers a second send that could only fail.
 */
export function ReportAnswerForm({ token }: { token: string }) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, answer: answer.trim() }),
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          setError(
            data && typeof data === "object" && "message" in data
              ? String((data as { message: unknown }).message)
              : "Couldn't add your answer. Please try again.",
          );
          return;
        }
        setSent(true);
      } catch {
        setError("Couldn't add your answer. Please try again.");
      }
    });
  }

  if (sent) {
    return (
      <p
        role="status"
        className="flex items-start gap-2 rounded-lg border bg-card p-4 text-reading"
      >
        <CircleCheck
          className="mt-0.5 size-5 shrink-0 text-success"
          aria-hidden
        />
        Thanks. Your answer is on your report, and the person reviewing it will
        read it there.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (answer.trim()) send();
      }}
    >
      <Label htmlFor="report-answer">Your answer</Label>
      <Textarea
        id="report-answer"
        rows={5}
        maxLength={2000}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
      />
      <p className="text-caption text-muted-foreground">
        Only the person reviewing your report reads it. The host is never told
        who reported.
      </p>
      {error ? (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending || !answer.trim()}>
          {pending ? "Sending…" : "Add to my report"}
        </Button>
      </div>
    </form>
  );
}
