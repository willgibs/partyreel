"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Check, Checklist } from "@/components/marketing/help/checklist";
import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import {
  HelpPaletteProvider,
  HelpSearchTrigger,
} from "@/components/marketing/help/help-palette";
import {
  ARTICLE_BODY_ID,
  ArticleToc,
} from "@/components/marketing/reading/article-toc";
import { ChipToc } from "@/components/marketing/reading/chip-toc";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils";

import {
  CodeShot,
  KeepShot,
  NameShot,
  PasswordShot,
  PhotoShot,
  ScanShot,
  WelcomeShot,
} from "./door-screens";
import {
  ARTICLES,
  CATEGORY_CHIPS,
  QUICK_LINKS,
  readingTimeLabel,
  SEARCH_INDEX,
} from "./fixtures";
import { Callout, Step, Steps, stopLinks, UiLabel } from "./vocab";

/**
 * DECISION 3: THE ARTICLE. Prose-with-steps (as shipped), a checklist first,
 * or the door's real screen beside each step, on the guest how-to
 * (`how-guests-join-and-upload.mdx`) AS IT SHIPS since crumbs-3 and crumbs-4
 * told it the lit door and the keep: every word below is the article's, its
 * six steps and its four sections, and the page around them is
 * `help/[slug]/page.tsx`'s stage and chapter. The keep, the door's last
 * screen, is the article's closing callout, so the `screen` option pictures
 * it there, beside the callout, rather than inventing a seventh step the
 * article does not have.
 */
export type ArticleShape = "prose" | "checklist" | "screen";

const ARTICLE = ARTICLES["how-guests-join-and-upload"];

/** A link inside the body, the prose plugin's own underline (the board never navigates). */
function A({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}

const STEPS: { title: string; body: ReactNode; screen: ReactNode }[] = [
  {
    title: "Scan the code, or tap the link",
    body: "Your phone's normal camera app reads the QR code and offers a link; tap it. If the host sent you a link instead, just open it. Any modern phone browser works, on iPhone or Android.",
    screen: <ScanShot />,
  },
  {
    title: "Read the welcome",
    body: (
      <>
        The event&rsquo;s name, who&rsquo;s hosting, and how many photos are
        already inside. Tap <UiLabel>Continue</UiLabel>.
      </>
    ),
    screen: <WelcomeShot />,
  },
  {
    title: "Enter the password, if the event has one",
    body: "Some events add a password from the invitation. It comes before everything else.",
    screen: <PasswordShot />,
  },
  {
    title: "Say what to call you",
    body: (
      <>
        <UiLabel>What should we call you?</UiLabel> Your name goes on the photos
        you add, so the host knows who to thank. You can change it anytime. If
        the host isn&rsquo;t asking everyone to confirm an email, you&rsquo;ll
        also see an optional email field: skip it, or add it so you can come
        back to this album anytime, with every photo you add. Nothing is sent to
        it up front, and only you can see it until you confirm it later.
      </>
    ),
    screen: <NameShot />,
  },
  {
    title: "Confirm your email, if the host asks",
    body: (
      <>
        Some hosts want a confirmed address before the album opens. A one-time
        code by email is the whole sign-in. See{" "}
        <A href="/help/why-an-event-asks-for-your-email">
          why an event asks for your email
        </A>
        .
      </>
    ),
    screen: <CodeShot />,
  },
  {
    title: "Add your first photo",
    body: (
      <>
        The last screen asks for one, right there, so you are not hunting for a
        button once you are in. On most events you can tap{" "}
        <UiLabel>Skip for now</UiLabel> instead; on an event whose host asked
        everyone to add a photo before the album opens, the photo is the way in.
      </>
    ),
    screen: <PhotoShot />,
  },
];

function JoiningSteps({ shape }: { shape: ArticleShape }) {
  if (shape === "checklist") {
    return (
      <Checklist id="help-center-board-checklist">
        {STEPS.map((step) => (
          <Check key={step.title} title={step.title}>
            {step.body}
          </Check>
        ))}
      </Checklist>
    );
  }
  return (
    <Steps>
      {STEPS.map((step) => (
        <Step
          key={step.title}
          title={step.title}
          screen={shape === "screen" ? step.screen : undefined}
        >
          {step.body}
        </Step>
      ))}
    </Steps>
  );
}

/** The article's body, top to bottom, only the Joining steps changing with the shape. */
function Body({ shape }: { shape: ArticleShape }) {
  return (
    <>
      <p>
        There&rsquo;s nothing to install and no form to fill in. Point your
        camera at the code, tap the link that pops up, and you&rsquo;re on the
        event page in your browser.
      </p>

      <h2 id="joining">Joining</h2>
      <JoiningSteps shape={shape} />
      <p>
        The whole thing is one screen that changes, with the album blurred
        behind it, and there is no way around it: the album is what the name and
        the photo are for.
      </p>

      <h2 id="adding-more">Adding more</h2>
      <p>
        Once you&rsquo;re in, <UiLabel>Add photos</UiLabel> is on every screen.
        It opens the same two choices the door gave you,{" "}
        <UiLabel>Take a photo</UiLabel> or{" "}
        <UiLabel>Choose from your album</UiLabel>, and what you pick comes back
        for a look before anything is sent. There&rsquo;s no caption box.
      </p>
      <p>
        Each one appears at the top of the gallery as it goes, with a thin
        progress bar. They upload one at a time: venue wifi is fickle, and one
        file at a time finishes where a burst of twenty stalls. A green check
        marks each one as it lands. You can keep adding as the event goes on,
        and you can come back days later with more.
      </p>
      <p>
        If the host reviews uploads first, you&rsquo;ll see a note saying so.
        Each photo you send waits at the top of the album, dimmed under{" "}
        <UiLabel>Waiting for the host</UiLabel>, until they approve it; only you
        see it there.
      </p>

      <h2 id="if-one-doesnt-finish">If one doesn&rsquo;t finish</h2>
      <p>
        One failure never stops the others. Once the rest are done, a sheet
        lists anything that didn&rsquo;t go, one line per file with the reason
        and <UiLabel>Retry</UiLabel>, and <UiLabel>Retry all</UiLabel> under
        them. There&rsquo;s no cancel button for a file in flight. If you picked
        the wrong one, let it finish, then delete it yourself; see{" "}
        <A href="/help/find-your-uploads-and-events">
          find your uploads, and the events you added to
        </A>
        . The usual causes are in{" "}
        <A href="/help/an-upload-wont-finish">an upload won&rsquo;t finish</A>.
      </p>

      <h2 id="what-happens-to-your-photos">What happens to your photos</h2>
      <p>
        They upload at full quality, exactly as they are on your phone. Location
        data is stripped from most formats before anything leaves your phone;
        see{" "}
        <A href="/help/photo-metadata-and-location">
          photo metadata and location data
        </A>
        . What you can send, and how big, is in{" "}
        <A href="/help/what-you-can-upload">what you can upload</A>. Browsing,
        saving single photos, and the reel are in{" "}
        <A href="/help/browse-the-album">browse the album</A>.
      </p>
      <Callout
        type="tip"
        title="Your photos keep the event"
        screen={shape === "screen" ? <KeepShot /> : undefined}
      >
        <p>
          Every event you add a photo to stays on a dashboard you can come back
          to, once your email is confirmed. The moment your first photo lands,
          the door reopens with the offer: <UiLabel>Confirm your email</UiLabel>
          . It&rsquo;s free.
        </p>
      </Callout>
    </>
  );
}

export function ArticlePreview({ shape }: { shape: ArticleShape }) {
  // /help/[slug] is a (cinema) page: the stage is the dark room whatever the
  // lab wears, and the body is the one paper chapter under it.
  return (
    <div
      onClickCapture={stopLinks}
      className="dark bg-background text-foreground"
    >
      <HelpPaletteProvider
        index={SEARCH_INDEX}
        quickLinks={QUICK_LINKS}
        categories={CATEGORY_CHIPS}
      >
        <section>
          <Container className="pt-10 pb-0 sm:pt-12">
            <div className="relative mx-auto max-w-5xl">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-10 hidden -translate-y-1/3 opacity-30 lg:block xl:right-20"
              >
                <span className="block scale-[2.75]">
                  <CategoryEmblem slug={ARTICLE.category} size="lg" />
                </span>
              </span>
              <div className="max-w-2xl min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href="/help"
                    className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                    Help center
                  </Link>
                  <span className="surface-paper inline-flex">
                    <HelpSearchTrigger variant="compact" />
                  </span>
                </div>
                <header className="mt-8">
                  <span className="surface-paper inline-flex items-center gap-2">
                    <a
                      href={`/help#${ARTICLE.category}`}
                      className="inline-flex"
                    >
                      <Badge variant="secondary">{ARTICLE.categoryTitle}</Badge>
                    </a>
                  </span>
                  <h1 className="mt-4 font-heading text-chapter text-balance">
                    {ARTICLE.title}
                  </h1>
                  <p className="mt-4 text-sm text-muted-foreground tabular-nums">
                    Updated {formatEventDate(ARTICLE.updated)} &middot;{" "}
                    {readingTimeLabel(ARTICLE.words)}
                  </p>
                </header>
                <div className="surface-paper relative z-10 mt-8 -mb-10">
                  <div className="rounded-2xl border bg-card p-5 shadow-lift ring-1 ring-foreground/5 sm:p-6">
                    <p className="text-label font-medium text-muted-foreground uppercase">
                      In short
                    </p>
                    <p className="mt-1.5 leading-7 text-pretty text-foreground">
                      {ARTICLE.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
        <PaperChapter>
          <section className="pt-16 pb-12 sm:pt-20 sm:pb-16">
            <Container>
              <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
                <div className="max-w-2xl min-w-0">
                  <ChipToc headings={ARTICLE.headings} />
                  <article
                    id={ARTICLE_BODY_ID}
                    className="prose mt-8 max-w-none prose-help first:mt-0 prose-headings:font-heading prose-h2:text-prose prose-h3:text-subhead prose-code:font-sans"
                  >
                    <Body shape={shape} />
                  </article>
                </div>
                <aside className="hidden shrink-0 lg:block lg:w-48 lg:self-stretch">
                  <nav
                    aria-label="On this page"
                    className="sticky top-[var(--mkt-rail-top)]"
                  >
                    <p className="text-label font-medium text-muted-foreground uppercase">
                      On this page
                    </p>
                    <ArticleToc
                      headings={ARTICLE.headings}
                      progress={{ targetId: ARTICLE_BODY_ID }}
                    />
                  </nav>
                </aside>
              </div>
            </Container>
          </section>
        </PaperChapter>
      </HelpPaletteProvider>
    </div>
  );
}
