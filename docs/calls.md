# Calls

> **For Will:** the decisions built into Partyreel that you cannot see by using it, where your view of the product may
> differ from the call made. The questions need your answer; every call below them is built and stays unless you change
> it. Answer in one line however you like ("L2: a lapsed pass should keep collecting a week; the rest stand").
>
> **What enters (the test):** a choice that changes what the product does unseen: plans, billing and renewals; an
> event's lifecycle and timing (when something appears, ends, turns or is removed); deletion, retention and privacy;
> safety and moderation policy; what the product does on its own (a message, a pause, a limit). Never a screen, a word,
> a flow, a look or an engineering choice: production and the lab show those, and Will critiques them there. A call is
> three lines at most, its "Change it if" last; this file holds at most 30 entries; an answered one leaves the same day
> (kept: its system doc already holds the fact; changed: a ROADMAP line or a lane). The record adds a lane's call only
> when it passes the test (the runbook's "The calls lab").

## Questions

**X2. Should the limits watch read Vercel with its own token?** Vercel has no read-only token; a token can deploy and delete. Until the app holds one, the new "Plan limits" card is blind to Vercel, the one limit we nearly broke.
- **Recommended:** mint a fresh token scoped to the Partyreel team, one-year expiry, as `VERCEL_USAGE_TOKEN` (non-sensitive until launch, then Sensitive). The cron makes one read with it a day. The app's env already holds keys as powerful (the database's service key, R2's write keys).
- Or: keep Vercel out of the app. A GitHub Action holds the token and posts the numbers in (a workflow and a route to build), or the kit reads it only when an agent runs it.

**X3. A read-only Cloudflare analytics token for R2's operations and the Workers' requests?** `Account Analytics: Read` only: it can't deploy or delete. **Recommended: yes,** as `CLOUDFLARE_ANALYTICS_TOKEN`; the four meters wait for it.

**X5. May an open album's "has anything changed?" answer be cached by the CDN for a few seconds?** That's the single biggest cost lever: 100 lit phones asking costs one call instead of 100. But a cached answer reaches anyone who has its URL.
- **Recommended:** only for an open album at full access, never a password album or a blocked viewer, and the answer is a version number, never photos or links. Not built until you say yes.

**X6. Should the operator be able to lift a host's uploads count?** `/admin/accounts` now shows each host's uploads against her allowance, read-only. A false positive (a bug, a misread meter) would block a paying host with nothing in `/admin` to lift it.
- **Recommended:** before launch, an audited credit: a reason, your second factor, a bounded amount, logged in `admin_actions`. Never a reset of the ledger, which the spend watch also reads. It's a migration, so a follow-up lane on your word.

**X1. A Disposable's develop time when the date comes later.** Create now asks the style. With no date yet, a Disposable develops at 9 am tomorrow, and that time never follows a date added later, so a party weeks away would develop before it starts. The row says the time plainly, but it's easy to miss.
- **Recommended:** when you set or move the date, an untouched develop time that falls before the party ends moves to the morning after (9 am, your zone). A time you chose yourself never moves.
- Or: ask the date in Create, or put a "morning after" shortcut beside the row.

The nine below came from the walk of the whole app on 2026-10-07 (`app-gaps-r1`): product decisions only you can make,
each cheapest now, since every lane that ships adds to today's answer. Ordered by what they would reshape decided late.

**X9. Who can act for an event?** Today one account owns and runs each event: no co-host, no helper for the night, no
hand-over (`events.host_id` is the only owner, assumed by 121 checks in 39 migrations, and the planners post says so in
public). Nearly every wedding has two hosts, and Pro's sizes are sold as a planner's year and a venue's year.
- **Recommended:** co-hosts invited by email, acting for the event as the owner does (Review, the door, Settings,
  Share), while billing, storage, the plan and deleting the event stay the owner's; handing an event to another account
  waits for X14.
- Or: one owner for good, with a read-only link for a partner; roles per event (owner, co-host, a night helper who runs
  only Review and the door); hand-over now.

**X10. What is inside an event, and what does one pass buy?** An event is one stream with one reel, one folder and one
roll, so a wedding weekend is either one undivided album or several paid events (a competitor sells sub-albums).
- **Recommended:** day dividers drawn from the dates and the capture times, display only (no schema, no price change),
  now; named chapters or linked events only when hosts ask.
- Or: chapters she names, each with its own reel and folder; a weekend grouping several events under one link and one
  pass.

**X11. Who may Partyreel contact, and for what?** Account says "Your guests never hear from us" and help promises no
"album is ready" mail, yet the ROADMAP plans a guest's develop and let-in mails; and a host hears nothing when her
event goes live, when someone waits at her door while she is away, or when the album develops.
- **Recommended:** a host's email for her event's moments (a receipt with the code and the print link, a quiet alert
  for the door and Review while she is away, a morning-after recap); a guest hears from us only when she asks at the door
  ("Email me when it develops"), once, never marketing: "never" becomes "only when you ask".
- Or: hosts only, guests never; web push for hosts through an installed app; messages the host writes, sent once.

**X12. Does the album hold words?** It holds photographs and videos alone: no caption, no note, no guestbook, though the
guestbook is a wedding staple and competitors include one.
- **Recommended:** a guestbook as its own kind (a short note, a voice memo or a video message to the hosts), in a room of
  its own and at the reel's end, moderated in Review like any upload; no captions or comments on photographs, so the
  album stays the pictures.
- Or: never, as part of the identity; an optional one-line caption at send; comments and reactions.

**X13. Will a guest ever see Partyreel in her own language?** Everything is US English, written inline in about 260
files, and the cost of translating grows with every string.
- **Recommended:** English at launch, with the guest's journey (the door, the album, the camera, the reel) made
  translation-ready now (a string catalog, dates and plurals by her locale); the host's app later.
- Or: English only for good, said plainly; three to five languages at launch, by the phone's setting; the host picks
  the album's language.

**X14. Is the professional host (a planner, a venue, a photographer) a launch target?** Pro's sizes are sold for them,
but nothing exists for them: no hand-over, no partner mark, no templates.
- **Recommended:** not at launch: Pro's sizes say what they hold instead, and the professional is decided with X9's
  hand-over after launch.
- Or: the minimum now (roles, hand-over, templates); a partner's mark on the guest page, the prints and the reel as a
  paid lever; a host theme.

**X15. Will Partyreel ever find a guest's photos by her face?** Selfie search is becoming a premium default among
competitors, but it is biometric data (Illinois' BIPA, the GDPR's special category).
- **Recommended:** never, said as a privacy feature, with ways to find a photograph that need no face (by day, by who
  sent it, videos, likes).
- Or: opt-in selfie search per album through a vendor, deleted with the event; tagging yourself; decide later, promising
  nothing meanwhile.

**X16. Prints or a book?** Export is the only way out today; a competitor sells photobooks.
- **Recommended:** not before launch; after it, a print partner built on the host's picks.

**X17. What does a follow do before the feed exists?** Nothing reads follows until the after-launch feed
(account-moments r2 asks how a follow feels; this asks what it is for).
- **Recommended:** keep Follow as a private list (whom she follows, on her page) and say so; its payoff is the feed.
- Or: hide Follow until the feed ships.

## Plans and billing

**L2. An Event Pass is one year, paid once.** She is reminded before it ends (unless she turned Event Pass reminders
off), and a renewal at the cheaper price extends from the end of the year she holds, only while it is still active.
When the year ends the account becomes Free: nothing is deleted, but her albums stop taking uploads, hers and her
guests', until she renews (AJ1, AR5).
- *Change it if* a lapsed pass should keep collecting for a grace period, or a renewal should happen by itself.

**R1. A plan that ends over its storage.** She gets 45 days of grace with reminders; at the deadline what she already
deleted leaves for good first, then her largest files move to Deleted (30 days to recover) until she is under the cap,
with no small overage forgiven.
- *Change it if* a small overage should be forgiven, or nothing should move without her.

**AH1. Every plan, Free included, can send to Google Drive.** It costs us about $0.0003 a GB and is the honest way out;
once Free has it, the rule that a marketed number only moves up keeps it there.
- *Change it if* Drive should be a paid feature: decide before it goes live with milestone 39.

## An event's life and timing

**K5. A Free event idle for six months is removed.** Warned two weeks out, then moved to Deleted (30 days to recover);
any use of her account, the event's own dates or a new photo resets the clock; Pro and Event Pass albums never.
- *Change it if* a Free album should never be removed (events otherwise never expire), or the clock should be longer.

**G3. The get-ready checklist** stays atop an event until it is done or until the day after the event's date; it is
only advice, blocks nothing and guests never see it.
- *Change it if* it should stay until done, whatever the date.

**AY1. When an album turns.** After its party an album turns from newest first to the order things happened; the live
demo and an album with no date never turn, which is every new album until its host adds a date (Create asks none).
- *Change it if* an undated album should turn too (her own "In order now", or Create asking a date).

**AB5. How live an open page stays.** Where the live line is blocked an album asks for news every 12 seconds, slowing to
a minute when quiet; past two untouched hours it stops asking until a touch; a party screen rests at 5 minutes, its
doorbell still instant.
- *Change it if* a long-open page should keep asking (each ask is a call on every open phone).

**CC4. A host's removal spends a guest's shots,** as her own take-back does: a guest whose host removed five of her 24
can take only 3 more.
- *Change it if* a host's removal should give the guest her frames back.

## Deletion, retention and privacy

**I7. Leaving Partyreel** keeps her photos in other people's albums unless she ticks "Also remove…".
- *Change it if* leaving should take her photos by default.

**R2. A guest's "remove my photo" leaves for good that night** on every album, where a host's own delete waits 30 days
in Deleted.
- *Change it if* a guest's removal should wait 30 days too.

**J5. An open report pauses deletion:** a reported album cannot be permanently deleted until the report closes, whatever
its date in Deleted, and our evidence copy stays.
- *Change it if* a host's own deletion should always finish on time.

**AH4. A copy in a host's Google Drive stays hers after a takedown:** we delete nothing in her Drive, and our access
reaches only the files we made.
- *Change it if* you want an audited "Delete our copy from her Drive" before launch.

**CG6. No Follow is offered across a block, either way,** so a person can infer that someone blocked them, though the
page never says which side.
- *Change it if* Follow should stay offered and fail quietly, keeping every block invisible.

## Safety, and the product acting on its own

**J2. The instant hide** (a report that hides a photo at once): one address can hide 3 items a day, one event can lose 5
a day, and a host never triggers it on her own event; when you dismiss the report, the photo comes back (J4).
- *Change it if* the limits feel off, or a hidden photo should stay down until you look.

**J3. Strikes:** every dismissed child-abuse report counts against its reporter, even one that hid nothing, and the
third dismiss needs no extra confirm.
- *Change it if* only reports that hid something should count, or the third should ask.

**M1. The spend watch** checks our usage daily (hourly at launch) and alerts you past ten times the week's busiest day;
on its own it pauses only reminders, Download all, Drive and the nightly cleanup until a person lifts it. Uploads only
alert (M2: a false alarm must never stop a party), beside your one-press switch that stops guests' uploads.
- *Change it if* ten times is too loose, a pause should lift itself, or a runaway album should stop itself.
