"use client";

import { Briefcase } from "lucide-react";

import {
  excerptFrom,
  greetingFrom,
  NoteReceipt,
} from "@/components/marketing/forms/note-receipt";
import type { CareerInput } from "@/lib/validation/careers";

/**
 * A JOB APPLICATION'S RECEIPT (mkt-polish): the public forms' one receipt (`NoteReceipt`,
 * `components/marketing/forms/`) where the form used to end on a toast and a bare drawn check. What is
 * this form's own: the role it was for, a line that promises only what the page already does ("We read
 * every application"; a reply is promised to nobody), and the story behind the company while they wait.
 */

export type ApplicationReceiptData = {
  greeting: string | null;
  email: string;
  role: string;
  excerpt: string;
};

/** What the receipt shows of an application. Pure, so each rule is the contact receipt's, pinned once. */
export function applicationReceiptFrom(
  values: Pick<CareerInput, "name" | "email" | "message">,
  role: string,
): ApplicationReceiptData {
  return {
    greeting: greetingFrom(values.name),
    email: values.email.trim(),
    role,
    excerpt: excerptFrom(values.message),
  };
}

/** The line under the heading: the page's own promise ("What happens next": we read every application). */
export const APPLICATION_LINE =
  "We read every application, and we’ll be in touch if it looks like a fit.";

export function ApplicationReceipt({
  receipt,
  onAnother,
}: {
  receipt: ApplicationReceiptData;
  onAnother: () => void;
}) {
  return (
    <NoteReceipt
      news="Application sent."
      greeting={receipt.greeting}
      line={APPLICATION_LINE}
      about={{ label: receipt.role, icon: Briefcase }}
      excerpt={receipt.excerpt}
      email={receipt.email}
      // The company's story is what a candidate weighs next; /about closes on joining the team.
      next={{ href: "/about", label: "Read our mission" }}
      onAnother={onAnother}
    />
  );
}
