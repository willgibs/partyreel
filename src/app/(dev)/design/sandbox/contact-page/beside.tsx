"use client";

import Link from "next/link";

import {
  ContactFacts,
  ContactForm,
} from "@/app/(marketing)/(paper)/contact/contact-form";
import { SUPPORT_EMAIL } from "@/lib/constants/site";

import { stopLinks } from "./pieces";

/**
 * DECISION 6: BESIDE THE FORM. What stands next to it, drawn beside the
 * real `ContactForm`. The three directory entries are page.tsx's own words
 * (Help center / Press / Careers), read straight off it rather than
 * reinvented, because a self-serve door promoted up here is the same door
 * that already sits lower on the page.
 */
export type BesideShape = "facts" | "directory" | "warm";

const DIRECTORY = [
  {
    title: "Help center",
    body: "Guides for every step, from the first QR to the final download.",
    href: "/help",
  },
  {
    title: "Press",
    body: "The boilerplate, the fact sheet, and brand files, ready to take.",
    href: "/press",
  },
  {
    title: "Careers",
    body: "How the team works, and the roles open right now.",
    href: "/careers",
  },
];

export function BesidePreview({ shape }: { shape: BesideShape }) {
  return (
    <div
      onClickCapture={stopLinks}
      className="mx-auto max-w-5xl bg-background p-6 text-foreground"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-6 lg:pt-2">
          <h2 className="font-heading text-prose">Send a note</h2>
          {shape === "facts" && <ContactFacts />}
          {shape === "warm" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-pretty text-muted-foreground">
                No ticket number. Just tell us what&rsquo;s going on.
              </p>
              <ContactFacts />
            </div>
          )}
          {shape === "directory" && (
            <div className="flex flex-col gap-4">
              {DIRECTORY.map((d, i) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="flex flex-col gap-1.5 border-t pt-4"
                >
                  <span className="text-xs font-medium text-faint tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-heading text-sm font-medium">
                    {d.title}
                  </span>
                  <span className="text-sm text-pretty text-muted-foreground">
                    {d.body}
                  </span>
                </Link>
              ))}
              <p className="border-t pt-4 text-xs text-muted-foreground">
                Or write to {SUPPORT_EMAIL} directly.
              </p>
            </div>
          )}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
