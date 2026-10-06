# Calls lab

Only what still needs you lives here: the questions first, then every call that is built and stays unless you push back. Answer in one line however you like ("F sounds good; G2: I'd rather…; Q3: option 2"). An answer leaves the lab the moment it is routed (to a lane, a board on your desk, or one ROADMAP line), so nothing here is a record: a call you don't mention stays as built, and anything built stays open to a better idea.

---

Every call about how something looks or moves has moved to the lab (your word, 2026-10-04): what remains here is behaviour, policy, data and wording.

## Questions

**X2. Should the limits watch read Vercel with its own token?** Vercel has no read-only token; a token can deploy and delete. Until the app holds one, the new "Plan limits" card is blind to Vercel, the one limit we nearly broke.
- **Recommended:** mint a fresh token scoped to the Partyreel team, one-year expiry, as `VERCEL_USAGE_TOKEN` (non-sensitive until launch, then Sensitive). The cron makes one read with it a day. The app's env already holds keys as powerful (the database's service key, R2's write keys).
- Or: keep Vercel out of the app. A GitHub Action holds the token and posts the numbers in (a workflow and a route to build), or the kit reads it only when an agent runs it.

**X3. A read-only Cloudflare analytics token for R2's operations and the Workers' requests?** `Account Analytics: Read` only: it can't deploy or delete. **Recommended: yes,** as `CLOUDFLARE_ANALYTICS_TOKEN`; the four meters wait for it.

**X5. May an open album's "has anything changed?" answer be cached by the CDN for a few seconds?** That's the single biggest cost lever: 100 lit phones asking costs one call instead of 100. But a cached answer reaches anyone who has its URL.
- **Recommended:** only for an open album at full access, never a password album or a blocked viewer, and the answer is a version number, never photos or links. Not built until you say yes.

**X6. Should the operator be able to lift a host's uploads count?** `/admin/accounts` now shows each host's uploads against her allowance, read-only. A false positive (a bug, a misread meter) would block a paying host with nothing in `/admin` to lift it.
- **Recommended:** before launch, an audited credit: a reason, your second factor, a bounded amount, logged in `admin_actions`. Never a reset of the ledger, which the spend watch also reads. It's a migration, so a follow-up lane on your word.

**X8. Six style picks held as tests: keep them as house rules?** Of the 26 policy tests (the ones that scan the code for a rule), 21 guard a real trap (security, cost, a framework or browser bug, data integrity, accessibility) and need nothing from you. Five hold six past style picks: no em dash in code or in the help and blog (`no-em-dash-policy`, `content-policy`'s first check); "business day" never promised (`content-policy`); one weight for the heading face (`type-ladder-policy`'s last check); every pointer to the demo through its door (`demo-door-policy`); the record's depth: no changelog, STATUS under 80 lines, CLAUDE.md under 150 (`record-depth-policy`); and marketing never saying guests need "nothing but their phones" (`content-policy`'s last pattern).
- **Recommended:** keep the first five as house rules (each costs a deliberate exception at most, and changing a pick stays one edit); let the sixth go, since it reads a line that sells the feeling truthfully as a literal inventory (the inbox a guest confirms with is on her phone), against your marketing principle of 2026-10-04.

**X1. A Disposable's develop time when the date comes later.** Create now asks the style. With no date yet, a Disposable develops at 9 am tomorrow, and that time never follows a date added later, so a party weeks away would develop before it starts. The row says the time plainly, but it's easy to miss.
- **Recommended:** when you set or move the date, an untouched develop time that falls before the party ends moves to the morning after (9 am, your zone). A time you chose yourself never moves.
- Or: ask the date in Create, or put a "morning after" shortcut beside the row.

---

## F. Create

Making a new event, now a dark room of its own; its polish is create-wizard r4's, on desk 7.

**F3. A sample code until you press Create.** The code pictures say they're samples, and the link reads "partyreel.com/e/…", since no link exists yet.
- *Push back if* you want the real code sooner, by making the event earlier.

**F4. A phone's Back leaves Create.** The Back in Create's head steps through its screens.
- *Push back if* the phone's Back should step back one screen.

## G. The hub and its rooms

Your event's own page: its checklist, its rooms and its reel.

**G3. The get-ready checklist.** It stays atop the event until done, or until the day after its date. It's only advice: guests never see it, it blocks nothing, and your own test scan counts as the code's first open.
- *Push back if* it should stay until done, whatever the date.

**G5. Your guest-page uploads count as yours.** Photos you add from your own album's guest page go straight in, even where guests wait for review, credited to you.
- *Push back if* they should wait like a guest's.

## H. Dates and the dashboard

Multi-day events and the dashboard, under your rule that a date never ends an event.

**H1. Create never asks a date.** So an undated album counts as "Live today" on any day photos land, which is every new host's case.
- *Push back if* Create should offer a date, and maybe an end date.

**H2. Multi-day events.** A tile says "Day 2 of 3" while it runs. The stage counts down to the first day and dates the past from the last, so the day after a weekend reads "Yesterday". A develop defaults to 9 am after the last day.
- *Push back if* you'd rather see dates, count from the first day, or develop at another hour.

**H4. How times are said.** "Live tonight" from 5 pm, then "Yesterday", never "Last night". A develop says "tomorrow at 9 am", then the weekday, then the date.
- *Push back if* any of these reads off.

**H5. US English dates everywhere.** Dates print the American way for everyone ("October 3").
- *Push back if* hosts abroad should see their own style.

## I. Accounts and profiles

A person's own account and page: names, credits, follows and leaving.

**I1. Nobody can pose as Partyreel.** A display name is refused when it's the brand in any spelling, alone or with a staff word ("Partyreel Support"); "Sam Partyreel" stays allowed.
- *Push back if* any use of the name should be refused.

**I2. Your uploads say "You".** In Your uploads, photos at your own events are credited "You" with your face.
- *Push back if* you'd rather see your name, as the byline reads.

**I3. She hears when you let a photo in.** If you approve or restore her upload after she's left, she's told once on her next visit.
- *Push back if* she should be told some other way.

**I6. The newsletter follows the person.** A changed email moves her sign-up to the new address, since the consent is hers, not the inbox's.
- *Push back if* the old address should stay on the list.

**I7. Leaving.** Her photos in other people's albums stay unless she ticks "Also remove…". The screens say "erased", and the done screen stays until she leaves it.
- *Push back if* leaving should take her photos by default, or "deleted" is plainer.

## J. Reports and safety

How reports, the instant hide and your three strikes work.

**J1. Six kinds of report.** A child in sexual or abusive content; nudity or sexual content; violence, a threat or hate; someone's private details; me or my child, and I want it down; something else. The first two arrive covered; only the first hides at once.
- *Push back if* the list or its order is off.

**J2. Limits on the instant hide.** One address can instantly hide 3 items a day, one event can lose 5 a day, and a host never triggers it on her own event.
- *Push back if* those limits feel off.

**J3. Strikes.** Every dismissed child-abuse report is a strike, even one on a whole album or whose hide a limit refused. Your queue shows each address's strikes, and the third Dismiss needs no extra confirm.
- *Push back if* only reports that hid something should count, or the third deserves a confirm.

**J4. A false hide comes back.** When a report is dismissed, the hidden photo returns; anything held for forensics stays down.
- *Push back if* it should stay hidden until you look.

**J5. Open reports pause deletion.** A reported album can't be permanently deleted until the report closes, whatever its bin date. A host's block still clears that guest's photos, and our evidence copy stays.
- *Push back if* a host's own deletion should always finish on time.

**J6. Reporters keep their privacy.** For a child-abuse report we keep a scrambled stamp of the reporter's address, never the address. Confirming an email on the form makes a free account that claims nothing, and proof is asked in words, never pictures.
- *Push back if* a report should never create an account.

**J7. A phone can't close a report.** On a phone, Take it down leaves the report open for your desk; Hold for forensics is one press.
- *Push back if* you want to close reports from a phone.

## K. Privacy and deletion

What we strip, show and keep about people, and how things leave.

**K1. Location stripped from every format.** Every photo and video format now has its location stripped in the browser, iPhone photos included, except a file too damaged to read safely, which uploads as sent.
- *Push back if* such a file should be refused.

**K2. Locked albums don't preview.** A shared link to a gated album unfurls as a plain card; a password album shows only its name.
- *Push back if* you want the cover in link previews.

**K3. Sign-in can reveal a deletion.** While an account is being erased, the sign-in screen says so for that address, which our sign-in system already reveals anyway.
- *Push back if* that screen should stay generic.

**K4. The welcome is remembered for a year.** A phone remembers seeing an album's welcome for a year, and the privacy page will list it.
- *Push back if* a year is too long.

**K5. Honest about idle Free albums.** Every line saying an album stays up now adds that an idle Free album is removed after about 6 months, with a warning first.
- *Push back if* that scares visitors more than it informs them.

## L. Plans and billing

The edges of a plan; the ladder itself is PRICING.md's (Ladder A).

**L1. Paying twice by mistake.** With two subscriptions from two checkout tabs, the account follows the bigger plan and we're warned the other still bills. Deleting the account cancels both; your walk passed.
- *Push back if* we should cancel the duplicate automatically.

**L2. A pass "covers" a year.** When it ends the account goes to Free, and nothing is deleted then.
- *Push back if* "covers" undersells it.

## M. Spend guards and the admin

Our own bills kept safe, and your operator's side.

**M1. A spend watch.** It checks our usage daily (hourly at launch) and alerts you past 10 times the week's busiest. On its own it pauses only repeat reminders, Download all and the nightly cleanup, until a person lifts it.
- *Push back if* 10 times is too loose, or a pause should lift itself.

**M2. Uploads only alert.** A false alarm must never stop a real party, so uploads only alert, with a one-press switch in your admin that stops guests' uploads, never yours.
- *Push back if* a runaway album should stop itself.

**M3. Admin pacing.** The urgent-report email waits ten minutes after that album's last one, and admin pages load on click, a beat slower, far lighter.
- *Push back if* every urgent report should email at once.

## N. The public site

partyreel.com's marketing pages and their words.

**N1. "No app required for your guests."** Event pages now close on this, since the old "nothing but their phones" wasn't true where an album asks for an email.
- *Push back if* you prefer "Guests join with one scan." or "Guests need only a phone and an email."

**N2. "Unlisted by default."** It replaced "Private by default", and pricing's "Password lock" row now reads "Every gate".
- *Push back if* "Unlisted" reads too technical.

**N3. We name the instant hide's exception.** The privacy pages and About say every report is reviewed, and only a child-abuse report can hide anything first.
- *Push back if* marketing shouldn't mention it.

**N5. Broken links get a friendly page.** A dead album link or unknown profile shows its own screen, kept out of search, but tells browsers "found", since our host otherwise swaps in a plain error page.
- *Push back if* a true "not found" is worth slowing every album load a little.

**N6. The contact page.** No per-topic reply times, just the one promise we keep. The receipt greets a first name, and press links go to About's press section.
- *Push back if* you want reply times per topic.

**N8. Lighter pages, a slower tap home.** The home link loads ahead only when pointed at, so other pages are lighter, but a tap home on a phone can take up to a second.
- *Push back if* that tap matters more.

## O. Your design desk

How the lab shows you boards.

**O1. Pictures first.** Frames open scaled to fit, with a board's notes tucked into one About panel. Each question shows a thumbnail of the option it opens on, and you can reopen an answered one.
- *Push back if* you miss the notes in view, or want every option thumbnailed.
- *Judge it live* at your next sitting: it is the desk you use, so it is answered there, never drawn.

**O2. Frames act like real phones.** A phone-width board gets the phone's layout even on your wide screen, without giving each board its own page. Drawn links still load their real pages quietly; making drawings inert is one more line.
- *Push back if* any board still looks off, or you want drawings inert.
- *Or instead:* a page per board, at a reload per switch.

## P. Small fixes from the live walks

Low-stakes choices made fixing what the live red-team walks found.

**P1. Early presses.** A form pressed before the page is ready does nothing, but a Google tap is kept for 5 seconds and typing is kept.
- *Push back if* any of these should behave differently.

**P2. No tooltips on a tap.** A hover or the keyboard still opens them; this fixed dead taps on Android.
- *Push back if* phone users need those hints.

**P3. Plain words in small places.** "Done" where nothing can be retried; "Liked 3 items"; a restore names what stays in Deleted; "Everything else is waiting for approval"; "28 photos".
- *Push back if* any of these reads wrong.

**P4. Your upload limit shows to guests.** Your per-file limit ("up to 100 MB each") appears on a guest's Add sheet, as the refusal already said.
- *Push back if* it should stay out of guests' sight.

**P5. Small gaps left open.** Safari can't search inside a closed FAQ answer; a rare, mild reload after a fast reel switch; the Add button settles just after load.
- *Push back if* any of these should be fixed before launch.

---

## R. Deleted counts in storage

**R1. A plan that ends over its cap.** If a plan ends while you hold more than its storage, you get the 45-day grace as before. At the deadline, what you already deleted leaves for good first, and only then do your largest files move to Deleted. One change: an account still just over at its deadline, say 5% over, is now brought down to the cap. Before, it was let off inside a 10% margin.
- *Push back if* a small overage at the deadline should still be forgiven.

**R2. A guest's "remove my photo" leaves that night on every album.** Before, only a disposable camera's shot did; elsewhere it sat 30 days in Deleted on no one's plan.
- *Push back if* a guest's removal should wait 30 days, like a host's own delete.

---

## S. Your events and the lit stage (dashboard-wiring, on build 53)

**S1. "Last opened" and Recent count every visit to your event's page.** A press from the dashboard, a link from the bell or an email: one stamp per event, at most once a minute. A guest album you opened isn't in Recent.
- *Push back if* only the dashboard's presses should count, or opens should stay on this device only.

**S2. Display shows from your second event, or whenever Deleted holds one,** so Restore is always reachable.
- *Push back if* it should hide at one event, as drawn.

**S3. The Display badge counts every choice you changed, cover size included, and Reset undoes them all.** Recent's own Hide is left alone.

**S4. On a party's day, before any photo lands, the stage shows its counts** (guests, at the door, to review) where the steps rail was. The lamp brightens from the week before through the day.

**S5. Back keeps your layout:** this tab remembers your last choice, and your search for ten minutes.
- *Push back if* Back should show the page as it first loaded.

---

## T. The hub's strip and your reel before the develop (hub-strip-wiring, on build 53)

**T1. Before the develop, your reel plays over your own hub** (your Reel card's press), in the guests' own player: Style and Set for everyone are there. Play on a screen, Make your own and Add yours aren't, since only you can open your hub. The guest page, even yours, shows no reel until the develop.
- *Push back if* you'd rather preview it on the guest page.

**T2. After the develop, the card opens the guests' view, as today.**

**T3. The card says "Guests get it later".** "Guests get it at the develop" was cut off at every width; a wider tile is the doors' redraw.

**T4. The line under the title keeps the date, guests, views and Live;** only the album glyph left (the strip's end now says the count).
- *Push back if* you want the bare cover as drawn.

**T5. The strip's newest marks stay lit for a quarter hour** after a photo lands, then rest.

---

## U. Red-team 52's fixes (crumbs-64, on build 53)

**U1. Switching to a smaller Pro size never blocks, it just tells you.** On that size's card: "You've uploaded 150 GB this month. At 100 GB a month, new uploads, yours and your guests', would pause until November 1."
- *Push back if* it should ask you to confirm.

**U2. On a phone, a tap on a pricing row name opens its fine print;** a second tap, a tap outside, a scroll or Escape closes it.

**U3. At a desk, a click that lands within 0.6 s of the mouse move that raised the reel's controls keeps them up** (it was aimed, not a choice to hide them).

**U4. For a Pro host the plan sheet's first open waits quietly (up to 6 s) until your plan is known,** instead of offering Switch on your own size.

---

## V. Cancels, dropped connections and name-only colours (small-fixes, on build 53)

**V1. A download's x asks only when something is in flight:** "Cancel this download?" while a part is being prepared, and "Stop after part 1 of 3?" between parts. A cancel ends calmly ("Download cancelled.", with Try again); a stop past part 1 keeps Get part 2.

**V2. Telling a cancel from a dropped line is a best guess:** if the page lost touch with the server while the zip streamed, it says "Your connection dropped. Check your signal, then try again."; otherwise it reads as your cancel.

**V3. An upload whose bytes stop moving for 45 s ends as a dropped connection** instead of sitting at its percentage forever. Uploads still have no cancel button (a later line).

**V4. A name-only guest's colour comes from her own guest row,** in the list, the album's credit and her own header. An account colours her only once its email is confirmed.
- *Push back if* an unconfirmed account should already colour her.

---

## W. Graphite (graphite-wiring, on build 53)

**W1. The "edge light 40%" you picked lights the graphite pop-outs themselves;** the photographs' bright edge stays at 30% until identity r4's edge ask is answered.
- *Push back if* you meant the photographs' edge to rise in the dark room too.

---

## Y. The develop's arrival (arrival-wiring, on build 53)

**Y1. The develop plays once per phone, for the guest who waited the night on it.** A first open that came through the door, or straight to the reel, spends it unplayed.
- *Push back if* it should wait behind the door and play as she's let in.

**Y2. The still sheet waits at least 0.7 s, then plays once the first screen's pictures are ready, or after 3 s with whatever landed** (a slow link plays with dark squares rather than holding the album). Squares below the fold develop unwatched.

---

## Z. Red-team 53's fixes (crumbs-65)

**Z1. A camera shot that failed for want of a connection says "Your connection dropped. Check your signal, then try again."** with Retry, instead of "2 shots didn't send." (an answered error keeps the count).
- *Push back if* you'd keep the count with the sentence under it.

**Z2. A name-only guest's header disc waits up to 2 s for her colour, then fades in;** later loads paint it at once (her colour is remembered on that phone).
- *Push back if* you'd rather see the plain disc cross-fade into colour.

---

## AA. Plan limits (limits-watch)

**AA1. Supabase's limits are watched at Pro's numbers** (8 GB disk, 100,000 monthly users, 250 GB egress), since the Partyreel org is on Pro. Egress and Realtime messages read "Not wired": a Supabase access token could delete the project, so none is held.

---

## AB. Compute, the first fixes (compute-levers; a heavy wedding's calls down 66%)

**AB1. Signed-in pages keep their link prefetches through the proxy** (a prefetch that refreshed a session in a render would lose the rotated token and sign her out); every other prefetch left.

**AB2. On wifi that blocks the live connection, an album polls every 12 s, then every 60 s after a quiet minute,** and back to 12 s the moment anything changes.

**AB3. A touch on a resting album asks at once only if its last ask is over a minute old.**

**AB4. A party screen (`?reel=screen`) rests at 5 minutes but never stops;** the doorbell still rings instantly.
- *Push back if* screens should keep the full minute (12 calls an hour more each).

**AB5. Past two untouched hours an open page stops asking;** its photo links renew on the next ring or touch (a tile may redraw once).
- *Push back if* you'd rather it ask once an hour to keep every link alive.

---

## AC. Uploads in bursts (compute-uploads; a guest's ten photos 59 calls to 17)

**AC1. A burst's landed photos are recorded together:** when its last file has gone up, 10 s after the first landed, or at once if she leaves the page. Her own tiles show at once; others see them up to 10 s later than today.
- *Push back if* others should see each photo the moment it lands (more calls on a slow phone).

**AC2. A burst is at most 20 files and 1 GB,** and no file name leaves the phone at presign.

---

## AD. Uploads this month (uploads-meter-ui)

**AD1. The storage ring's popover says "Uploads this month: X of Y"** for Free and Pro, read only when you open it. It takes the warning tone only at or past the allowance: "New uploads, yours and your guests', are paused until November 1. Deleting doesn't lower the count."

**AD2. A pass holder's popover says nothing about uploads** (a pass counts its year on the pass itself).
- *Push back if* a pass should show its year's uploads too.

---

## AE. Stopping an upload (upload-cancel)

**AE1. A guest's stack asks "Stop this upload?" on its toast; the host's batch row asks in the row.** Either way it then reads "Upload cancelled." with Try again, never red.

**AE2. The x shows only while a file's bytes are going up;** a stop that comes too late says nothing and the file lands.

**AE3. A stopped guest file leaves her queue** (no failure sheet); its Try again lives on the 8 s toast.
- *Push back if* a stopped file should stay listed with its Try again until she clears it.

---

## AF. Jobs that fail loudly (crumbs-75)

**AF1. A one-time notice that fails to send is retried every night for 30 days.** It covers an idle Free album removed, a grace opened and a plan reduced; after 30 days it is given up and recorded, and /admin/jobs counts what waits.
- *Push back if* it should retry until the account goes, or you want a Drop button on /admin/jobs for a stuck one.

**AF2. A late notice goes only while its news is still true.** A removal notice only while her album is still in Deleted, a grace notice only while the grace stands and she is still over her limit; otherwise it is let go quietly. A plan-reduced notice always goes, since it says what was done.
- *Push back if* a late notice should go anyway.

**AF3. A download with no ending reaches your bell after six hours.** Only a download our Worker started or checked counts, so a local test download never rings it; it reads "Needs a look", not "Last run failed", since nothing threw.
- *Push back if* every download with no end should count, or it should read "Last run failed".

**AF5. Deleting several albums at once goes one album at a time, in a fixed order,** so overlapping nightly purges can't deadlock with the album-log prune; a very large account's purge may take more than a night.
- *Push back if* one batch call should do it (a migration).

---

## AG. The guest's upload counts and words (crumbs-76)

**AG1. The failure sheet counts the run's own files.** A Retry that fails again reads "1 of 1 didn't upload", never "1 of 0"; with one of three failed files retried, the sheet still heads "2 of 3", since it continues that go.
- *Push back if* it should count only the files going this time (the first would read "1 of 1" over two other lines).

**AG2. The sheet speaks of the rest only where something else went.** "Everything else is in the album" shows only when the run sent more than failed. A file the album refuses for itself (a wrong type, one too big, a video where the album takes none) offers no Retry, just "Pick something else to add." ("Take another to add one." at a camera album).

**AG3. A camera held open over a closed or full album asks again by itself.** At 10 s, then 20, 40 and every minute, so it frees itself within a minute of the host reopening uploads; the cost is at most one small call a minute while it is open.
- *Push back if* the album should tell the camera instead (its live update would carry "accepting uploads", a migration).

**AG4. The host on her own guest page of a Disposable album sees her uploads as a guest does.** The round Your uploads button beside Add shows "Sending" then "Developing", with no Remove (her hub takes hers back).
- *Push back if* she'd rather see a one-line note under Add.

**AG5. A camera album's door offers the album's camera alone for the first photo.** One "Take a photo", no picker, no terms line, wherever the host chose the camera (never in the demo); the camera stays open after her first shot lands.
- *Push back if* a camera album's door should skip that step and drop her into the album, whose own Add opens the same camera.

**AG6. The ask to confirm her email and keep her photos waits for her whole burst.** It comes once nothing is queued or in the air, with the full count, where it used to rise at the first group and say five over six files still going.

---

## AH. Send to Google Drive (drive-wiring)

Built as you picked on desk 2; these are the lane's own further calls.

**AH1. Every plan, Free included, can send to Drive.** It costs us about $0.0003 a GB (a 25 GB album, two cents) and is the honest way out.
- *Push back if* Drive should be a paid feature, and before it ships: our rule that a marketed number only moves up keeps it on Free once it is there.

**AH2. Several albums are sent from one list beside Display on Your events,** not checks on the tiles the board drew, so it reads the same over the gallery, table and list, and a host with 200 albums picks from rows.
- *Push back if* you want checks on the tiles.

**AH3. Drive names each copy by when it was taken,** or, for a file that kept no time, by when it reached the album; Drive's own sort agrees, so an album sent the morning after sorts as the night happened. The time is kept, never the place or the device (your X7).

**AH4. A copy already in a host's Drive stays hers after a takedown.** We delete nothing in her Drive, and our access reaches only the files we made.
- *Push back if* you want an audited operator act, "Delete our copy from her Drive", built before launch beside the takedown runbook (a deferred line today).

**AH5. Two guards bound Drive's volume.** A host whose sends reach the larger of 10 times her plan's storage or 5 GB in 30 days is stopped (unpublished; a real host can't meet it), and the spend watch pauses Drive for everyone past the larger of 10 times the week's busiest day or 1 TB. Paused sends wait and lose nothing.
- *Push back if* those numbers feel off.

**AH6. Disconnecting forgets our key first, then asks Google to revoke (three tries).** Google not answering never keeps a key here. Deleting an account disconnects at the request and again just before the deletion.
- *Push back if* we should hold the key until Google confirms the revoke.

**AH7. An operator's cancel, pause or disconnect mails the host nothing.** Her album says "We stopped this send" or "Sending stopped on our side".
- *Push back if* she should be emailed.

**AH8. Drive's strip, flag and bell row show only on a browser that has connected or sent from Drive.** A remembered hint lets those pages ask for status, so a host who never uses Drive costs no polling; a stop that needs her still mails her once, on any device.
- *Push back if* the flag must show on every device (every signed-in page would then poll Drive).

---

## AI. The help center and the blog (help-words)

**AI1. The live demo has its own help article, first in Getting started.** "Try the live demo" is tagged for hosts (its reader is a would-be host standing where a guest stands) and prints the demo's address, sending her to the home page and How it works for the real doors instead of carrying one itself.
- *Push back if* it belongs elsewhere or should carry a real demo door (a deferred follow-up).

**AI2. Each article is tagged by who it helps.** A shelf's default is now what most of its articles help (both, for Account and Highlight reel). Hosts only: notifications and emails, Play the reel on a screen, reporting and safety. Both: what guests can and can't see, what you can upload.
- *Push back if* any article should be tagged the other way.

**AI3. The sharing section follows take-home.** Its chips say Download and Select, its subhead reads "The originals come back exactly as they went in" (it was "Downloads are the original files"), since Phone size is a named lighter copy, and "phone size" is named in its copy and FAQ.
- *Push back if* any of that reads wrong.

**AI4. The blog's "Require verified emails" now reads "An email first",** as Settings says (ten posts). Two stale help facts were fixed too: an account's email can be changed, and the Highlight reel card's "Guests get it later" face is described.
- *Push back if* the blog should keep the old switch name.

---

## AJ. A lapsed Event Pass and Pro credit (billing-locks)

**AJ1. A host whose pass lapsed reads the allowance's words when she uploads,** until the nightly recompute moves her to Free (a day at most): "You've hit this plan's upload limit for now.", and a guest reads "This album has hit its upload limit for now." Her Plan card says the pass ended.
- *Push back if* she should read the cause instead: "Your Event Pass has ended. Renew it to keep collecting." (a new reason and one host-only case; the guest's words unchanged).

**AJ2. /admin/accounts says a lapsed pass plainly.** The list reads "Pass lapsed" with the day it ended and "Uploads refused", the row tinted as an account at its limit; the account page says when it ended and what lifts it. A pass turned into Pro credit before her Pro plan lands reads "Pro pending".
- *Push back if* those words read wrong.

---

## AK. Moderation feed and error reports (crumbs-78)

**AK1. Your moderation feed draws previews, not originals.** About 1.5 MB for the sixty tiles it showed, where it loaded about 21 MB; the original appears only where a row has no preview.
- *Push back if* the feed should show originals.

**AK2. A person report now records that its reporter was signed in.** Reports filed before keep reading "Signed-out guest" in your queue until closed; they are pre-launch test rows, so nothing was backfilled.
- *Push back if* the old ones should be corrected.

**AK3. Sentry now tells the two crash screens apart:** a page crash reports as render:root and the last-resort screen as render:global. A Sentry alert you keyed on render:global for the page-crash screen needs render:root beside it.
- *Push back if* both should report as one.

---

## AL. Uploads on a bad line (uploads-idempotent)

**AL1. The next permission request goes out as a file hands off its last byte,** so on a quick line the idle gap after the first photo drops from 875 ms to between 2 and 137 ms. The cost is one extra request a burst (3 where it was 2); slow lines and small photos see no change.
- *Push back if* 0.9 s isn't worth the extra request.

**AL2. A request that hangs ends as "Your connection dropped. Check your signal, then try again."** The permission request gets 30 s and the step that records the photos 60 s (each clock restarts when she returns to the page), then the file ends with Try again, never a spinner.
- *Push back if* those limits feel off.

**AL3. A Try again after a lost answer asks the server again, never the upload.** If the album recorded the photo it says so; if not, it lands now. No byte is sent twice, no photo is recorded twice and the month counts it once; a second pick of the same photograph is a new upload.

**AL4. A photo being asked again after a lost answer can't be stopped,** since its record may already exist: a stop on it does nothing and the photo lands, and a host's row shows no x.
- *Push back if* it should stay stoppable.

**AL5. A photo recorded on a lost answer appears when the album next syncs,** not at once: the phone isn't told its status (approved, held or sealed), since nothing of a row leaves the server to whoever holds a key.

**AL6. A file the storage can't assemble keeps saying "Couldn't finalize the upload. Please retry."** on every Try again, rather than starting over and risking a second row; practically unreachable.

---

## AM. "Never expires" on the marketing pages (crumbs-79)

**AM1. Four marketing lines that said events have "no end date" now say "never expires".** They are the home FAQ and the album page (its Free column, Stays step and FAQ); the idle rule rides the page's own "Free albums need a visit" note.
- *Push back if* the Free column should say "Kept while in use" instead (truer, says less to a host comparing plans), or "never expires" oversells Free beside the 6-month idle removal.

**AM2. The pricing tip says "no date ever ends it", not "never expires",** since the sentence before it is the idle removal and "never expires" beside it reads as a contradiction.
- *Push back if* one phrase should run everywhere.

---

## AN. Drive's not-set-up words and the upload sheet (crumbs-80)

**AN1. Account shows a Google Drive card even while Drive isn't set up.** It says "Send to Google Drive isn't set up yet. It's on its way. Download keeps every original meanwhile." with no Connect button, the sentence every Drive door shares.
- *Push back if* Account should show nothing until Drive is set up.

**AN2. Your events says "not set up" before she picks albums,** at the cost of one small status call each time its send list opens.

**AN3. The failure sheet says "Everything else is in the album" only once every other file has landed,** stricter than "once something landed", which would claim a file still in the air.

**AN4. The door's Sending step closes at the first landed file.** She goes into the album, where the stack carries the rest with its count and its x, and the ask to keep her photos waits for the whole count.
- *Push back if* the door should hold her until the run ends, one continuous sheet (Sending, then the ask).

**AN5. A hung permission request is taken back at 8 s and asked again beside the files waiting behind it,** instead of holding them for the full 30 s. It happens only when a file waits behind it, and costs one more request on the hourly breaker's tally (limit 20,000).
- *Push back if* the stuck file should fail at 8 s instead, or a second request should go beside it (which can send bytes out of order).

**AN6. A lost answer heals itself.** The failure row asks again at 5, 20 and 60 s (three asks a file), the moment the connection returns and when the page is looked at again, never while offline; the sheet or the host's row lets go once the server says it landed.
- *Push back if* it should clear only when the album next draws the photo.

---

## AO. Fewer calls on the hub, the cover and the header (compute-reads)

**AO1. A batch of new photos on the hub is one call, not two.** The live update carries links for approved arrivals only, newest first, at most 48; held and hidden uploads carry none.

**AO2. A guest's cover keeps the same six stills through a visit.** Each arrival used to reshuffle nearly all six; now an arrival changes nothing, a lost still is replaced by the reel's next pick, her own newest upload leads and a reload deals afresh. A ten-photo burst costs 14 calls where it cost 17; late in a party the cover can show stills the reel would no longer open on.
- *Push back if* the cover should re-deal on every arrival (more calls).

**AO3. Profile covers are cached by the browser, so a leaked cover link lives up to 90 minutes, not 60.** It is the same trade every album link already makes.
- *Push back if* covers should keep the shorter life.

**AO4. The demo's header links load the home page ahead only on intent;** a real album's header never loads it ahead, even on a hover, so its logo's page loads on the tap.
- *Push back if* a tap home should feel instant on a real album.

---

## AP. The Guests room, admin sign-in and Settings (crumbs-81)

**AP1. A sealed album's Guests room says "3 shots are developing. Their guests join this list when the album develops."** ("1 shot is developing. Its guest joins this list when the album develops."), in place of "Nobody has added photos yet", with Invite staying the quiet action. Only guests' shots count, and the line goes at the develop.
- *Push back if* those words read wrong (the hub's Guests card says it too since AX1).

**AP2. The admin portal is installable as "Partyreel".** The admin host now serves the app's manifest (every other page there still 404s), so an install carries the app's name and opens at /, which goes to /admin.
- *Push back if* installs should say what they are: "Partyreel Ops", opening /admin (a small follow-up).

**AP3. The admin sign-in's Terms and Privacy links open the app's own pages in a new tab,** so a sign-in in the middle of a code survives the read.
- *Push back if* the two pages should be served on the admin host itself.

**AP4. A guest's account menu has Your profile, after Manage event.** It opens her public page, or /me (which sends her on) until she has a handle.
- *Push back if* it should sit elsewhere.

**AP5. A Settings save that throws says "Couldn't save that setting. Check your connection and try again."** The value goes back and the row is freed.

---

## AQ. Lost photos copied back from the backup (durability-restore)

**AQ1. The backup can now copy a lost original back by itself (AF4's restore, built).** A pass runs each day and after each weekly cleanup of the backup; a copy that fails is tried again the next day. It starts as a practice run (AQ5).
- *Push back if* it should run with the weekly cleanup alone.

**AQ2. Restore now, on /admin/jobs behind your second factor, runs a pass at once** through the backup's own door. It needs one app setting (the backup's address); until it is set the button waits, disabled, and says why.
- *Push back if* it should only leave a note for the next daily pass (no setting, but up to a day away).

**AQ3. Only a file some album still holds is copied back, and never over a file that is there.** A copy an album has let go of (a phone's photo refused at its cap, which the backup had already taken) is said and left alone, since nothing would ever clear it again.

**AQ4. A file over about 5 GB is never copied back on its own.** One write can't keep "never over a file that is there" past that (uploads go to 10 GB), so it stays held, said on the card and in the mail, for a copy by hand.
- *Push back if* a big file should be copied back in parts, with a brief window in which a file that just appeared could be overwritten.

**AQ5. The restore starts as a practice run.** It says what it would copy and copies nothing, and goes live once the first dry run after the deploy reads right, not at launch. Its job switch on /admin/jobs starts on, so only that mode holds it back.
- *Push back if* it should be live from the first deploy.

**AQ6. A lost original is loud, but the mail comes once a day.** Every report that carries a count raises a Sentry warning, and the ops mail goes at most once a day while any stands (a host's photo with one copy left).
- *Push back if* the mail should be weekly, with the cleanup alone.

---

## AR. A pass's Pro credit and the uploads line (billing-integrity)

**AR1. A pass's Pro credit is given once ever, however long Stripe retries (closes AJ3).** We take our own claim before granting and look for a grant already made on Stripe's side before granting again; a replay converts only the passes its checkout credited (every one, however many), never one bought since.

**AR2. A second Pro checkout from another tab gets no credit.** The first one took it; the second's subscription is a double billing we are warned about, and a pass it named that nobody converted stays live behind Pro and returns when Pro ends.
- *Push back if* the second checkout should be credited for the passes the first didn't take.

**AR3. A credited checkout for a host whose profile is gone grants nothing.** Before, the balance was still put on the Stripe customer.
- *Push back if* it should still be credited.

**AR4. While one delivery of a credited checkout is being handled, a second is told to retry.** With the two TEST endpoints each receiving every event, one delivery per credited checkout reads as failed in Stripe's dashboard until its retry finds the grant on record.
- *Push back if* it should answer OK at once (it would claim work it didn't do).

**AR5. A lapsed pass now shuts the album's upload door for guests, as the upload itself does.** The door, the upload, the meter and /admin/accounts ask one rule, so a guest no longer finds an open door that the upload then refuses.

**AR6. Each refusal speaks of the line it met.** A host at her uploads line reads "You've hit this plan's upload limit for now." (no longer "Storage is full"), a guest reads the album's words (never "for this plan"), and a host at storage still reads "Storage is full for your plan. Free up space or upgrade." (two help articles quote it).
- *Push back if* a host's storage refusal should be one sentence at both of its steps, with the two help articles retold from it.

---

## AS. The doors to Stripe and back (pricing-doors)

**AS1. A signed-out Get Pro brings her back to the pricing page after sign-in, not to the plan she pressed.** She presses Get Pro again; nothing rides in the address, so no link can start a checkout on arrival.
- *Push back if* the checkout should resume by itself after sign-in (it would open a checkout on arrival).

**AS2. On a phone, one Back from Stripe returns to the page.** Handing the page to Stripe replaces the plan sheet's own history entry, so the sheet and its "Starting…" stay up until Stripe's page takes over.
- *Push back if* the sheet should close first on the way out, with the wait said another way (a toast).

**AS3. Get Pro, Manage billing and Switch free their button as soon as Stripe's address is set,** so a second tap while Stripe's page loads opens a second session.
- *Push back if* the button should stay on "Starting…" until the page leaves.

---

## AT. Drive after its first live walk (drive-fixes)

**AT1. Drive's sweep runs every 15 minutes, not every 5.** A stalled send is kicked within about 20 minutes and the done mail goes within 15; in the worst case five minutes would take 65% of Vercel's 4 free CPU hours a month, fifteen 22%.
- *Push back if* you'd rather have five (faster mails and recovery) or thirty (the Overdue line moves to two hours).

**AT2. Disconnecting Drive, or connecting another Google account, makes us forget every Google id our sends held** (files, folders, uploads in flight). Each send keeps its state and counts, and a later connection never reads another Drive's files as already sent.

**AT3. Account's Sent counts each album's largest ended send.** A re-send that kept every file adds nothing (it read 5.9 MB where 4.3 MB was in Drive); an album that lost originals between sends reads its largest send, not every file.
- *Push back if* Sent should count done sends only.

**AT4. After a stop, the strip says "Stopping" and "N of M reached your Drive so far", and offers no Send again until the files already on their way have landed.** Pressed sooner, Send again would send them twice.
- *Push back if* Send again should be offered at once.

**AT5. A send that finds nothing left says "Nothing of {album} was left to send", never "every one checked",** and the album's tile shows no light.
- *Push back if* those words read wrong.

**AT6. A send's upload lane that dies counts once, however often its report is repeated.** Three in five minutes still pause the connection until an operator resumes it.
- *Push back if* it should count once per connection per minute (three dying in one minute would then count as one).

---

## AU. Back and keys, one layer at a time (back-layers)

**AU1. On a phone, a question (a confirm or a form) holds a Back of its own only when it opens over something else:** the viewer, a sheet or screen, the credit's look or a room. Over the bare page, Back still leaves the page.
- *Push back if* every confirm should hold one (Android's habit), which would let Back race the act of the confirms that leave the page (Delete event, sign out everywhere, account deletion).

**AU2. Back while a question's save is pending closes the question, and the save carries on and lands as it would** (its toast, its redirect), since a sent write can't be recalled.

**AU3. At a desk, the viewer's arrow keys follow the layer the key came from.** Inside a confirm over the viewer they do nothing; a viewer opened from inside a panel keeps its arrows.
- *Push back if* any layer on top should silence the viewer's keys (a viewer opened from a panel would then lose them).

**AU4. A reload with a layer open leaves no dead Back.** On load the page steps over the leftover history entry (same address, nothing moves), so the reopened viewer closes with one Back.

**AU5. The camera's "Your shots" takes its own Back.** Back from her shots returns to the camera and the next Back closes it, as Escape already does.

---

## AV. The backup's daily check (backup-reconcile)

**AV1. A file whose two copies differ is said, never overwritten.** The check names it, reads "Needs a look" and mails once a day, since only a person can say which copy is good. Two exist now (originals the July 3 location strip rewrote; their backup copies still carry the location), so the first live run reads "Needs a look" until those two backup copies are deleted or the test data is reset.
- *Push back if* the main copy should overwrite the backup's (what the host sees, but a main copy damaged in place would take the good backup with it), or you want an admin control to refresh one.

**AV2. A check that stops early reads "Needs a look", and "Overdue" keeps its plain meaning:** no report at all for a day and a half. A run is bounded now, so it always reports.
- *Push back if* freshness should be judged by the last whole pass (a second meaning of healthy).

**AV3. A photo lost in its first 36 days is now found by the daily check, not after five weeks,** and each young missing file is asked of the albums (one small call per thousand a day) even while the restore is off.
- *Push back if* it should ask nothing while the restore is off, as the weekly cleanup does.

**AV4. A copy no run can finish is said and remembered, not resumed.** A file too big to copy in one run (a multi-GB video, at the recovery drill's pace of about 1 MB a second) shows as an error, so later passes don't spend a run on it, and is copied by hand; until then it may have no backup.
- *Push back if* a copy that resumes across runs should come before launch (a deferred line today).

**AV5. A check that stops early, fails or finds differing copies raises a Sentry warning every time and mails at most once a day.**
- *Push back if* only failures should mail.

---

## AW. The roll in Settings and Create (settings-wiring)

Built as you picked on desk 3; these are the lane's own further calls.

**AW1. Her roll is kept while the album takes free uploads,** so switching to Live and back to Disposable, or the camera off and on, returns to her size (it used to reset to 24).

**AW2. Create saves her roll only with a Disposable.** Her pick stays put while she moves between the style cards; an album born Live or Review gets 24 the day its camera starts.
- *Push back if* an album should be born with her pick whatever the style, kept for a Disposable later.

**AW3. A smaller roll mid-party keeps every shot already taken.** A guest past the new size meets "That's your roll" at her next shot; Settings doesn't warn the host, since it reads no guest's count.
- *Push back if* Settings should warn when the new size falls under the most any guest holds (it needs a read of that number).

**AW4. A film box saves at once; the stepper shows each press at once and saves 0.6 s after her last, or as she leaves the page.** Holding minus or plus runs the count and quickens (99 in about 3.5 s).
- *Push back if* every press should save (a save and a hub redraw a step).

**AW5. The roll's words.** The row says "Shots each" over "Each guest's roll on the album's camera."; on the first screen "24 shots" is a live word offering film's three ("Film's short roll.", "Partyreel's usual.", "Film's long roll."), her own count where it is none of them, and "Another number" ("Any count from 1 to 99."), which opens the stepper.
- *Push back if* any of those reads off, or the word should always open the page.

**AW6. A guest's ceiling stays three rolls' worth of shots at any size** (297 a period at 99), as production counts it. Your "re-shoots stay a flat 3" waits for the guest-moments board, on desk 7.

**AW7. A roll of one is allowed, and its refusal reads "You've taken all 1 shots on your roll."** until the camera's upload rule is next rewritten (a migration).
- *Push back if* it should be fixed before launch.

---

## AX. The hub's doors in words (event-header-wiring)

Built as you picked on desk 3; the doors' looks are on your design desk, so these are only its wording and behaviour calls.

**AX1. The Guests card says "6 shots developing" while a sealed roll waits (AP1's ask, built).** Only while the list is empty for that reason alone and nobody waits at the door: who waits (amber) comes first, and once anyone is in, the guest count stands. It reads when the page loads, so a hub left open across the develop says it until the next load.
- *Push back if* it should show beside the count ("31 guests, 6 developing"), or update live.

**AX2. Settings' door says "Paused" once its steps are done and uploads are off,** in place of the door's word; the code's corner keeps its pause.
- *Push back if* the door's word should stay and only the code's corner say paused, as before.

**AX3. A door's count reads "1.2K" from 1,000;** the whole number stays in the door's name and in its room.
- *Push back if* the whole number should show (a phone's card then loses its name past three digits).

**AX4. The cover keeps production's words:** the date, guests, views and Live mark under the title, and the link row, not the board's quiet when-line over a bare name.
- *Push back if* the board's head should be wired as drawn.

---

## AY. The album turns, and her view of it (album-order)

Built as you picked on desk 3, with the pill as the answer to your 200-new-photos question; these are the lane's own further calls (the turn's 9 am is the party's own zone: BD).

**AY1. The live demo and an album with no date never turn.** The demo is a party in progress, and the photograph a visitor just added stays first. An undated album has no last day to turn after, and Create asks no date (H1), so that is every new host's album until she adds one in Settings.
- *Push back if* an undated album should turn too, by a host's own "In order now" for it (a column) or by Create asking a date.

**AY2. Her sort is remembered per album only when it departs from the album's own order; her filter is not remembered.** Picking Oldest first on an album still running newest first is kept on that phone for that album (one small cookie, the last 12 albums, for a year, for the privacy page's list), so her next first look is already her order; choosing the album's own order forgets it, so the album keeps turning for her. Photos, Videos and Yours start fresh each visit, since remembered they would open a returning guest's album on a slice of it.
- *Push back if* the filter should be remembered too, or any pick should stick even when it matches the album's own order.

**AY3. The "N new" pill counts what others add, never her own upload.** When photos land out of sight, one quiet pill under the top bar says "12 new", with an arrow the way they lie. Another guest's photo, a late approval or a restore counts; her own tiles show at once and her upload tracker already says hers.
- *Push back if* her own uploads should count too.

**AY4. The pill waits until she is past the album's first row, and a landing clears the moment she reaches it.** So it never covers the cover or the head where new photos land. A batch of 200 above her reads "200 new" with an up arrow, and reaching any of it, by the pill or her own scroll, clears the lot (it never counts down under a reader working through the very batch it announced). Landings on both sides add up, and the arrow points to the nearer.
- *Push back if* the pill should show from the very top too, or count down as she scrolls through.

**AY5. Your hub's album gets the pill but never turns.** Your working view stays newest first after the party, with its Sort per visit as today; its Oldest first reads the same time the guests' night in order does (when each was taken, else when it arrived).
- *Push back if* the hub should turn after the party like a guest's album.

**AY6. The album turns while a guest is reading, and her photograph holds its place.** At the morning (on a timer, and as she returns to the tab) the album lays itself out again in the night's order with the photograph she was looking at on the same pixel; a guest who chose her own order keeps it.
- *Push back if* it should wait for her next open.

**AY7. Photos, Videos and Yours are offered only where there is something to filter.** Photos and Videos show only where the album holds both kinds, and carry no counts; Yours shows while she owns a photo, with her count; where All would stand alone there is no Filter at all, and a filter that finds nothing falls back to All.
- *Push back if* Filter should always show (you asked that guests always have sort and filter), or Photos and Videos should carry counts.

---

## AZ. A photo keeps the time it was taken (capture-time)

Built as you said on X7 (keep the capture time, never the place or the device); these are the lane's own further calls.

**AZ1. A time with no zone is read in the uploader's own zone.** Most cameras and older Androids write the hour taken with no zone. We read it in the zone of the browser that uploads, since she is nearly always where she shot it and sends it that night; UTC would shift a New York night by hours, and dropping it would lose most such photos' times. A guest who uploads from another zone than she shot in gets a time off by the difference.
- *Push back if* the party's own zone should read it (event-zone makes that possible, at one more read on every upload).

**AZ2. A time before 1990 or more than a day ahead is dropped, and the photo lands anyway.** Those are reset clocks (1904, 1970, 1980) or a shutter that has not fired yet. The photo is placed by when it arrived, as is any photo that carries no time (a PNG or WebP, an album-camera shot). Inside the bounds the time is the uploader's word, so a camera set to 2005 would lead the night in order.
- *Push back if* a time far outside the album's own days should sit at the night's edge instead of leading it (a change to how the album draws it).

**AZ3. A stored photo keeps the hour it was taken, never the zone, the place or the phone.** A download or a Save into Photos lands on the right day and hour and says nothing about where or on what. The zone stays out because it would say roughly where (Nepal's +05:45 and Iran's +03:30 each belong to one country). The help article says so; the privacy page will at launch.
- *Push back if* the file should keep the zone too (one line), at the cost of saying roughly where it was taken.

**AZ4. A video keeps its shot time by rewriting the movie's creation time to it.** An iPhone export stamps that field with the moment it wrote the file, so a clip picked the next morning would download as taken that morning. The shot's own date lives in the box that also holds the place and the phone, which still goes, so we copy the date into the field first; a movie with no such date is left as before.
- *Push back if* the field should be left as the phone wrote it (a clip picked the next day then reads as taken then).

---

## BA. The halo, the shrink and the bright edge (identity-wiring)

Built as you picked on desk 3 (identity r4); their looks are on your design desk, so these are only the behaviour calls.

**BA1. Two controls skip the shrink.** Every action gives about two pixels under the finger, except a menu's or popover's button (a shrunk button would hang its menu a pixel or two off where it springs back to, and the menu opening is its answer) and the camera's shutter, which keeps a camera's press: its face sinks and turns red to film.
- *Push back if* menu buttons should give too, or the shutter should take the house's give.

**BA2. A text field shows its halo to anyone who taps it, not only to a keyboard.** A browser counts a focused text field as keyboard-ready however it was reached, so every guest sees the halo on a field they tap; other controls show it only when the keyboard reaches them.
- *Push back if* a tapped field should stay quiet.

**BA3. The code chip, the code mat and the shutter give under reduced motion too, at once.** For anyone whose phone asks for less motion they now give when pressed and let go in the same instant, as buttons always did; before, they stayed still.
- *Push back if* they should stay still under reduced motion.

---

## BB. The stage's chooser and the Drive re-walk's small fixes (crumbs-82)

Built as you picked on desk 3 (the stage's first words are the chooser); these are the lane's own further calls.

**BB1. Her stage rule is kept on her account, beside her Display.** What leads the stage (Your newest, Your next party, Where you left off, Latest photos) is a setting like her layout: a reload leads with it, and so does her other phone. Only a rule that is not the default is stored, in no new column.
- *Push back if* it should have a column of its own, so two devices saving at once can never lose one setting (a migration).

**BB2. The chooser stands only when she has a choice, and still stands when all four rules agree.** A choice means more than one event and none on its day, since a party on its own day leads under every rule (the chooser's footnote says "A party on its own day always leads."). When all four would lead with the same event it still stands, since the rule is a standing preference that matters once something changes.
- *Push back if* it should always show (disabled while a party is live), or hide while the four agree.

**BB3. A press draws the new lead whole, so the dashboard reads the other rules' events on every load.** For at most three events, only those before their day, it reads their get-ready steps ahead of time: a few small reads for every host who has a choice. The guest count of the event a press leads with is read once, on the press.
- *Push back if* those reads should wait for the chooser's first open (fewer reads for hosts who never open it, but the steps pop in after a press and a phone's band grows).

**BB4. Drive's strip beats every 3 seconds while a send is at work and every 15 when it is paused or silent.** At work means preparing, sending or checking, with a report in the last minute; a paused send, files that stopped landing and a send silent for a minute drop to 15, since three reads every 3 seconds per open tab was the cost the review found. Only a browser that uses Drive polls at all (AH8).
- *Push back if* 5 seconds would do: about 40% fewer polls while a send runs, in coarser steps.

**BB5. Account's Sent and the tiles' lights count only the connection she has now.** Earlier sends become one quiet "Earlier" line on Account saying how much was sent before this connection and that it stays where it went, so Account, the tiles and Your events agree after a reconnect (it narrows AT3).
- *Push back if* earlier sends should keep counting, or be said nowhere.

**BB6. A non-admin who opens an /admin page sees the title of any missing page.** "Page not found" and still kept out of search, so the tab no longer names an operator page, as it did for Jobs.

**BB7. Drive's promise tells her to tick Google's box.** Google shows Drive's permission as an unticked box, so a first Continue came back as needs-permission; the promise now says "Google asks you to choose an account, then to tick the box that lets Partyreel add files."
- *Push back if* it should quote Google's own checkbox line, which Google can change.

---

## BC. A pass's Pro credit, the last holes closed and watched (credit-watch)

TEST money and mostly an operator's pages, so only the calls with a visible edge; it closes what the review of AR found.

**BC1. A second checkout for the same passes waits while the first still holds its claim, and is refused only once the first truly landed (AR2's other tab).** It is told "busy", so Stripe asks again; before, a first tab that died mid-credit and ran out of retries left both refused, and the credit never came. Before granting we look on Stripe for a grant a dead checkout may already have made and adopt it, so a retry never doubles a credit, and a claim another checkout overtook is closed for good so the watch never reads it as stuck.
- *Push back if* a live claim should refuse the second tab outright, as before (simpler, but a first tab that dies strands both until your Retry).

**BC2. A credit stuck for an hour shows on /admin with Retry beside it.** Stuck means claimed with no grant, or granted and never converted: it shows on /admin/accounts with its account, on that account's page with Retry (your second factor, audited), and on /admin/jobs, which counts credits honoured, failed and owed. A double credit only Stripe can reverse stays listed for 30 days and is never counted as owed.
- *Push back if* the page should only say it and you resend the event from Stripe, or the hour should be shorter.

**BC3. The change-plan check lives on /admin/accounts and rings no bell.** Each time the page opens it asks Stripe whether the tagged configuration lists all six Pro prices ("Asking Stripe…", streamed so it never holds the list), names any price it lacks and stays quiet when whole. A missing price once made every Switch a 500; this shows it before a host meets it, but only when someone looks.
- *Push back if* a daily run should raise it at the spend watch's check, so it rings a bell.

**BC4. The nightly recompute leaves a host alone for an hour after a credited conversion.** Without it, a recompute landing between her pass turning into Pro credit and her Pro subscription event could move her to Free for those seconds. It answers "Pro pending" for that hour only, and only for a host with no pass still running.
- *Push back if* the hour is the wrong wait, or her Plan card should say her Pro is on its way meanwhile.

---

## BD. One moment for every guest (event-zone)

Built as you asked on 2026-10-05 (one moment for every guest, wherever she stands); these are the lane's own further calls, and H2's 9 am is now the party's.

**BD1. A party with no readable zone turns at 9 am UTC, and Create goes ahead anyway.** Only test data from before the column, or a browser zone the server cannot read, has none: Create stores none and reports it rather than stopping a host over her own device. Even then every guest meets one moment, and the row takes its host's zone with her next save of a time.
- *Push back if* those rows should turn in each reader's zone as before (the unfairness stays on them), or Create should refuse.

**BD2. A date edit never moves the party's zone; only her chosen city does.** Her first save of a time on a zoneless event fills it; after that, editing the date from another zone (a phone on a trip) leaves it.
- *Push back if* a date edit should re-read her zone.

**BD3. A party far from home is one quiet line under Settings' dates, built now and never in Create.** At home it asks "Party in another time zone?"; away it says whose clock ("On Mexico City time"), the time there now, and a Change. Far from home the develop time reads and writes in the party's clock and names its place with its day ("Develops Sun, Oct 4, 9:00 AM in Mexico City."), never "tomorrow", since a relative day across two zones is nobody's.
- *Push back if* it should wait until a host asks for it, or the develop field should keep her own clock and only name the place in the words.

**BD4. Picking another city never moves a develop time already set.** The moment stays and is said in the new city's clock, so a develop picked at 9 am at home can land at an odd hour there until she changes it.
- *Push back if* an untouched default develop should follow to the new city's 9 am (it would also move a time she may have chosen).

**BD5. The chooser's search knows nicknames and destinations.** A hand-kept list of about 80 zones answers "Bali" with Makassar, "Tuscany" with Rome, "Cabo" with Mazatlan and "India" with Kolkata, since a browser lists cities by their zone's own name.
- *Push back if* it should find city names alone (a host planning a Bali wedding who types "Bali" then finds nothing).

**BD6. On a phone the chooser puts no focus in its search.** No keyboard springs up uninvited, the house's rule for a hand: she taps the field. At a desk the search takes focus.
- *Push back if* the search should take focus on a phone too.

---

## BE. Drive's last correctness before it goes live (drive-hardening)

Built so Drive is correct before milestone 38 takes it live; these are the lane's own calls.

**BE1. A reconnect finds her Partyreel folder instead of making another, looked up when she presses Send.** The folder we make carries a private mark, and on the first send after a connect one list call finds the oldest marked folder out of the bin, never by name (a folder of her own may share it). A folder she deleted or trashed is made again. Whether Google still lists the old folder after a re-grant is unproven: milestone 38's walk counts the folders.
- *Push back if* the lookup should happen at connect (one Google call on every connect, even for a host who never sends).

**BE2. Two Partyreel accounts on one Google account share one Partyreel folder.** The mark says Partyreel, not whose, and the album folders inside keep the albums apart by name.
- *Push back if* each account should get its own folder (two same-named folders in that Drive).

**BE3. Sending an album again after a Disconnect and Connect sends it whole, into a second album folder.** Disconnect forgets every Drive id (AT2), so the album goes again from the start into a second same-named folder inside the one Partyreel folder, and Open in Drive opens the folder that holds its files. The better answer, finding the album's folder and files by marks, needs a column on the send, so it is a migration.
- *Push back if* that lane should open before launch, so a re-send after reconnecting adds only what is missing.

**BE4. A rare Google answer that keeps none of a chunk counts as a failed try.** The file retries a minute later with its session kept, and fails for good on its fifth try (Retry on the album); before, it looped until the slice ended.
- *Push back if* it should be waited out like a slow down (about two minutes, then the file goes back uncounted).

---

## BF. The lab's own rising tide (lab-kit-2)

Your design desk's own fixes; these are the two calls in them.

**BF1. A hidden option holds still inside its frames, entrances included.** The options you are not looking at no longer run their loops or play video behind you (identity's working step and the brand decks hold now). Every CSS animation freezes, finite ones too, so an entrance held at its start plays as you open the option; a loop written in script is the frame's own.
- *Push back if* an option's entrance should already have played when you open it (only loops held).

**BF2. The tools index is one press from every tool's crumbs, with no sidebar row of its own.** The Tools section now links the index, so every tool's crumbs read Lab, Tools, then the tool, and the smoke crawl visits it; a row would make the index list itself.
- *Push back if* it should also stand in the sidebar and the palette.

---

## BG. Your scratch, kept in the repo (scratch-synthesis)

Built so a cloud-seated Orchestrator sees what the Mac's saw; these are the lane's own calls.

**BG1. This lab lives in the repo and stays mine to write.** Each merge's calls land here at its record, so any seat, local or cloud, reads what you read. The repo is public while the Actions budget needs it to be, so nothing here is a secret.
- *Push back if* the lab should stay off the public repo (a private file you hand each new seat).

**BG2. The red-team harness and the dollar model behind PRICING moved into the kit.** Five red-teams carried the harness by copy; it is `usher/kit/redteam/` now, beside a red-team brief with the walk's specifics as blanks, the desk refresh and `usher/kit/cost-model/` (its output identical to the runs PRICING quotes).
- *Push back if* either should stay off the repo.

**BG3. X4 left the questions and five more stale lines here were made true.** X4 is built (the poll lever, AB2 to AB5); F's and L's intros, AW6's desk, S1's bell link and AH3's "no capture time" were untrue.
- *Push back if* X4 should come back as a question.

**BG4. The docs' history cuts wait for a prune pass.** Only the stale lines in PRICING, PRD and billing-caps were fixed now; about 92 lines of history and restatement there and in reel.md wait for a docs lane (a ROADMAP line), since their snippets drift with every merge.
- *Push back if* you want the cuts now.

**BG5. The visual calls the desks still owe are ROADMAP lines, one per board.** Round 15's B1, Q6, B2, L3, C7, D3, Q3, G6, I4, I5, F1, F2, N4, N7 and N9 were written down nowhere since 2026-10-04; each moments board and desk 6's marketing-themes is cut from its line.
- *Push back if* they should live only in the desk plan.

**BG6. PRD names three of your standing principles in words from the round's brief.** Delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it.
- *Push back if* any of the three isn't how you'd say it.

---

## BH. A leaner suite (test-slim)

Built so the gate stays fast as the product grows; your four calls, the first two built right after the merge.

**BH1. The suite runs its files in threads, not forks.** About 9% off a full run (63 s against 69 s on the Mac, every test green in each measured run), and the merge gate gains first.
- *Push back if* a flake shows up that forks would not have had (the gate would show it first).

**BH2. A coverage command any lane can run.** `pnpm test:coverage` (the v8 provider, a devDependency) gives lines, branches and functions per directory, so a lane that deletes a test proves it lost nothing in one command.
- *Push back if* you'd rather not carry the dependency.

**BH3. Isolation stays on.** Turning it off would halve a run (31.6 s against 85 s), but 51 files leak a mock or module state into the next; a lane makes them hermetic first (a ROADMAP line).
- *Push back if* the speed is worth chasing now.

**BH4. Vitest's experimental module cache stays off** while it is experimental: it saves only the transform (about 2 s of 80).
- *Push back if* you want it on anyway.

---

## BI. The hub's cards, the light made right (event-header-r6, on your desk)

Its two asks are on your desk; these are the calls drawn into every option, built and yours to overrule.

**BI1. The cards stand on the cover's foot, and the light falls past them.** The photograph runs on 20 px under the cards (14 at a phone) to its edge, where the Seam starts; the album begins past the light's reach, so nothing you press sits inside it.
- *Push back if* the cards should sit under the light instead, as a row on the page after the Seam.

**BI2. The light keeps the brand's full reach.** At 1440 the album starts 623 px down in the room (r5: 559) and 539 on paper; a shorter Seam would be the brand's own 104 / 72, never paler.
- *Push back if* the first screen should show more of the album.

**BI3. At a phone the cards are one row of five tiles** (the glyph, its count, a short word), since the cover's foot cannot hold a two-by-two grid.
- *Push back if* a phone should keep production's two-by-two grid.

**BI4. 99+ lives in the badge alone.** A screen reader still hears the whole number ("Review: 140 waiting").
- *Push back if* the cap should show anywhere else.

**BI5. Paper follows brand r2's recommended take (Aperture) until you pick one.** Ink and Cast are on the board's Paper knob, never asked twice.
- *Push back if* you want paper judged first.

---

## BJ. Your house set and working words, wired (identity-r5-wiring)

Your two identity picks are in production's atoms; these five calls came with them, built and yours to overrule.

**BJ1. A working key stays busy, never off.** It keeps its focus and face while it works (a second press does nothing), where a disabled key dropped focus to the page mid-save.
- *Push back if* a working key should read as off.

**BJ2. An off key settles clear:** faint words inside a quiet hairline, as the board drew it, not production's half-strength slab.
- *Push back if* off should stay a dimmed slab.

**BJ3. Create's foot is the key it becomes.** While the event is made it reads "Creating your event" with the arc, then turns to Get it ready in place.
- *Push back if* you'd rather keep a line of text there while it works.

**BJ4. Where a box clips, the halo is drawn inside it** (Settings' rows, the radio cards, the password field's eye): outside, it was cut away. The one construction the board never drew.
- *Push back if* those controls should lose their clip instead.

**BJ5. The camera's line names the retake ceiling:** "One shot each. Removing it frees the frame for another, up to 3 shots in all." (and "A roll of 12 shots each. Removing one frees its frame for another, up to 36 shots in all.")
- *Push back if* the words should stay silent on the ceiling.

## BK. The kit and the lab, at home in the cloud (lab-kit-3)

Your yes of 2026-10-06 let a cloud walk sign in; these calls came with it, built and yours to overrule.

**BK1. A cloud walk signs in by a minted magic link, for the two test hosts only and on a local base only**
(`usher/kit/redteam/signin.mjs`): the link sends no mail, the session goes into the walk's own Chrome, and the operator,
any stranger, partyreel.com and the alias are refused before any key is read.
- *Push back if* a cloud walk should sign in on the alias too (it spends Hobby CPU).

**BK2. The test media are synthetic:** gradients with drawn labels at a phone's size and bytes, a capture time in the
Exif, a short clip with its creation time; never a real photograph.
- *Push back if* the walks should use real photographs, uploaded once into the environment.

**BK3. The lab's demo always walks the motion pass:** every step a second time with motion allowed, so the pause is
proven on every step and a short loop per option names which options move (the whole desk took about 205 s).
- *Push back if* the gate should take the loop only when a board asks for it.

## BL. Her send in view, and the album's time whole (crumbs-85)

Red-team 56's findings are fixed and the album's time made whole; these five calls came with them, built and yours to
overrule.

**BL1. Her stack keeps the slot her photograph lands in** (the album's end, in an album in order), and while that slot
is out of her sight a glass stand-in (her file's thumb, "N to go" or "Sending", the bar, the x) stands above the
shutter's band, wherever she is in either order.
- *Push back if* the stack should move to the album's head in every order (her photograph would then land where she
  cannot see it).

**BL2. A photograph taken long before the night is seated at the night's end edge** while it is the smaller part of the
album, "the night" being the run of times ending at the newest, neighbours within three days; an album made after its
trip keeps its true order.
- *Push back if* the edge should be the start, or "the night" should come from the event's dated days.

**BL3. A far party's develop time reads in both clocks:** "Sun, Oct 4 at 9 am in Bali, Sat 6 pm yours" (her weekday only
where her day differs) in every develop sentence, while the cover's eyebrow keeps her own short clock ("Disposable ·
develops tomorrow at 6 pm"), which fits a line at 375.
- *Push back if* the eyebrow should name the place too.

**BL4. The party's zone reaches the guest's browser, for words only:** never behind a lock, never for the album's turn
(still one instant for everyone).
- *Push back if* the zone should stay on the server and the words come pre-written.

**BL5. The held door's camera says the shots wait:** "They go in once you're let in" under the name and in Your shots,
"Waiting to go in" on each shot, "N shots. They go in once you're let in." at the roll's end.
- *Push back if* the words should say less (or the shots should not show until she is in).

## BM. A guest's night, drawn (guest-moments-r1, on your desk)

Its five asks are on your desk; these are the calls drawn into its options, built and yours to overrule.

**BM1. The reel's take-back asks first:** a press on the reel's newest frame opens a two-key sheet (Take it back /
Keep it), since a mis-press there must not delete; Your shots keeps its X with no question.
- *Push back if* the reel's take-back should be one press too.

**BM2. Her own first photo says "Yours is in"** (the arrival light's own name for the sweep), in the `own` option
recommended.
- *Push back if* the words should be quieter, or none.

**BM3. `settle` keeps the glow on other people's photos:** the batch lands whole from the first frame, each new one
still lit.
- *Push back if* a settled batch should land unlit.

**BM4. The retake ceiling, asked rather than assumed:** production allows three rolls' worth (72 shots at a roll of
24), not the "up to 3 shots in all" the brief said; `limit` asks it with your flat 3 recommended, a `create_media`
constant (a migration) for its wiring lane.
- *Push back if* three rolls' worth should stand without asking.

## BN. A host's party, drawn (host-moments-r1, on your desk)

Its seven asks are on your desk; these are the calls drawn into them, built and yours to overrule.

**BN1. Two of its options would change the database if you pick them,** and each ask says so in its costs: `tell`'s
"carry on" (a guest's roll keeps counting through a develop time added mid-party: `create_media` would count from
`sealed_from`) and `let-back`'s "straight" (lifting a decline lets the newcomer in: `let_back_in` would admit a
waiting ask). Recommended: "straight" yes, the outcome its words promise; "carry on" no (a consequence line, fresh
rolls said first).
- *Push back if* either recommendation should flip.

**BN2. `decline` keeps today's answer as its recommendation:** Decline is a block, the one ask where production's
built answer stands as recommended.
- *Push back if* a decline should be a no for now, or her choice each time.

## BO. The halo everywhere in reach, and captions you can read (a11y-halo)

The halo and the working words now reach every call site in reach (pricing's three and Drive's one wait for their
lanes), and the faint captions and paper's warning words read at 4.5:1 or better; these calls came with them, built
and yours to overrule.

**BO1. Paper's warning words are a bronze of the amber's hue** (oklch 0.53 0.12 70): Account's "1 of 1 used" reads
5.30:1 on its card where it read 1.86; the amber's fills, borders and glyphs keep their colour, and the room keeps its
bright amber. Built as the token's own fix (one line in `theme.css` beside it), so no call site moved.
- *Push back if* the words should be a darker amber instead.

**BO2. Every caption one step darker on every ground** (paper's body 3.64 to 4.95, the mat 3.39 to 4.61, the room
3.92 to 5.06), each still a step under the muted grey; the room display's caption step stays at 3.88 (a third step
would stop being one: a ROADMAP line for a design answer).
- *Push back if* the captions should keep their lightness and the grounds move instead.

**BO3. "Use a different email" says "Signing out" while it works,** and the other key waits off.
- *Push back if* both keys should stay live.

**BO4. The admin's confirm says "Working" where a caller names no word** (the jobs page's acts outside this lane).
- *Push back if* those acts should name their own words first.

**BO5. The report queue's Dismiss says nothing while it works:** the dismissal is optimistic, so the entry leaves at
once and no key is left to speak.
- *Push back if* a Dismiss should hold its entry until the server answers.

## BP. Bursts back to back (uploads-bursts)

A dropped burst's Retry all comes back as one burst, and the next burst goes on the last one's bytes (about 4 s saved
at each boundary on a throttled phone line, measured before and after); these calls came with it, built and yours to
overrule.

**BP1. The overlap stands even at an album's cap or a roll's end:** the next burst's presign is judged before the
last burst's files are recorded, so a file let through at the exact cap sends its bytes before the complete refuses it
onto the failure sheet in the same words (never counted, its staging swept).
- *Push back if* the overlap should hold where a roll or a cap could be reached.

**BP2. Retry all is coalesced inside the queue** (one run a tick), not a new key on the sheet; a Retry all whose files
take longer than the burst's own 10 s record wait still records in two completes, the burst's rule.
- *Push back if* a Retry all should always be one complete.
