"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { faqHrefFrom } from "@/lib/constants/marketing-nav";

/**
 * THE FOOTER'S FAQ LINK, WHICH FOLLOWS THE READER'S PAGE. The footer draws one index on every marketing
 * route, and this link used to be the home's `/#faq` everywhere, so on /pricing it left the page's own
 * questions (about plans) for the home's. Now a page whose own FAQ is `id="faq"` keeps its readers on it.
 *
 * Only this link is an island, because the pathname is the one thing a server footer cannot read (Next
 * hands it to client components alone) and the rest of the index stays server markup. It is a real link in
 * every state: prerendered with the page's own pathname, so a new tab and a reader without script land on
 * the right FAQ too.
 */
export function FooterFaqLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link href={faqHrefFrom(pathname)} className={className}>
      {children}
    </Link>
  );
}
