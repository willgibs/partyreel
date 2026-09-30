import { EARLY_PRESS_RECORDER } from "@/lib/early-press";

/**
 * THE AUTH PAGES' LAYOUT: what `/login` needs before its scripts have run, and nothing else drawn.
 *
 * ★ A TAP BEFORE THE PAGE'S SCRIPTS RAN IS REMEMBERED (`early-press.ts`), for the controls that opt in with
 * `data-early-press` (Continue with Google, whose whole answer is a handler): the recorder is ~200 bytes,
 * runs as the HTML is parsed, and does nothing for any other click. It is a plain inline <script>, never
 * `next/script`: its `beforeInteractive` inline scripts are pushed onto a queue Next's own bundle runs
 * (`self.__next_s`), which is after the very window this closes. It stands in this group's layout, not the
 * root's, because the sign-in page is the one whose button is drawn open on the server; a page in another
 * group that draws an opted-in control open on the server puts the same script in its own layout, and a
 * control on a page without one simply answers a tap as any button does.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: EARLY_PRESS_RECORDER }} />
      {children}
    </>
  );
}
