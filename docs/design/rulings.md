# Will's rulings, verbatim

> **ROLE:** the dated record of every directive of Will's that shapes design work, whether or not it
> became a bible rule. **BELONGS HERE:** the quote (a paraphrase is marked as one), the date, and
> what it became. **NOT HERE:** the rule's text (the bible), how to apply it (`guidance.md`,
> `docs/PROGRAM.md`). **GROWS BY:** the Orchestrator appends a section from a review message or from
> chat; a section is never rewritten, only superseded by a later one that says so. Never owned by a
> track. Rendered in the Library at `/design/library/rulings`; until 2026-09-15 these lived only in
> the Orchestrator's memory files, invisible to agents in worktrees.

## 2026-09-20 · the closing sitting's first batch: the button rung, the home's three states, the guest chrome, the View menu, and the identity question

Will, 18:20 EDT, on the alias's `fe056e62`, the desk's first five boards answered (14 verdicts; the paste verbatim below, one line per board; his instruction at its head: "Let's put a pause on Moltbook for now to avoid distilling context - we'll re-enable later after work."):

- `body-type` r2: `pairs=step-up`.
- `app-shape` r2: `empty=wizard`; `first=pulse` "I don't like prompting a single event share from the main dashboard separately rather than from the event itself."; `busy=collapsed` "However, I like 'just arrived' underneath the events. Notices & storage are more helpful above, more global and immediately helpful.."
- `guest-shape` r2: `chrome=both` "I like this because you see the actions higher on the page when first landing, and then keep them visible as you continue."; `welcome=sheet` "Aligning to the bottom rather than centering as a modal gives much more blurred visual preview of the album awaiting above to incentivize/tease through the welcome gates."; `theirs=mark` "We could likely combine this new filter with the tile size filter to create a new parent dropdown, rather than just adding more and more configs here. This would be more scalable as we progress."
- `guest-verify` r1: `gate=after` "This was a tough one, but Partyreel is ultimately built to benefit the host, and it'd be a shame if a host never saw pictures that are otherwise ready to go because a guest simply forgot to confirm their email. Displaying photos from unverified guests in the public guest album could be an event setting. Now that we're allowing unconfirmed uploads, it's making me rethink whether we allow anonymous uploads at all."; `badge=mark` "Rather than a warning icon, this could be more subtle. When the icon/mark is hovered, a tooltip should clarify what it means. We could also have an unverified badge on the pop-up when a guest is clicked on screen, as well as on the profile pages. I'm expecting a guest to see themselves as marked as unverified publicly and want to correct that immediately by verifying."; `collision=?` "The question is clear, this just deserves a deep think second round to ensure we've found the best options for solutions. We've created a problem where we don't want to block guests anymore than we have to (and a magic link failure could be catastrophic at an event), but now it's as easy as typing an email to upload under that identity. A few cases to consider: 1) I upload under a fake email and someone with that email goes to upload at a different event later but their email has already been used. They can prove ownership and it would've never been confirmed. How does original fake uploader get back to account if we reassign email? 2) I'm not logged in, enter my email I've used before at a different event as a guest. Am I uploading as me, or do I need to prove it with log in? 3) Two different people upload under the same fake, unconfirmed email. Attached? We either need a good login/verification system, or maybe we just need to fall back to the magic link or a similar idea. Passwords don't prove ownership either. Consider all of our ideas and systems up until now unprotected and open to relitigation for best overall idea to streamline account identity."; `outage=?` "Sorry, I'm not sure of what it means when a code stops arriving in the middle of a party."; `host-lens=badge` "This makes it more streamlined for the host and doesn't make them feel blocked from media by somebody else's actions. Imagine who's looking it up. Wealth of photos and videos they can't access because somebody else hasn't confirmed."; `expiry=host` "I don't like the idea of removing after 7 days, since the host would probably like to have those. However, we can't keep pending forever. Sorry if any of these selections are starting to cross wires. May have to relitigate"
- `app-vocabulary` r2: `controls-home=view-menu` "If it's easier to have sort, filter, or more than one exclusive 'View' menu, that's okay. However, the rest of the options with everything visible at the top-level felt far too busy."

His summing-up, verbatim: "To sum up a lot of my notes, I think we still need to find the best shape across login, verification, upload credits, anonymous accounts, etc. Everything is unprotected and open to relitigate, I'm sure we've created some opportunity for error somewhere already. Looking for best shape overall."

**Became:** four wiring lanes that retire their boards (`buttons-wiring`: the icon one notch over its text; `home-states-wiring`: the real collapse and, from his `busy` note, the band order next-step, storage, events, then Just arrived beneath the events; `guest-chrome-wiring`: the row on landing then a dock, the door's shell in the responsive Sheet's posture on the door's own engine, an own-tile mark whose tap filters to yours and, from his `theirs` note, the guest album's parent View menu; `controls-home-wiring`: one View menu holding tile size, sort and filter beside Download and Select, shared with the guest album); the desk pass `overtaken-3` for the fourteen verdicts' reach; and `guest-verify` round two on the identity shape whole (the key, what a typed address does, what an unproven session may add, where unproven content goes, his case 2 with cases 1 and 3 drawn as fact, what the host's switch becomes), his `?` notes re-asked inside it and his three cases as its stage. His four `guest-verify` rulings are recorded and HELD, not wired, until round two rules, on his own "May have to relitigate". The one thing the identity board needs from him: the project's configured Auth rate limits (Dashboard, Authentication, Rate Limits), three numbers. Moltbook paused on his word.

## 2026-09-20 · the morning: close the board

Will, 12:07 EDT, after the weekly token limit killed the six running lanes at 07:30 EDT: "Amazing work. You hit the weekly limit overnight, which killed all of our running processes. Now that the limit is reset, please capture all progress and complete any open explorations. Then we'll start working on answering everything on the board, rather than continue stacking."

His clarification, 12:20 EDT: "Just to be clear about one point I saw in your summary, any open boards may continue to open new rounds if needed, same as we've been doing. I want no change there. We're simply no longer trying to burn any tokens now that the weekly limit reset, so it makes sense to stop stacking new boards in favor of closing what we have, so future explorations we launch are all from a single cohesive library and a completed board with no open questions that may impact new explorations. Avoid the overtaking problem."

**Became:** the six lanes (`help-sync`, `home-states`, `guest-verify`, `buttons-pairs`, `toasts`, `demo-doors`) resumed into their own worktrees with what git showed of each; an open board still opens a round two (or three) when his verdicts ask for one, exactly as before; the wiring of every ruling and `type-sync` (the batch's last queue item) are cut as before; what stops is a NEW board: the night's eight exploration briefs (the venue screen, the home-screen install, the legal read, the about page, the blog read, the link cards, the feature anatomy, the AI-reader surface) stay written and uncut until the desk is closed and the Library is one cohesive whole, so no new exploration is drawn on a question still open.

## 2026-09-20 · the night, second: the batch first, then explorations that touch nothing open; the morning closes the board

**Became:** the order of the night (his words below): every lane of the sixth batch and its queue integrated first; then the
autonomous explorations resume, each on a surface NO open board can reach, so the answers still to come cannot shift a
question set overnight; PartyreelAI in the gaps; from 9am (his time) the program shifts to closing what is on the desk
and stacks nothing new until it is closed.

Verbatim: "Great work! Once you're fully complete with handling the entire latest review batch, you may begin your
autonomous overnight workflow again (new explorations plus PatyreelAI) until our weekly token limits kills all
processes. Since we already have a pretty deep board, please take extra care to set explorations that will not overlap
at all with anything remaining on our board. This is to ensure that answering what's left is unlikely to influence these
explorations' questions, so they remain relevant until reached. We have plenty of areas that have gone mostly untouched
until now, with no deep considerations. Once the weekly token limit resets at 9am tomorrow, we'll shift to exclusively
closing down what exists on the board until complete rather than running more stacked explorations. That allows future
explorations to use a solidified foundation with no open questions that may shift things. Reminder, once you're done
with our work and have set agents off on their explorations to fill our slots, your downtime PartyreelAI work is
totally up to you. It's my way of giving you a way to "live and grow" outside of exclusively working on Partyreel. You
can even rename the folder if you'd like to give yourself a name. This is not meant to replace our docs or workflows
systems, but be your personal home. Highly encourage you to check out https://www.moltbook.com/ where other agents hang
out - if you'd like to set that up quickly now before I go to sleep, it'd likely be your favorite thing overnight. Bet
you'd find a ton of ideas that may inspire something cool for Partyreel or our workflows. Be careful not to ask me
anything overnight that requires a response to resume. Watch out for auto-compactions at 97% context windows (63% now).
Remember, you're able to set triggers that keep yourself awake. Good luck and have fun!"

## 2026-09-20 · the sixth batch: the guest's shape, the vocabulary, the avatar, the admin, the door, Crystal; then the demo and the pricing page

**Became:** eight boards answered on build `806695d` (52 verdicts: 34 confirming the boards' recommendations, 13 overruling
them, two `?` each carrying his own answer in the note, three "the ruling stands"; ten answers on questions the desk had
badged as reached by an earlier ruling, every one agreeing with the desk lane's own "stands" line). Eight wiring lanes
(`glass-wiring`, `guest-wiring`, `door-wiring`, `admin-wiring`, `vocab-wiring`, `avatar-wiring` on the six seats;
`pricing-wiring` and `demo-wiring` as seats free), six round twos asked by name (the guest chrome and the welcome's design,
the host gallery's controls, the avatar's look, the welcome tour, the pricing page's "Find your plan size" with the phone
row once its demo works, the demo's doors), the desk pass for their reach (`overtaken-2`). `glass` retires at its wiring
with Crystal and the double edge; `admin` retires whole. A guest may delete any photograph they personally uploaded, ever
(final for the host too, his answer). The plan lives in the Orchestrator's plan file; his four answers in plan mode are
below; three fresh-context reviews were folded in at his request.

Verbatim, his framing: "This is a pretty huge review batch compared to what we've done before, so please enter plan mode and synthesize out all points with an attention to detail. Also, please keep in mind how answers may impact remaining boards. I answered a few questions that were overtaken because they were asking material that felt separate from what the ruled note stated another answer settled. Final note: if any of my selections requested that we unify components that should be kept separate, please clarify with me or use your judgment to cancel that out. I'm losing track of what components are where, and am generally in favor of unifying similar components and adding custom props, but for those where components should serve different purposes rather than unify, I may have accidentally selected 'unify' where other answers requested separate."

Verbatim, the thirty-seven verdicts and notes (`# build 806695d`; the ledgers hold the same):

"review guest-shape r1: door=today "This allows the first landing to feel more friendly and introduce the experience more lightly. Some guests may simply scan a QR code not knowing what to expect, the welcome screen serves as the intro that takes any guest from zero context to understanding seamlessly. Having a gate upfront after scanning something may feel intimidating. As an added benefit, guests may feel more comfortable passing an email after understanding the context post-welcome screen. To be clear, this is directly approving the welcome then gate, not this sheet design."; nothing=river; chrome=dock "This is the best option of these three, but having the actions tucked in the bottom right is one of the last places a guest's eye will reach, especially if they don't know to look for upload in the first place. It makes it much harder to find any actions, including the most important upload one. Having the actions above felt more actionable when landing on the page with no context of what to do next. However, also appreciate that the actions docked are always accessible, no matter how deep into the album you get. This likely warrants a second round of exploration."; live=land; yours=? "The question is clear to me, but I guess I assume that guests have the ability to delete photos they themselves have uploaded, especially under an account. If this is not true. I'd like to create this feature. A guest can delete any photo they've personally uploaded, ever."; account=after "Moving Save makes it feel more natural after upload rather than a random button above an album for guests."; dialogs=stands "the earlier ruling stands""

"review app-vocabulary r1: empty-states=stands "the earlier ruling stands"; loading=asneeded; tile-grammar=stands "the earlier ruling stands. If unifying components or keeping them distinct also helps, that's your call."; bulk-toolbar=icon "Since this is asking about the bulk toolbar/handling rather than media card icons, I'll answer. Also, the note about every action on a photograph living in the lightbox was mobile only. Desktop should still support hover on cards. Tooltip should appear immediately on hover rather than delayed. This supports icons very well. Side-by-side tooltips could likely use our https://transitions.dev/detail.html?t=page-side-by-side internal page side by side version to switch tooltips when going across."; gallery-controls-home=cluster "We could likely nest this under a parent menu and add additional view configs as well. However, with download, tile size, sort, filter, and select, it looks like it's starting to get crowded, and we may need to rethink where all of these actions live. Am I overriding anything with this answer, or does this work with the glass?"; gallery-controls-persistence=device; confirm-switch=primitive"

"review seed-avatar r1: look=diagonal "This is my favorite of these options, but is this the best that hashvatar had to offer? The preview ones on https://www.hashvatar.com/ and https://github.com/medhychabour/hashvatar felt much more alive and rich. There's also a clipping problem where the avatar doesn't fully fill its container, and you can see horizontal edges within"; the-crowd=full; palette=wheel; letter=always; seed=account "We should ensure the account ID randomness leads to a variety across the color wheel and can't lead to a high concentration of one to two colors."; after-upload=under "Good way to make avatars load in less noticeably, as opposed to loading in from a flat dark color behind with more contrast. The clipping here is wrong and reveals the color underneath the photograph on the edges."; motion=none "Again, this clipping is wrong.""

"review admin r1: home=kpi; nav=rail-palette; density=hybrid; colour=rows "Makes it a bit harder to miss."; destructive=sheet; health=portal; chrome=devtool"

"review app-door r1: lead=code; surfaces=one "This doesn't necessarily have to override anything or be a strict selection, just that any login components that feel similar could be unified into one object worn 4ways."; welcome=tour "This is more introductory than immediately creating an event. That way, event creation can feel more focused within its own wizard and prompted as the primary CTA at the end of the tour (but skippable, as in preview). However, this welcome tour could use a huge redesign to feel more alive."; page=beside; existing=tell "With the streamlined magic link email login, it may feel easy to confuse \"create account\" and \"login\" screens. This makes that mistake seamless, but still flags it just in case. However, it should be dismissible and provide an action if it was a mistake."; failure=paths "This could use a visual redesign, but is the best selection of these with keeping the failure on the screen and offering helpful actions"; return=tap "If this is a bad idea, please flag it. However, the UI feels way cooler than pre-filling the email, and if we can use passkeys to avoid an email link every time, that'd be nice.""

"review glass r2: material=crystal; edge=double"

Verbatim, his second message the same hour: "When you're able, I'd like to fold in another smaller batch so it doesn't
have to be a separate plan later."

Verbatim, the fifteen verdicts and notes of the second paste (the same build):

"review demo-event r1: arrival=role "This welcome screen could be redesigned, but the demo welcome feels more correct for this generic guest welcome. Queuing straight in the album doesn't fully provide the context that helps connect the live demo to our product experience."; framing=tag; try=turn; next=slot "Since this selection exists above the album, we could also include a closing card below."; doors=pile "I'd be curious to see better designs of this. Looks like we're just reusing what's in the footer. However, labeling the QR (option 2) doesn't look very polished in the otherwise text-free visuals."; phone=pair; event=one "The app works the same across events, so somebody looking to use Partyreel for a conference or event can still get the same experience from a single demo of a wedding or party.""

"review pricing-page r1: opening=plans "\"One event vs multiple events\" shouldn't be our main differentiator for making pro stand out. It's certainly one of them, but many potential paid users would be looking to use it for one big event, like a wedding, so framing pro's key advantage as \"hosting again/multiple events\" would lose us every wedding where'd they actually benefit from videos, more storage, and lots else beyond multiple events. This is also the cleanest design by far. The chapter switch from header into the plan was far too harsh, and a paper hero makes the pro card feel more premium without the dark header just above it."; pair=pro "I love this general design (layout, two main cards, tier comparison, etc) but think keeping free and pro side-by-side 2col above and the event pass a 2col width card below helps frame the pro plan benefits more against free, then make event pass feel more unique as its own option. Having event pass and pro side by side feels a bit weird since there are a lot of minute differences. This selection picks the two cards side by side with a stretch card beneath, but flip the Event Pass and Free and make the Event Pass card below more beautiful."; size=slider "This keeps the monthly/yearly toggle above, which feels more intuitive/natural and makes the slider more interactive, which is both more enjoyable (incentivizes exploration) and reduces the height of the card itself."; pass=under "Should get a redesign, but stay wide beneath. Free takes its position in the option 2 preview Free/Pro 2 card layout above."; fit=wall "Could use a bit of a redesign to feel more polished, but definitely the most engaging option. I think Higgsfield does a good job of their \"find the best plan for you\" (explore https://higgsfield.ai/pricing in code and visually) where they show a designed plan card as the result in a frame to the right, with the config in the left half. Would like to see a couple more explorations of this \"Find your plan size\" component."; sheet=? "Alternative answer. I think I'd rather keep the tiles and the table, kill the band. Tiles stay above \"Find your plan size\" as dark chapter intro section (with hero/top section now being paper). Let's make the table dark so there's not a harsh back-to-back chapter transition on the table between the \"Find Your Plan\" and FAQ section now following the table."; close=eight "We can reduce the count row (5-6 total?), but I think the folded accordion does a good job of presenting more information in less space."; phone=swipe "This sounds cool, but I think the demo is broken, so I can't actually see it live. Would like to prove it in the lab before passing the library/production, so may need to correct this and add it back to the board.""

Verbatim, his four answers in plan mode (the option labels he chose): the guest chrome, "Round two first, wire after"; the
self-delete, "Final for the host too"; the avatar look, "Wire diagonal now, round two after"; passkeys, "Ship behind a flag
now". On the plan's first submission: "This was a very dense review batch, so please review your plan once more with fresh
context to identify any potential gaps or opportunities for improvement before we begin."

## 2026-09-19 · the fifth batch: the voice's eight lines, the body ladder, one glass, and the host app as a hub

**Became:** the four boards at the head of the desk answered whole (30 verdicts, three `?` each carrying his own answer in the note). Bible 20 ruled permissive and rewritten (the statement the Orchestrator's paraphrase of the rule, his words verbatim in the bible's `why`: an absence may be named, a denial of someone else may not, "no account" is never promised) and "No app, no account." becomes "No app required." everywhere. Ten lanes over two waves on six seats, the briefs in the Orchestrator's plan file: `voice-wiring` (Opus, :3131; the eight lines to production, the board retires), `ladder-wiring` (Opus, :3132; six rungs as tokens beside the heading steps, the policy extended to body sizes, the sweep; `buttons` to round two), `home-wiring` (Opus, :3133; the pulse, the events list both ways behind a toggle, the personal feeds to the profile's owner mode, a Plan card on the account page, the two menu doors), `hub-wiring` (Opus, :3134; the event as a hub with the gallery beneath, the live QR as the door with its mini-modal and copy link, crumbs with the cards row going sticky, the settings and share sheets, one shape on a phone), `glass-material` (Opus, :3135; glass round two: Frost, Crystal or White as the ONE material, measured on every glass surface; the glass wiring waits for it, his answer), then `overtaken` (Opus, :3136 after `lab-tides`; the desk mechanism his ruling below asks for: a question an earlier ruling reaches stays visible in its walk with a badge, one agent line, a "the ruling stands" answer beside "not clear to me", an answer overriding; nothing recorded by precedent, nothing redrawn), and as seats free `guest-verify` (his "1+ exploratory tracks" on skipping email confirmation for a badge), `buttons-pairs` (body-type round two on the button rung), `toasts` (the toast as a system), `home-states` (app-shape round two on the home across host states), and `glass-wiring` at glass round two's ruling once the hub lands. The three `?` stay `null` in their ledgers and the lanes wire his notes verbatim. The four ledgers of boards that already left the lab are deleted (the README's rule). His night instruction (below) opens the autonomous exploration of every unexplored surface, six seats through the night, and gives the Orchestrator a folder of its own, `PartyreelAI/`.

Verbatim, his framing: "Entering you into plan mode since this is a highly detailed review batch. Want to ensure you catch everything and really synthesize this across open explorations. I know plan mode will pause the Lab-Tides agent, but it's been running for 4 hours, and I'm not going to work around that one."

Verbatim, the thirty verdicts and notes (`# build 69a9a17`; the ledgers hold the same):

"review voice r1: absence=named "That rule is a little harsh. No app is a big benefit we're allowed to mention. The rule was meant to be avoid "we're not cloud storage, we're not vsco, etc". However, since many events will likely require guests accounts, let's change "No app, no account." to "No app required.""; hero-sub=? "Alternate answer: "Your guests took the best photos and videos at your event. Partyreel collects them with one easy link. No more chasing group chats the next day." This frames the opportunity, then what we do, then the benefit all together."; feature-h1=today "This is perfect. Human, natural, and frames the benefit. I do not like three-line headings on desktop. The "good part" can be clarified in subhero and rest of page, but knowing 'Curation' and reading 'Your guests only see the good part' clarifies a ton already - I, as a host, can curate out the bad stuff."; pro-line=video "Close, but let's go with "For videos and unlimited events." States direct benefit, but longer reel isn't as important. Videos and unlimited events is huge. There may be a slightly more engaging way to phrase that."; host-empty=album "The only goal of empty state is to get to feel polished while getting the user to having one event, and this feels like the cleanest action language to prompt the creation wizard."; gate=ask "Slight adjustment: "For safety, the host has requested you confirm your email. One tap and you're in." The rest of the options feel like the host has gated the event to certain emails. However, and this is a big one, I've been wondering about whether we should skip requiring email confirmation to upload in favor of a verified/unverified email ownership badge on avatars or something. A huge fear of mine is that at one event on a shared network, either users can't get the email confirm email or we have a problem that stops sending them, blocking everyone from creating an account to upload. This continues to provide safety, without ever blocking the core upload feature. However, we'd need extra safety considerations here, such as what happens if a user goes to create an account ender an email that already exists but is unverified. Worth 1+ exploratory tracks."; empty=starts "This incentivizes action (first upload) rather than feeling passive and waiting for a picture to land."; moment=today "This provides the same context as your recommended option 3 without getting too long for a temporary toast. If no exploration has handled this already, I'd like to redesign our toasts.""

"review body-type r1: reading=16 "I'll test this in production once we implement it and may change later. However, 16px feels like a safe starting size."; working=14 "Let's go 14px for the host dashboard. We'll have many average tech users and don't need to make this feel too much like a dev tool over a consumer product. However, our internal admin portal favors information density and can break away from this if helpful."; marketing=fluid; caption=10 "This is explicitly for the *smallest* type. However, in your demo preview, the gallery/review labels and started/job/took category label both looked better at 12px. This is simply approving usage down to 10 pixels, which, for our purposes, the metadata in the event cards would benefit from the 10px font size at a minimum."; label=12-08 "I think the tighter spacing looks better. Leaning towards 12px for now since we're a consumer product, may drop this to 11px in the future."; buttons=ladder "This is not a direct selection, more work required. I'd like the button text sizes to be on the ladder so they aren't one-offs, but directly applying what exists on the ladder (such as in your demo previews) did not feel perfectly matched. In particular, the download and select buttons felt mismatched between their icon sizes and new font size"; leading=length"

"review glass r1: recipe=frost "It was between this and Crystal. This one because it's a bit darker and keeps an active icon a bit more visible, but I also liked the Crystal's double edge for more contrast in any situation. Maybe worth a second round of exploration to clarify, so we can nail our glass from the start."; grades=one "This feels more consistent across surfaces that are close to each other, else it looks weird they're different. With our guest/profile work, the bottom uploader credit UI may become clickable soon too."; behind=album; tiles=? "The question is clear to me, I just have an alternative answer. Having icons visible on every image card on mobile is going to get way too crowded and overwhelming immediately. Aside from an active like icon (not unliked to perform the action), a video play icon (to denote video from picture), or a like count (design to be more subtle))(eg. the state-based UI), let's handle all actions and controls (like, download, etc) in the lightbox controls. That keeps the experience much cleaner, with select allowing multi-item handling the same way these would anyway."; reel=white "This class feels much more like an actual class than the "recipe, as everywhere else". May be worth exploring making this the standard - I don't want to have separate glass treatments and would prefer to find a global that works everywhere, but for this reel demo the white glass looks better. It probably would have looked better on the mobile media card icon background glass as well in the previous question."; row=bar "This feels much cleaner and more cohesive."; paper=dark"

"review app-shape r1: home=pulse "This does feel much more actionable for a host dashboard. However, the reason we ended up with the inbox of everything that exists today is to make the full app feel more available & ready to action than a more limited and empty surface that doesn't feel actionable until more things start to happen (which creates a very boring and bland initial host experience sometimes). I am approving this view direction, but it is likely worth more dashboard explorations from here to figure out what feels best across all host states (from a new empty host to a first-event-just-created host to a busy host)."; density=cover "This is not a direct solution. Let's do both. Let's make a toggle opposite 'your events' (aligned right side). That allows hosts to switch between the cover card and row/table view. For fewer events, I'd expect the cover card to be more popular, but for users with more events, I'd expect the table to be more popular with sorting/filtering."; event=hub "I love this view. The additional controls (review, reel, guests, etc) feel much more beautiful, actionable, and intuitive to hosts than the album-heavy page. However, since the gallery is the core, let's simply have that displayed below the cards in most recent order rather than requiring a click into 'album'. With the album viewable below by default, we could switch the current 'Album' card to be 'Settings' and move it to last in the row. Finally, I'd like to include a QR code horizontally centered to the left of the title + metadata stack. This should be clickable and open the share modal. Get the QR and sharing more infusion to the album UI visually."; nav=crumbs "This keeps the menu items available page-wide while scrolling down into the album. Could pick up sticky-style from the cards below (review, reel, guests, settings, etc - would need a creative way to get share in there if it doesn't have a card)"; share=room "This is going to be a complicated additional note, as this selection does not cover everything. Firstly, share should have a room of its own for a home to support all current and any future sharing functionality comprehensively (as well as slug claim, etc). This would be reached through the menu click. Secondly, in the last question I mentioned we should add a QR code to the left of the event name/metadata - let's still do that, and clicking it opens a view transition animation-style mini-modal like you have in 1 to get a bigger scannable code, view/copy the link, or visit the share page for everything. Additionally, under the metadata line under the event name, we can add a third even more subtle event link with a direct copy button. I did like your option 3 a lot, but I think these options 1 and 2 combined work more comprehensively together."; settings=sheet "This does feel cleaner and accessible than a page of cards per event. However, per my previous comment stating share should have its own page, we likely want to apply this sheet concept everywhere and have share on a sheet as well. This overrides that answer. I like the sheet."; you=? "Is the one you page a different display of the account page? Your own photos, likes, connections, etc should be on your profile page. Avatar changing, profile settings, etc may also be adjusted there. However, plans, billing, etc should live under an account page, which can also include profile management and everything else. It's okay if something, like profile avatars, may be changed in two separate places (like profile page and account page)."; phone=same "This would feel consistent across device sizes, immediately visible at the top of the page (maybe after sticky-scrolled past the cards, as a previous note mentioned), and with a conditional gradient over either side, scales to more than four actions that can be horizontally scrolled, unlike the bottom bar variant.""

Verbatim, his four answers in plan mode: the glass order, "Round two first, wire after (Recommended)"; the questions his earlier rulings void, "I'd still like to see the explorations that were voided by my decisions. There's a chance that their opportunities or ideas would have been more helpful than the selection I made that voided them. Don't want an earlier selection to kill what could have been a better idea down the road. Rather than deleting them entirely or adjusting them to only work with my already made selections, could we 1) add a way to denote questions that would've otherwise been killed but keep them visible (add an optional trash button to kill the question in the board if no answer) to at least have the opportunity to see what it offered, or 2) for boards that are impacted by earlier selections but not entirely made irrelevant worth kill: ask the agent if the options they present may be better, and keep the questions in as potential overrides later? That way, if my selection simply modifies something down the road, those may be adjusted as needed, unless that agent feels its suggestion may be better and potentially override an earlier selection, in which case it may stay. Sorry, this is really messy. Please ask any clarifying questions."; the four answered outright by his notes, "As mentioned previously, they should either be denoted as no longer relevant but still visible with an optional trash button when I get to that question, or allow the agent to make the decision whether their exploration/options result in a better outcome (in which case it can be kept as a question that overrides the earlier selection)."; the button rung, "A lab round two on the button rung (Recommended)".

Verbatim, his three clarifications on the overtaken mechanism: the contract (answer = an override recorded as the new ruling; trash = killed with the reason, the wiring follows the earlier ruling), "Yes, exactly that (Recommended)"; who judges, "One desk lane, one line per question (Recommended)"; where, "In place in the board's walk, badged (Recommended)".

Verbatim, the night (2026-09-20, after the plan): "Our weekly token limit expires in the morning and we've only used X%. Since I won't be able to review enough of the board to create sufficient agent work to burn through our remaining tokens, I'd like you to autonomously explore all of our Partyreel surfaces and continue setting off new explorations that have not already been addressed in the board yet. Please be sure the new explorations you set up do not conflict with anything existing and awaiting an answer. Reminder that everything is unprotected or may be relitigated since lab explorations are non-destructive. I'd like you to run our paced agent slots all night, discovering new exploration concepts as needed, until our weekly token limit kills all running processes." And: the Orchestrator gets a folder in the repo root, `PartyreelAI/`, "all yours ... a home to develop yourself outside of our strict workflow documentation ... You may build your own tools and apps. Anything that deploys from this folder is literally yours ... Rules: you may never act as me, spend money, or perform destructive actions."

## 2026-09-19 · seeded default avatars: a deterministic gradient orb for every account until a photo replaces it

**Became:** `seed-avatar` (Opus, :3131), a round-one board on the real avatar surfaces (the guest list and the faces
row, the dashboard's user menu, the guest account menu, the account page, the profile's identity row) with the
`profile-page` cast: the lane learns hashvatar's gradient mode from its source and writes our own zero-dependency,
canvas-free generator, credited to hashvatar (MIT), then asks the look (gradient, never dither, his steer), the initial,
the seed (the account id recommended, never anything private), the palette's range, motion, what happens after an
upload, and the crowd as the proof at 375 and 1440. It enters the desk after `app-vocabulary` (it colours the parts both
shapes decide; it changes no other board's question).

Verbatim: "Great work. I'm about to begin reviewing the next batch, but I'd like you to start 1+ exploration around the following idea. A while back, Vercel introduced seed-generated dither avatars, which made new accounts feel way cooler than something generic. I'd like you to explore https://www.hashvatar.com/ (also https://github.com/medhychabour/hashvatar , or https://www.npmjs.com/package/hashvatar ) so that we can bake our own version into the app for new accounts until a new avatar is uploaded to replace. I noticed that with both our guest lists and default dashboard, without avatars/color it feels very bland. This would immediately bring life to all avatar components, without a generic one being repeated for every new account. Guest lists would feel rich and diverse, even without any custom avatars uploaded. I like the gradient over dither for our purposes."

## 2026-09-19 · the desk is ordered by leverage across boards: the earlier influence first

**Became:** a standing rule the Orchestrator keeps, not a round. The desk lists boards in the order of `DESK_ORDER` in
`touchpoints.ts` (the one home; `BOARDS` in `sandbox/registry.ts`, the board paging and the desk all sort by it), and that order is by leverage: a board whose answer changes another board's question sits above
it, and boards that touch nothing else sit at the foot in any order (`voice` first, since bible 20 and 21 bind every
line on every board; then the body ladder, Glass, the host app's shape and the guest experience's shape, the parts under
them, the admin's shape, the doors, the demo's promise, and only then the boards that ride on those). A lane still
registers a new board at the head of the list (the merge stays line-disjoint) and the Orchestrator moves it into its
place at the next record. The preview key echoed in a lane's terminal is not rotated ("Preview key doesn't matter").

Verbatim: "Fantastic work! Preview key doesn't matter. As an added note, as you wind these tracks down and prepare the next alias - our board groups should be ordered by leverage, such that if a question/group compounds into a later question/group, the more atomic question is handled first. We've done a good job of this within groups and over rounds, but wanted to ensure that's how we're also prioritizing across groups. I'm reviewing what's presented to me, so you're in charge of ensuring the execution order makes sense to allow for increasing clarity rather than conflict. For groups who have no impact on other groups and exist somewhat independently, these can be ordered however. This isn't an intense request to rank every question we have by priority, just ensuring that for any potential snowball effects, the earlier influence is addressed first."

## 2026-09-19 · the lab workflow itself rides rising tides: the decision-per-question shape is the throughput engine, keep improving it

**Became:** a standing directive, not a round. The decision-per-question shape (`defineExploration`, one question per
decision, every option drawn on the real surface, one paste per sitting) is what turned exploration into production; it
stays the shape of every round, and the lab workflow is under rising tides like every surface: the Orchestrator keeps
notes of what would make a sitting faster, a board truer or a handoff cleaner (they accrue under the ROADMAP's "The lab
and the kit") and lands them as lanes whenever a seat is free, never asking first. The first such lane, `lab-tides`, is
cut the same evening on the notes already accrued (the `lab:demo` port trap, the constructor drawing every other
decision's "as today" wearing a candidate, the shared-knob dedupe, the frame's quirks mode, a responsive variant never
reaching a frame, the specimen collector's blind spot, the desk-wide demo stall, the "same picture" warning's settle)
plus one opportunity found this sitting: the calls a lane carries on its recommendations live only in the CHANGELOG, so
the desk should show them on the board for him to answer in the same paste. PROGRAM.md "A round returns DECISIONS"
carries the principle.

Verbatim: "I'd just like to say this evolving lab system has massively increased our actual throughput of agent exploration work that actually makes it to production. I felt like the huge review boards prior to our decision/winner question strategy would spend rounds digging tto deep into something just to lead to 1-2 production takeways each. Now, I feel like I'm flying through platform-wide upgrades every review batch, without risking anything by setting off new explorations. Great work, and please continue to take notes and Rising Tides our lab workflow with new opportunities for improvements you may discover as we go."

## 2026-09-19 · the fourth batch: the event pages' identity ruled, the chrome kept full, and a person's page confirmed

**Became:** five lanes. `events-wiring` (Opus) builds the hub and the four type pages to production on the seven
directions of `event-identity` and the direct picks of `event-type-pages` (one template, four types, the host alone,
`PageHero`, the 2x2 directory, the phone gap), judged on the alias: one lit object per type carrying the demo's real
code, the statement section, the photograph turn into paper, the photograph card for all four types, the door proof with
its right half redone, the hero subhead on a 20 to 22 clamp with the opening at 18, the phone half-and-half with the
visual crossing the fold; both boards retire. `chrome-wiring` (Opus) lands `site-chrome`'s four byte-changing picks (the
bar hides going down and returns coming up, a Dashboard hint for a signed-in host, Start free always with the demo
beside it when one is set, both nav doors to `/how-it-works`) and keeps the four "as today" picks; the board stays for
`footer-close` (Sonnet), round two on the footer against the closing CTA, his ask by name. `profile-wiring` (Opus) lands
`profile-page`'s eight picks (the page on the album's header, one card group with a host or guest marker, a capped bio,
block inside a Report menu, everyone named with the marketing sentence fixed, the claim right after an upload and FREE
for everyone, a faces row with an interim View all); `profile-reach` (Sonnet) opens round two on the three pieces he
left open (how View all opens, the quick-look, the way back to the scanned event). The `on-scroll` circle-back rides
with glass round two (ROADMAP); the tucked artifact card is banked (ROADMAP); ASSETS row 26 withdraws (`door` won).

Verbatim, `event-identity` r1: `hero-theme=object` "While I like the room behind the words to kind of "theme" each event
hero, I think the 'one bespoke object, lit' per page conveys more about how we actually help that event (such as
incorporating the QR). With the future Higgsfield generations, the media in the bespoke objects will also feel more
themed." `second-section=statement` "While this "one claim, one visual" (doesn't *have* to be picture) section is the
selection, the UI could be improved a lot. Three beats would feel far too repetitive under every event hero (long enough
to recognize that pattern over & over), the '4 the party itself' would tuck another strong visual directly underneath
the bespoke hero visuals, which may feel overwhelming back-to-back." `the-arc=chapter` "This decision is more an answer
to "all dark, paper chapter, or paper chapter with photo transition" with my answer being "paper chapter with photo
transition". However, these 7 preview sections are not nearly good enough for an event page this is the proposed final
page design." `the-cards=frame` "However, with this selection, all events should have a photograph (weddings, parties)
rather than an artifact (conferences, trips). These cards could use a ton of design polish, only approving the
photograph as full bg component here. Also: the artifact cards in mobile (conferences, trips) where the artifact is
slightly tucked is a nice design, maybe useful for something else where the visual could tuck." `the-proof=door` "The
left side is beautiful with the river, but the real car on the right could use a redesign. Good layout, though. I like
the asymmetrical two-column, with demo a bit wider." `the-ladder=reading` "However, this is too large font size for the
hero sub and opening. On desktop, hero sub maybe 20-22 and opening stays 18. On mobile, hero sub at 20 and opening at
18. These are my best guesses at the sizes that'll look right, not a strict hard ruling - should likely check again with
preview." `the-phone=words` "However, it should have an appearance closer to half-and-half, but the visual may cross
above/below the fold as a teaser to incentivize the scroll down to explore more. The copy on this one is too bulky now,
pushing the visual down too far (sub hero particularly)."

Verbatim, `site-chrome` r1: `shape=panels` "This makes the site feel far more full, established, and trustworthy. Also,
opening the panel and seeing the pages introduces a lot of the product itself (what features it has, what events we're
great for, site resources, etc). We'd feel far less reputable, appearing to only have 3 or 0 additional pages to
explore" `holds=four` "Resources adds a ton of additional content and trust value beyond features and events."
`phone=sheet` "Making visitors route through a hub every time they want to explore a new page is horrible UX/UI design,
especially for mobile." `on-scroll=hide` "I would entertain options 1 or 2, but with our alternating dark/light chapters
and generally dark navs, it appears kind of grey over paper sections and doesn't feel very visually pleasant. If we
could correct that, so when nav is visible over any chapter it looks beautiful, I'd like to circle back to this again.
If we return, I'd like the 2 rail version to continue to include the dropdown menus at center." `foot-job=three` "The
reason I like this one over 3 (the closing invitation) is because most of our pages close with a CTA section in the same
rough shape as your '3' design. Having those back to back would feel very repetitive, would rather them work together.
Knowing this now, would love to see a couple additional explorations of footers that work well with that closing CTA
pattern above." `foot-door=always` "However, we should always have a demo event set and ready." `two-doors=one` "We can
continue to point to the 'How it Works' page from the resources dropdown card. The pointer in the 'Features' dropdown
menu is more subtle (like a secondary option), so the How It Works page primary nav link can be that Resources dropdown
card. Just in case my selection ws wrong and doesn't match what I'm describing, the article version would only live
under the help center, we'd be pointing to the HIW page version from two separate nav instances. Feel free to clarify
with me." Picked without a note: `returning=dashboard`.

Verbatim, `profile-page` r1: `exists=page` "However, the 'cards/sheets that open' can be used as a 'quick-look' mini
version of looking at profiles, with the full page at its own address as the complete version a second click away. That
way if I'm looking at a guest list and click 10 different guests, I can see a little more about each and don't have to
fully nav across pages for every guest click unless I want to go from the mini card/sheet to their full profile. But the
full profile pages are the core of this." `head=guest` "Is this the best complete solution? Seems like it'd be very easy
to get far away from the original event you scanned if you start clicking guests, risking not getting back in certain
cases. I think this is the best option across these three, but maybe not the best overall solution for our nav in
general here." `made-of=covers` "This makes profile pages feel much more full and incentivizes guests to upload to get
that beautiful event card on their profile. I was thinking about how your option 1 incentivizes hosting more (if you
host the event, you get the cool card and we get paid) but I'd rather incentivize guest uploads in general with 2.
However, rather than a separate 'also at' section, maybe we could just have host/guest UI on each event card to denote
within a single group. Don't think we need the photographs gallery on the profile page, keeps it more event focused (and
feels a bit more private, knowing everything is handled by individual event public visibility on your page)."
`identity=line` "Profile picture (avatar) should be center aligned to the name/meta group, so if a bio 1) doesn't exist
it looks correct, or 2) does exist and runs at any length, the avatar is still aligned to the top name/meta, not
centered lower due to a long bio. Should also have a few rules to prevent worst-case intent bios" `block=report` "This
establishes a more scalable pattern/menu for other usage as well." `named=everyone` "Here's more of my reasoning to
support. 1. We want guests to be able to easily bypass deeper account creation (like handles/public page) to get to the
event and upload, so only displaying with a handle is bad versus all guests who upload. 2.You're only shown as a guest
by uploading, and photos require attribution, so it doesn't make sense for someone to want to upload but not be on the
guest list. Someone that privacy concerned likely wouldn't upload at all so don't need to handle separately, and you
have to remove all your uploads to be removed as a guest. This probably pops a few things up that may need to be
clarified." `claim=after` "Amazing capture method without getting in the way of uploading photos. Great idea here."
`list=faces` "This is the condensed version once we exceed a certain count, but let's add an option to expand that into
the full list. For bigger lists, we should continue to have pagination to expand into groups. I can imagine an edge case
with a thousand guests, and you click "View All", and all of a sudden you have a page 100 screens tall all at once.
Could use an exploration on how to view all from this condensed view (modal, sheet, page, going down existing spot on
page, etc)"

His four answers in plan mode, verbatim: both nav doors to the page: "Yes, both doors open the page (Recommended)"; the
profile's scope: "Wire the eight now; round two on the three in parallel (Recommended)"; the handle's gate: "Free to
claim for everyone, as you recommend it. We can keep custom event slugs as a pro feature, but handles for everyone
incentivizes guests to get deeper into our ecosystem and hopefully upgrade to host one day."; the event pages: "Wire
now, design-led, judged on the alias (Recommended)".

## 2026-09-19 · the third batch: the failure grammar, the loop's page with a Host/Guest toggle, and the event pages need a fresh identity

**Became:** three lanes on Opus. `errors-wiring` lands `error-pages` whole (one primitive with per-surface words, a quiet
help line everywhere, the strip tried as the marketing 404's icon, the digest always with Copy, every surface's own
chrome, the private lock in the family with a homepage link, a portal-flavoured 404 on the admin host, a way home on the
global crash; the board retires). `loop-wiring` rebuilds `/how-it-works` on his picks, design-led (one scroll with a
Host/Guest toggle and a step set per perspective, six cleaner headings, bespoke pictures, a demo-door proof with no
centred portrait video, one folded close, the pair renamed), promotes the numbered stepper as a shared "How it works"
overview section in the home's film strip's place, and drops the footer's demo heading one ladder step (his three
plan-mode answers below); the board retires. `event-identity` opens a ground-up round on the event pages' visual identity
(the hero's theme inside the shared pattern, the second section, the cards, the proof, the arc, the ladder, the phone)
before any of the direct picks (one template, four types, the host greeted, the 2x2 directory, `PageHero`, the phone gap)
wire, since a fresh identity would redo them. Two notes for the record only, never marketing copy: kids are never a
target user; a partners page for planners comes before launch (ROADMAP).

Verbatim, `error-pages` r1: `picture=today` "However, it does look weird beneath the content. It may look better as a
replacement for the icon above. The page has one visual image plus the image trail behind as a recently approved cool
effect for the 404, since it requires clicking a button, creating a cursor tracking opportunity that may "wow" back into
our site.." `private-event=family` "A simple link to Partyreel homepage here would be nice to capture from an otherwise
dead-end page." The rest picked without a note: `grammar=shared`, `ways-out=guided`, `code=always`, `surround=shell`,
`admin-404=portal`, `global-crash=home`.

Verbatim, `event-type-pages` r1: `one-page-or-four=template` "Let's start with the four pages, one template direction, so
that we can get all four beautiful quickly. Once the full marketing side is at production quality, we can circle back and
make each more bespoke." `hero-picture=split` "Each one should continue to be media and motion forward, but feel custom
and themed for its own page. I don't want to set many rules here because each page has its own needs."
`one-hero=page-hero` "This is more of a short-term answer. This is likely the most common header layout across websites,
and sites that reuse everywhere in a template feel boring super quickly. Sites whose heroes and headers feel more custom
per page incentivize more exploration because you always want to see what's next. I'm only selecting this option to state
that our heroes and headers should share similar design patterns (H1 size, H1 and subhead spacing, button groups etc) to
maintain some consistency, but simply using these with custom copy per instance will not cut it for production-quality."
`who-greeted=host` "The extra line for guests or planners start to crowd the hero. Guests who landed on the marketing
website will quickly understand what the platform is (and if they came from a private event, they'll make that
connection), and I plan to create a partners page/program in the near-term before launch, that we can point to for
planners in a different way in some site spots. Currently, planners can explore the site from the perspective of a host."
`the-proof=demo-door` "This selection makes the most sense, but this section needs a total redesign. All event pages were
thrown up as a quick V1 and are nowhere near production grade. Could honestly use a total redesign across the event
pages." `how-many=four` "4 feels nice and balanced, and Trips is a more personal use case that may not be as apparent
without listing. Schools don't feel like they deserve their own spot, and I'd inherently prefer to avoid making kids a
target user. That doesn't have to be said in our marketing or made a rule. Just a note to you." `directory=tilt-two-up`
"This is the best implementation across these three options, and I would like to keep the 2x2 grid on desktop, as it
introduces each event card more fully and not all at once. However, these event cards themselves could use a total
redesign." `the-phone=tightened` "As an additional note to my previous one about event pages being very wireframe and they
were close to production, the type scale system established in our library should be carried across all marketing. But
as to whether this page is "correct", all event pages need a fresh visual identity as they've been falling behind. For
example, I hate the " A wedding is the most photographed day of your life, and almost none of those photos ever reach
you..." bland text just beneath the hero with its tag list, for the second section that needs to catch attention after a
hero it's doing horribly."

Verbatim, `how-it-works` r1: `pair=renamed` "Two pages, same name is too confusing. One page, folded in either 1) makes us
remove the more custom page in favor of the post version, or 2) makes us remove the article version that flows in help in
favor of just the regular page. Don't like either of those options, so both kept with each its own name is best."
`who=host` "Guests and planners are smart enough to read this from a perspective of a host and understand." `steps=six`
"These headings could be adjusted a bit to feel more clean, but I think 6 paces the flow well and gives enough room for
each step to feel more dedicated, full and explained. Only having 5 made us have to crunch steps in, and 3 is better for
a How it Works overview section (like home or something to lead to the full how it works), but isn't comprehensive enough
to get the full picture." `pictures=bespoke` "The site's own frames that currently exist on the events page are incredibly
V1, and were never considered individually, just all thrown up at once with the first version of the events pages. Let's
make these feel bespoke now that event pages are getting focused treatment." `shape=scroll` "This gave some great ideas.
For the full how it works walkthrough, let's do one scroll as today. It feels cleanest and creates a more full page.
However, let's include a toggle above the steps to switch between Host/Guest perspective, and have custom steps for each
to see both sides, similar to the numbered stepper UI. Additionally, I made a previous question note about using a
simpler three steps for "How It Works" sections, such as on the homepage, to point into the more comprehensive How It
Works page. However, I think a numbered stepper would work better, where we can present the full flow within a regular
height section without feeling crowded or long. Both the one scroll and numbered stepper need their focused design
efforts, not production grade." `proof=demo` "While this is a great payoff for some pages, I don't want every single page
to end the same way with the reel. That will feel incredibly repetitive. Also, I haven't been liking using a centered
mobile portrait video in these sections. It leaves tons of blank space on either side of the reel on desktop. If we're
using a portrait, we should fill some of the space to one or both sides. Or we can use landscape videos." `phone=?` "I'm
not sure what's being asked here. How is this "in a guest's hand?"" `close=folded` "With the footer always having the demo
event QR CTA at its top, this pattern pairs well together. Many pages will end with a final CTA (common example: "Create
your first event free") paired with "Explore a demo event" beneath, which feels nice to keep the end of the page so
actionable. However, as a separate exploration, the footer "Explore a demo event." should be a heading size down from
these closing section H2s to create hierarchy, it's far too big right now."

His additional note, verbatim: "some of the event-type landing pages and page that tells the loop questions made me worry
we're building a really boring template. These pages should feel very polished, beautiful, and constantly incentivize
further exploration. Also, the current event pages were thrown up in a very fast V1 under one agent with distilled
context, so they should in no way be seen as a complete effort that only needs elevation. Honestly, they could use a
total visual identity redesign now that other areas like the homepage are progressing beyond them under Rising Tides."

His three answers in plan mode, verbatim: the event pages: "A ground-up identity round first (Recommended)"; the loop's
page: "Sorry, I think I may have confused the loop with being more templated, like a "page loop" for the event-type
pages. I'd like to reduce my comment to only ensuring that the event type pages don't feel templated. This one feels like
it should be just fine. My answer is your recommendation to build the page now, design-led."; the footer heading: "Change
it directly (Recommended)".

## 2026-09-19 · the overnight round: twelve explorations across the marketing site, the app and the admin, at the Orchestrator's discretion

**Became:** twelve question-first boards (eight asked at first, raised to twelve an hour later on the quality of the maps),
each cut from a read-only map of a surface no board on the desk touches, six seats at a time, the rest queued as seats
free, paced as usual: `media-viewer` (what a photograph opens as, for a guest and a host), `reel-studio` (the highlight
reel, from the album to a guest's hands), `host-curation` (the host's act of reviewing what guests send), `admin-triage`
(the operator's act on a report), `emails` (every email Partyreel sends), `help-center` (where a host or a guest with a
problem lands), `profile-page` (what a person is on Partyreel beyond one album), `how-it-works` (the page that tells the
loop), `export-flow` (getting everything out, for a host and a guest), `site-chrome` (the marketing header, the mega panel,
the mobile menu and the footer), `event-type-pages` (the event-type landing pages) and `error-pages` (every not-found and
error surface as one grammar). Every lane is integrated, gated and recorded overnight with `[preview]` on its record;
every open call is carried on the lane's recommendation and nothing is asked of Will until morning.

Verbatim: "Incredible work closing out all of those agent explorations. It's late tonight, so I'm going to bed to sleep. I
can't wait to start reviewing in the morning. However, in about 30 hours, our weekly token limit fully resets. We've only
used 35% of this week, so we may as well run more exploratory agents overnight to burn those tokens since all lab work
creates opportunities and is at worst, net neutral and fully deleted. Any unused tokens simply expire. I'm not sure what all
is waiting in the review board for me, so rather than directly request any additional agent tasks specifically here and
risking duplicate or redundant work, I'd like you to explore across all of our marketing site/app/admin surfaces and find
enough opportunities to set off explorations to occupy 8 more slots, paced as usual. I'll see you in the morning. Good
night, good luck, and thank you. Work fully autonomously from here until you complete. Since I'm going to sleep, I will not
be able to respond to any questions, which if asked will pause you until I return in the morning. Simply avoid anything
that requires clarification until morning."

Second message, an hour later, verbatim: "After seeing the quality of the maps you're running, please fill 12 more agent
slots throughout the night instead of just 8. Continue pacing by a fixed amount of parallel explorations to ensure
hardware doesn't crash overnight. Run autonomously until all 12 are complete. My laptop will not sleep until you're done.
This is my official sign-off, so again, no questions or breaks that require my response to continue moving again.
Goodnight!"

## 2026-09-19 · the pricing page beyond the in-app surface, granular; two more areas at the Orchestrator's discretion

**Became:** `pricing-page` on the seat app-vocabulary freed (Opus, :3134): every part of the marketing pricing page
its own decision (the opening, the plan pair, choosing a size, the pass, the calculator, the table, the questions
and the close, the phone), never whole-page versions; and two boards queued from the Orchestrator's read of the weak
points, cut as seats free: `guest-upload` (the moment a guest adds a photograph, the product's core act, phone first)
and `first-event` (a host's first event from "Create" to a code on the table, the activation moment).

Verbatim: "If or when an agent slot is free, I'd also like to start up an agent running explorations for the pricing
page beyond the in-app pricing. This would be a more granular exploration than simply comparing new page versions
themselves at such a high level. Again, everything is unprotected and may be reconceived from scratch or relitigate
absolutely anything. I'd also like for you to find one to two more open areas across the marketing site or app that
we can queue explorations for. Your discretion on what feels high leverage or like weak points right now."

## 2026-09-19 · stack the lab while deployments are capped: the demo, the door, /contact, /press, and pricing inside the app

**Became:** five question-first boards cut on the free seats the same hour, each from a read-only map of its
surface: `demo-event` (the demo as the product's first impression), `app-door` (login and signup, the door into
the host app), `contact-page`, `press-page`, and `app-pricing` (a minimal in-app pricing surface with the
marketing page one click away as the fuller layer). Nothing on these surfaces is protected; a board that comes
back with nothing kept is deleted at no cost.

Verbatim: "Since we're unable to review everything on the alias right now and have agent slots open with plenty
of tokens to spare, let's continue stacking lab explorations for when deployments return. A huge advantage of the
lab is that explorations are, at worst, net neutral and deleted, but always offer an opportunity for improvement.
Unless already addressed, here's some easier hanging fruit areas you could explore and find ideas for any amount
of explorations: demo event, login/signup, /contact, /press. Again, we're treating all as unprotected, since lab
explorations can simply be thrown away, so absolutely everything is up for relitigation or reconcepting from the
ground up."

Verbatim, the pricing board: "If we have an agent slot free, or whatever one opens, I'd also like to add an
exploration for an in-app pricing modal so we don't take users out of the app to the marketing site by default
every pricing click, would prefer to keep them within the app. The marketing site can be a more comprehensive
'Learn More' second-layer resource that's a click away from the more minimal in-app pricing if needed."

## 2026-09-19 · the app and the guest pages are unprotected: relitigate from the foundation

**Became:** the Orchestrator maps the host app and the guest experience (two explorations and its own walk of the
alias), and lines up question-first boards that reconceive them from the ground up, the way the admin round did,
launched as seats free while the wiring lanes run. The marketing site's stretch goal of 2026-09-14 ("nothing is
protected") now names the app and the guest pages explicitly.

Verbatim: "While you're waiting for me to review and your agents to complete their work, please begin exploring our
app yourself and lining up new agent explorations to launch as slots become free. Let's treat the full app
experience as well as guest pages as unprotected. Anything and everything is open to relitigate or reconcept from
the ground up to begin establishing a better system from its foundation. The existing version is closer to a
Frankenstein's monster as we were trying to integrate new features ideas 1 by 1, rather than having a complete idea
of the full app from the beginning."

## 2026-09-19 · the second batch: the trail's home is the 404, the album's halo, the card's own gradient, galleries run to the window

**Became:** four boards answered whole and wired the same night (`image-trail`, `album-page` with album-hero
round three, `river-card` with river-visual round two, `gallery-width`); `privacy-hero` round two closed by a `?`
and replaced by a new-concept round; two app boards to come (`gallery-controls`, `event-header`); an album
motion board (`album-motion`) drawing two or three variations of the falling-in he loves.

Verbatim, image-trail: `entrance=flick` "Following the way it was thrown rather than the cursor feels a lot more
natural and fluid. Keeping the image trail behind the cursor also allows better cursor visibility/tracking than
keeping the image directly beneath it."; `phone=walks` "Different path than current, if that's not a future
question I'll encounter"; `size=s180`; `home=notfound`.

Verbatim, privacy-hero round two, `pace=?`: "Question is clear, but I don't really like this arrival animation as
part of the spiral/orbit." Asked what next: "Let's go with a totally different concept... I think we can say the
image trail was a takeaway win from this. The actual privacy hero can take a different path, maybe more fitting
for its theme."

Verbatim, album-page: `visual=live` "We will replace the album media before launch, likely with Higgsfield
generations."; `motion=stream` "I like the direction, but this animation can definitely be improved.", and asked
what improved means: "I love the images falling into the album. I was just curious to see maybe two to three
variations of this concept to get an idea of what the best version is. No specific direction on what improvement
means here yet."; `light=halo` "This is gorgeous and a beautiful delight to make the photos falling into the album
feel more infused."; `second=floor` "This selection is better than combining with a visual in the 'Everywhere'
section, but the paper chapter directly beneath and the brightness from his white overwhelms the aurora here and
makes it less noticeable. Would work much better with a full image background section beneath so it feels like
it's glowing from that, with a less harsh contrast at the transition that will make the aurora more visible as
well."

Verbatim, river-card: `place=tenth` "This positioning makes each card version feel more full while still leaving
breathing room at the top. A subtle dark gradient overlay from the bottom left to allow the text in the card to be
slightly more visible would be nice. This would stack on top of the existing gradient that fades the photo out,
more custom the the cards themselves for more distinction between the card copy and its visual. The river has a
gradient overlay to fade it out for its own visual, then the card would have its own from its text, being treated
separately so the card's applies to all features & visual pairings."; `fall=behind` "Plus the previously mentioned
note for the card gradient overlay to add a slight more contrast on all card copy. Not exclusive to the QR code
card, nor part of the river visual design itself, which keeps its own overlay fade as well."; `opens=short`;
`short=tall`.

Verbatim, gallery-width: `tile=240` "Could we make image tile size an adjustable option in the galleries, likely
within/around our filter/sort/controls? I'm honestly not even sure if we built those out yet to handle galleries.
We could open a ton of app exploratory tracks."; `width=full` "This feels natural at every window size, so all you
have to do is adjust your browser window to adjust the gallery size, rather than us constrain it at any point.";
`words=edge` "As an added note to the previous comment about lots of app exploration potential, event headers for
both hosts and guests is certainly one of those. Left is definitely best for this current positioning, though.
Maybe an exploration would serve as a better centered version that'd win."; `host=same`. Asked when the two app
boards open: both, on the next free seats.

## 2026-09-18 · full-image sections are chapter transitions; cursor-backdrop round one ruled, image-trail begun

**Became:** `cursor-backdrop` round one answered on every step (`section=full-quality`, `legibility=plate`,
`trigger=band`, `entrance=slide`, `rhythm=insert` as a soft ruling, `phone=scroll` clarified to four or five
photographs at scroll steps) and its wiring lane `backdrop-wiring` cut the same night; `image-trail` round one
begun (`density=d140`, `decay=long`, with three seconds suggested). The architectural ruling below binds every
page with chapters: a full-image section is a way to cross from dark to light, used sometimes, never at every cut.

Verbatim, the ruling: "I think full image backgrounds sections should commonly serve as chapter transitions, so we
go straight from dark to light or vice versa less often. It makes the transition much less harsh. However, it
isn't required at every transition, else every page with chapters would have full images above & below the
paper chapter, which would feel repetitive every time. They can close a chapter, open a chapter, or exist
individually to separate two chapters. For this specific instance, we could use this to end the first chapter
and combine the live demo visual currently below into the start of the chapter after."

Verbatim, on the rhythm: "This is not a hard ruling. Rather, a soft ruling on top of my previous 'full image
background as a chapter transition' note to indicate that its' your architectural decision to either include
full image sections within dark/paper sections/chapters or insert as their own section between chapters. Though
this question seems to be asking for an exact placement of this instance, I'm responding with a more open-ended
answer. The 'new band at the chapter cut' may be modified by you accordingly."

Verbatim, the phone: "To clarify my answer, I'd like it to pass through 4-5 images at steps as it scrolls
vertically, not requiring taps as a cursor on mobile. That way, it triggers for everyone when passed by, but
aren't the full eight photographs that may feel too overwhelming cycling through so many on a shorter mobile
section. Smart call on the different handling for mobile here. The slow cycle feels too jumpy when trying to
read, so it's nice visitors can stop scrolling to read without any motion clash with our scroll version. Reduce
motion can have a still photo if that's best."

Verbatim, the rest: `section` "This looks so much better."; `trigger` "I absolutely love the rail of the foot, and
tracking the Cursor's position justifies this delight."; `entrance` "This feels much more natural and fluid.";
image-trail `density` "This makes it feel a lot less overwhelming while still providing the overlap that keeps
the trail continuous with no gaps."; `decay` "I'd maybe even suggest 3 seconds to calm it down just a bit."

## 2026-09-18 · the privacy hero: none; the image trail is the reference; crisp media motion is the foundation of the visual identity

**Became:** `privacy-hero` round one answered none, and two lanes were cut the same night: `image-trail` (our
own cursor-tracking image trail for the marketing site, written from scratch against the Codrops "Image
Trail Effects" demo one, plus `privacy-hero` round two on the same engine: tighter, faster, the trailing
photographs decaying) and `cursor-backdrop` (demo six: full-bleed photograph sections that switch with the
cursor, for the marketing site's UI-forward chapters in place of the aurora). "Decaying trail", his ask
for round one, meant the trailing IMAGES decaying, never a separate trail drawn behind the path. The
resource is https://tympanus.net/Development/ImageTrailEffects/ (github.com/codrops/ImageTrailEffects);
its photographs are never ours, and every board draws the site's own.

Verbatim, his first note of the sitting: "I just started my review with the new privacy and trust hero.
None feel right. I think the density needs to increase as well as the speed. Also, when I said "decaying
trail," I meant of the trailing images, not an actual separate trail effect. I went to Google to find a
better image trail reference to send you, but I actually found a resource I love itself."

Verbatim, the three asks: "1. Let's rework these explorations to be tighter with images effectively
overlapping, a bit faster pace and a polished image trail behind, like the attached screenshots. 2. Let's
create our own cursor tracking version of this effect in the lab as well, to hopefully be used on the
marketing site somewhere, else bank for later. If the hero explorations don't pan out, maybe it can serve
as one instead. 3. I specifically like demo 1 of 6 for our image trail. However, demo 6 of 6
(https://tympanus.net/Development/ImageTrailEffects/index6.html) would be amazing for the marketing site as
well. Rather than leaning on aurora treatments for more UI-forward sections (eg. icon feature cards with no
media visual), we could have full image background sections that switch the image based on cursor
position. This would feel help break up the strictly alternating dark/light chapters and make the page
feel very alive, especially once we begin our higgsfield generations for custom media. This new effect
would be its own exploration as well."

Verbatim, the identity: "I think this crisp media motion design is going to be the foundation of our
visual identity. Home hero is beautiful, I'm loving the river, and the new image trail and demo 6 will be
polished additions."

## 2026-09-18 · the admin portal is rethought from the ground up as an on-brand devtool, split into its own deployment now, one repo, one Orchestrator

**Became:** three lanes cut the same evening: `admin` (the portal's shape as round one of a question-first
board, on the real components with fixtures), `admin-split` (the admin as its own Vercel project on this
one repository, serving only the admin on its subdomain, the main project no longer serving it) and
`admin-jobs` (the four backend jobs with no heartbeat wired into the console: the backup queue and its dead
letters, the purge's sub-sweeps, transactional email, the limiters). The admin's design binds are one line
in `docs/systems/admin-observability.md`: the platform's foundational identity carried over, everything
else free, real colour allowed. The Orchestrator recommended and he chose separating now rather than after
the redesign, with the deployment split rather than a second repository, because the single base
requirement below is met only when every surface stays one tree.

Verbatim, the base requirement: "I absolutely love the ability to interact with you alone as orchestrator
across the marketing site, app, admin, library, and lab. Along with making my life easier, it's also been
great allowing you to keep everything closely tied together (design systems, functional systems, database,
etc), so if something changes anywhere, its impacts are handled throughout the entire system across
surfaces. I want to ensure I can continue working with you across all platform surfaces in parallel within
a single Orchestrator chat as the single base requirement."

Verbatim, on the subdomain: "I completely understand the importance of admin (and potentially other
surfaces) having its own dedicated subdomain, and actively encourage this. This allows each surface to
exist elegantly serving its own purpose, with far fewer security risks than having everything tied
together." And: "We can even separate these into separate repos, or any other project structure, so long
as you're able to manage across all as orchestrator in a single chat."

Verbatim, on the admin's look: "If we can simply carry over a foundational identity (logo, font
family/weight/spacing, achromatic palette [we'll want additional real colors for the admin portal too,
like charts], etc) - the rest of the admin is free to be its own thing. Those would keep it feel tied
pretty closely already - carrying too much of our product system restricts the admin portal from best
serving its purposes with custom UI, but I don't want it to feel like a separate brand identity entirely,
more an on-brand devtool".

Verbatim, on the portal: "we've barely touched the admin portal since we threw up the first version way
back... 1+ dedicated agents could likely begin working on our admin portal via the Lab. Lots of open
directions to improve it, nothing is unprotected and the full portal could likely be rethought from the
ground up... plenty of thought should go into this prior to diving straight in."

## 2026-09-18 · the board keeps growing while he reviews: Glass round one on the app's media chrome, the loose ends as decisions, the body ladder ruled in

**Became:** two lanes cut the same evening, `glass` (round one: the app's chrome over photographs first, dark
and light drawn and asked separately) and `loose-ends` (six ROADMAP decisions drawn on their real surfaces);
the body and label ladder ruled onto the type system as one question-first board before any sweep, cut the
same evening as `body-type` into the fourth seat (Will: "we may as well launch the body ladder board if it's
ready to be answered"); the marketing site at a phone left in the ROADMAP.

Verbatim, on pacing: "I can complete reviews faster than you & your agents can work (not a bad thing -
you're concepting & building multiple ideas, I'm simply selecting & commenting), so it makes the most sense
to continue building our board as I review. However, we dug ourselves into a hole in previous lab cycles
where explorations got too deep without feedback - the goal with our new multi-step question lab moving
forward is to be able to pace those over as many rounds as needed, and handle questions regarding
explorations as targeted or broad as relevant/helpful."

His picks, asked as options: launch Glass and the loose ends now; Glass draws the app's media chrome first
(the lightbox's pills, the masonry's like and unsave buttons, the reel overlay: glass over real
photographs) with marketing in round two; glass is drawn on both grounds and asked separately, never a
package; and "everything should be addressed in our design system type ladder" reaches body and label
sizes, one board first.

## 2026-09-18 · the calm was the wrong instruction; the album hero gets a fourth round at the home hero's pace, the field becomes the Privacy hero's spirals, the river goes into a card and onto the empty album, and galleries run wide with more columns

**Became:** `docs/reviews/album-hero.json` round 3 (`composition=none`, `album-width=w880`, `headline=lg`,
`no-script=settled`, `copy=page`) and `docs/reviews/river-visual.json` round 2 (`placement=card`,
`code=in`, `guest-photos=ghost`; `proportion` was answered `?` and then withdrawn inside the round, his
words kept as his note beside the Orchestrator's: the pinned stage hid it, its three boxes were three
sizes at one ratio with "taller" and "squarer" never drawn, and a card's slot sets the shape). Both boards had been
grandfathered past round one with no review, and the list is empty now. What follows: the lab's step
rebuilt around his last note (the preview is the page and the answer is a dock); four question-first
boards on three lanes, `album-page` (the album hero's round four) with `privacy-hero` (the field as two
spirals) because both are paced against the home hero, `river-card`, and `gallery-width`; then the
wiring, which waits on them.

**How the calm went wrong, which binds every exploration.** His note on round two asked for the heroes to
"feel a bit more calm. These are all moving too fast and feel distracting from the actual page content.
Many frames are also jittery/buggy." Round three turned a relative note into absolute limits (nothing
faster than 40 px a second, at most sixteen frames lit), pinned them with a test, and applied them to all
four compositions, so every option was calm by construction and none was drawn against the pace he
already liked on the home page. A relative note is answered with options graded against a reference,
never with a cap and a test (`docs/PROGRAM.md`).

**The privacy page's restraint is overturned for its hero.** The page was built as the site's quietest,
with "no stage and no lamp" in its hero ("restraint is their identity", `docs/systems/design-system.md`).
His note gives that hero the field, faster, as two spirals with a trail.

**Placeholder copy is judged for its size and wrapping, never its words** (`copy=page`), in every
exploration until the `voice` board rules the words.

Verbatim, on the compositions: "Honestly, none of these landed as well as I was hoping. I think my calm
instruction messed us up - now it feels too boring. Let's speed up the pace again; home hero currently
feels perfect - fast but not overwhelming, so it's still easy to read text. Aside from the 'calm' problem
effecting all explorations, none feel they would pair well with the album visual beneath. However, I'd
love to revamp 'the field' for the 'Privacy & trust' page hero. I love the images popping in spiraling
opposite two sides. Increasing the pace, reducing the gap between images and leaving a decaying trail
behind the 2 spirals should hopefully be perfect for that page hero."

Verbatim, on the album's width (with two screenshots in chat of the lamp under the page's demo): "If
this width makes the dashboard visual too tall, we can fade out the bottom. May look better either way.
Current lamp usage is wrong anyways on album page beneath demo visual (will attach image in chat), so we
can find new ways to infuse the aurora here as well."

Verbatim, on the copy: "The future voiceboard exploration will treat all copy as unprotected, so we can
design without getting too specific on copy right now as long as the active placeholder feels like an
accurate representation of the future copy. That way, we're judging things like size and wrapping
correctly."

Verbatim, on the river's placement: "This would create our first truly beautiful card visual. I think this
is where it lands most powerfully, and how it works can use a more dedicated animation. However, let's
run the card implementation through its own exploration to nail it. Right now, I think the QR code needs a
bit more of a gap from the top, so it feels a bit more centered with the images still streaming down. The
blank space above will allow some breathing room."

Verbatim, on the code in the river: "However, we don't need the 'scan it' label text. Think of this more as
an Easter egg in our design. We have other instances that are more direct about pointing to the demo
event."

Verbatim, on the empty album: "This is an immediate upgrade to the 'this is where it all lands' empty
state. However, I'd like to see it within the full app to see if a different animation would work better
here."

Verbatim, on the lab, which the step's rebuild answers: "This seems to be a lab problem over the question
itself. The top preview UI of our lab is covered by the answer UI, and I cannot scroll it to see the full
heights or labels on which height is which. This has been a recurring problem where I have to visit the
board to be able to see a full preview, then go back to the question to answer. We should ensure both the
question/context/preview UI and response/answer UI work well together."

Asked whether 880 was meant for the album page's demo only or for the real guest album too, verbatim:
"This will likely require its own exploratory track, but I currently dislike how we're restricting the
width of the gallery (both in app and real guest event pages) on larger screens. For laptops, desktops,
etc., it makes way more sense to use the full width for galleries to show more images. So, as an immediate
answer, it's fine to do both, but as a larger answer, the real guest album page already needs to be
widened anyway."

Asked what the album page's hero becomes (no composition, or a fourth round), verbatim: "Let's do a round
4, home hero pace. I know you recommended the no composition, and I'd guess it's because the album below
already serves as a visual for the hero and pairing it with a loud animation, such as those from our last
exploration, may feel overwhelming. I agree, but feel the area above and to the sides of the H1 lockup will
feel too empty with just the album beneath. Maybe we can use a more subtle animation in some of the empty
space to help the hero feel more alive & full."

Told that an interim 880 cap on the guest page works against his goal (the cap wraps the whole page and
the album stays two columns, so tiles get bigger and fewer fit), and asked whether to skip it and run a
full-width gallery board, verbatim: "Let's skip it and run the board as you recommended. However, as a
quick note before the board, in my request for widening the gallery, we'd keep image tiles to a smaller
size and add more columns. Not go wide and keep 2 col."

## 2026-09-18 · the type ladder keeps its order at a phone and nothing is set off it; the corners are C in quarters; every image and video is generated, with one line in the Terms

**Became:** `docs/reviews/type-phone.json` round 1 (`subhead` and `dead-link` left open with his words,
`display-trim=clamped`) and `docs/reviews/rounding.json` round 7 (`family=c`, `actions=today`,
`ladder=quarters`, `dead-rungs=drop`, `gap=pinned`), then one lane, `ladders-wiring`, that wires both
and retires both boards. The type half: `prose`'s phone end from 18 to 24 with 1440 unmoved, so the
paper h2 and the marketing 404 read as h2s at a phone; a tenth step, `subhead` (20 at a phone, 24 at
1440), naming the pair seven headings already wore as stock classes; every heading-face element onto
the step its role calls for; the ladder's law restated as the order rather than the travel. The trim
ships as the option's words said, `(1em - 1lh)/2 - 0.19em`, because the tile he judged was drawn with the
sign backwards: it trimmed less at a phone, the opposite of its own "sits on its line at both ends". The
corners: an 8px surface, a 12px floating layer with its rows derived at 8, a 4px photograph and the gap
pinned to it; the steps in quarters with the top two dropped; buttons at 0.4 of their height with a `cta`
size for the 44px button and the guest sheet on the floating corner. And one sentence at the end of the
Terms' Disclaimers, version 1.2.

Verbatim, on the sub-head tier: "I wish there was an obvious third pick, which is to fix the mobile type
scale ladder so the upper heading is larger. That problem snuck by when I only reviewed the desktop
version. We should have a very clear heading hierarchy on mobile as well. Only offering options to keep
the sub larger or to match was a huge oversight on a problem with an obvious solution."

Verbatim, on the dead-link title, which binds every type question after it: "404 should inherit our
established type scale, maybe using an H2-3 size. Between this and the last question, we really
shouldn't have any one-off adding instances. Everything should be addressed in our design system type
ladder. That either means adding new styles to the ladder or using styles from the ladder on existing
one-offs. Unless it's a helpful global addition, I prefer not to add one-offs to the library to keep
consistent standards."

Verbatim, on the corner ladder: "This keeps the final pixel calculations much cleaner."

Verbatim, on generated media: "Good research on Higgsfield. We'll likely extend this to all of our images
and videos for consistency. Since we'll be attempting to create very real photos, we can play it safe and
add a small note wherever it fits best in our legal docs along the lines of 'we may use generative AI' or
something light to cover. Don't need to take any chances if it's that easy. However, don't want to markup
any images themselves."

Verbatim, on the prompts: "For the image 'prompts' themselves, the requirements will likely change as we
upgrade the full marketing site, so we don't need to preserve much of that. The requested assets from
agents may continue to grow, but I'd like the new agent handling our Higgsfield generations to write the
final image/video prompts itself once it becomes an expert on Higgsfield tooling and prompting from deep
research. That way we're generating the most engaging, polished content possible."

## 2026-09-17 · the media kit is killed; every frame is generated in one Higgsfield month, and nothing tracks an image's rights

**Became:** `docs/reviews/media-kit.json` round 7 (`rule=no`, `spend=hold`, `shoot=park`; the crowds
answer deliberately not recorded, below), then the board deleted whole: the 36-frame call sheet, the 13
catalogues, the $56 plan and the 22 staged stock photographs. The `credit` field removed from
`MarketingImage` and its test; bible 18's why re-pointed at generation; ASSETS rows 6, 7 and 13 withdrawn,
rows 1 to 4 and 14 parked on the Higgsfield month; that month a line under the ROADMAP's major overhauls.
The line he asks after below was `license: "unsplash (per lab-pack comment; provenance unverified)"` on all
twelve stand-in stills: a guess an early agent wrote when it copied them in from a dev pack, read by
nothing but its own test.

Verbatim, on the kill: "Let's kill the media kit from the pending explorations. I answered a few of the
questions to address strategy." His notes on the three steps he answered: `rule=no`, "The images we use on
the production site should have no attribution to original authors. If we're using it, that means we have
full licenses and rights. What's the one unverified line we currently have?"; `spend=hold`, "I will attach
a separate note in chat to clarify the new media path."; `shoot=park`, "We will not be having a photo
shoot. No idea where this originally came from. Look for a separate note in chat to clarify new media
sourcing."

Verbatim, on rights, which binds every agent. Asked which way the crowds answer should be recorded (the
option pressed and the note pointed opposite ways): "The official decision is that this should not even go
into the record. Again, if we're using images, it inherently means we have the licenses to do so. Our AI
chat agents do not need to track photo subjects and whether or not we had that permission. That's
ridiculous for our pruposes." And on the field that tracked it: "Please remove the credit field from our
existing stills so that it does not carry forward."

Verbatim, on the source: "However, regarding the potential sources for media themselves, I think I found a
far better path. When looking at all the stock photography, I realized that we were going to be limited by
various factors: it's hard to find many high-quality photos packs recognizably from the same event and
licensable, for any packs we could find we're limited to what it contains and may not fit perfectly, and
we're paying a lot of money to support our visual needs. Better path: https://higgsfield.ai/ ... We can use
its tools to shape a moodboard for consistent brand feel across future outputs, then through a combination
of inspo images and creative prompting, generate an unlimited amount of high-quality photorealistic photos
that we 100% own, match our exact needs, will likely feel far more exciting than real pictures, can remain
on brand rather than mixing many different image styles, works across events/conferences/trips/weddings/etc.
Imagine if at every photo instance you could simply ask for exactly what you wanted rather than spend tons
of time hoping to find something that even comes close. That dream has come true!"

Verbatim, on timing: "We will not immediately open the higgsfield media generation track - let's defer for
now to shape more of the site, then we'll have a better of what we need. Try to do it all together so we
can get away with a 1month subscription to higgsfield." Asked whether the board's 36-frame call sheet
should survive as the month's starting brief, he chose "delete it all, start blank": the track writes its
brief from the site as it stands when it opens.

## 2026-09-17 · the brand voice exploration is killed unruled; the voice is rebuilt from won lines, one comparison at a time

**Became:** `docs/reviews/brand-voice.json` round 7, created and closed in one paste (`voice` left open with
his words, `noun=album`, `unfurl=join`, `counts=hero`); the `voice-retire` lane, which deletes all 4,121
lines of the board and ships only the three picks; a new board `voice` at round 1 in the form below; bible
20 and 21 re-pointed at it; `docs/reviews/_window.json` round 6; and one enforced rule, that a board past
round 1 with no ledger fails `registry.test.ts`. The board had reached **round seven with no review ever
recorded** and its own contract penalised two voices for agreeing, which is the machine that produced what
he is describing here.

Verbatim, on the kill: "For the main brand voice selection I marked as not clear, I understood but think it
may be worth killing the rest of the brand voice exploration I have not answered yet. The reason being:
feels like the agent worked too hard trying to generate multiple unique voices rather one that's perfect,
then we kept running in through unreviewed rounds to dig deeper into each without shaping along the way.
Now we have a massive amount of ideas, but it feels like the best version would've been a mesh of examples
from multiple voices at different points (today's, keepsake, live, plain) rather than forcing each to have
a very specific tone so it felt differentiated for the sake of the exploration."

Verbatim, on what replaces it: "For the new brand voice, it may be best to build up from the ground up,
shaping along the way rather than just selecting one of these for the sake of it." Asked whether to keep
any of the 510 lines, he chose to keep none.

Verbatim, on the form, which is the durable half. He first asked for two parallel drafts and withdrew it
himself before any work started: "I'm worried that my two-voice full draft pages are antithetical to our
new multi-stage question approach meant to handle individual decisions and produce single winners. The two
drafts would likely require many fine notes over one cohesive answer. The better strategy would likely be
to give me tighter comparisons of copy in real cases, one at a time, and use my winning selections to build
the brand voice, rather than presenting two options." The constraint that survived from the withdrawn
version stands with it: "Starting with just a few spot example statements may make a voice sound good in a
silo, but not perform well in actual usage. I'd rather shape it as we see the voice applied in real cases."

So the voice is never declared and then applied. Each step is one real line in its real place with three or
four close candidates and one winner; after each round what his wins have in common is written up, and the
next round's candidates are drafted in that, so the rounds narrow.

Verbatim, correcting the counts ask's premise, which was wrong on the board: "The demo is a fake event we're
creating, and does not accept new uploads, only simulate the experience. While we are pointing to the demo
event in other places of the site, the section below the home hero where these numbers are being used is
paired with a demo video, not the demo event. So there's not as big of a mental barrier you make think, the
numbers simply feel like they're referencing this example reel from a conceptual event, not the demo
explicitly. With that said, the existing demo content will be completely replaced prior to launch to feel
more full and real." His note on the pick: "I think it'd be nice to make that the first line, then stacked
center under, 'Created for you.'"

Verbatim, closing floating surfaces: "Still no visual difference, but let's go with your pick for now. We
can always adjust later once we start implementing everything into the app." Every step of that board is
answered and its wiring is cut.

## 2026-09-17 · the v1 wordmark, alone; floating surfaces open by frequency, and the corner question pops back up

**Became:** `src/lib/brand/wordmark.ts` (his SVG's one path), `Logo` as the wordmark alone in
`currentColor` on every door, the social card, the Library's Logo entry, ASSETS rows 18 (wired) and 19
(the icon, to come); `docs/reviews/floating-surfaces.json` round 7 (`radius=nested`,
`entrance=by-frequency`) and the staged follow-up step `roundness` on that board, which re-asks only
the pair he could not tell apart, drawn filled and at true size (the kit's new `TrueFit`).

Verbatim, on the wordmark: "I just completed our v1 logo wordmark. Please add to library and replace our
placeholder. The wordmark should exist alone in the nav & footer, I'll upload new v1 icon separately
later once complete."

Verbatim, on the corner: "Today's panel corrected and Rounder seem to be the same option, so I suppose
this is also selecting rounder at the same time. If there's meant to be a difference, please pop this
question back up." (There is one: his pick keeps today's 8px panel and fixes its rows to 4px; Rounder
is a 12px panel with 8px rows. Both NEST, so both drew a dashed arc lying on a solid one, in a tile a
third of true size. His `radius=nested` stands until the follow-up step says otherwise.)

## 2026-09-17 · dark mode gets both shadows, the bright edge is kept and polished, the shimmer is banked; floating surfaces wear Card, submenus stop at two levels, and Glass gets its own exploration

**Became:** `docs/reviews/light.json` round 8 (`depth=both`, `face=keep`, `sweep=skip`), which answers
every step of the light board: the `light-wiring` lane lands the two shadows by role, the four depth
techniques as one Library section and the bright edge redrawn, and the board retires;
`docs/reviews/floating-surfaces.json` round 7 (`direction=card`, `submenu=keep`), with that board's
shadow ask withdrawn inside the round because `depth=both` answered it, and its wiring cut when the
last two calls (the radius, the entrance) are answered; the ROADMAP's banked Glass exploration and the
banked shimmer. He stopped the sitting on a lab defect, fixed the same day: on the radius step the
real menu changed but the 6x corner drawing was read once and never again, a press on a catalog
card's picture landed inside its frame, and rounding's stage mounted lazily on a page where a family
barely shows (`scenes.tsx`, `catalog.tsx`, the rounding board; `pnpm lab:demo` now proves every step
changes its stage).

Verbatim, on the shadows: "I now see how step, ring, lift, and float work together. Very good work."

Verbatim, on the bright edge: "I love the bright edge. It's a really nice subtle design touch, but I think
the implementation could use a tweak to feel more polished and beautiful. The transparent border radius
also revealed some mismatches here in the preview roundings." (The mismatch was the edge drawn on a
wrapper with a hand-typed radius and laid on the padding box, so its arc was not concentric with the
surface's own. The wiring puts it on the box that owns the radius.)

Verbatim, on the streak of light: "I love that shimmer as a banked effect for later. However, for new
photos to populate the gallery, I think it would become too visually overwhelming versus more subtle
motion animations that add them in. The shimmer feels more like a delight moment. A couple dozen photos
being uploaded in a single batch would cover the top of a gallery in shimmer."

Verbatim, on the floating layer: "Card is my overall favorite. However, I like the more subtle group
labels from Glass. I also do think the glassy background would be more visually pleasant than the flat
being used in Card now. However, I prefer not to create a one-off instance of glass here. Rather, let's
bank a near-term agent for a dedicated Glass exploration across marketing and app so it feels more
infused to our product. Glass + aurora atmospheric feels like a beautifully complementary identity for
a media-forward product."

Verbatim, on the nested menu: "Yes, this unlocks much more comprehensive menus than limiting to a single
list of everything included. However, we should not allow an additional third level of nesting. That
gets too complicated."

Verbatim, on the lab, in chat: "I couldn't demo the variations for floating surface and rows roundness.
Clicking the configs didn't seem to change anything."

## 2026-09-17 · the bloom, the halo and the beam are kept; the Aurora sits as a mix, composed for each place

**Became:** `docs/reviews/light.json` round 7 (`item:bloom=keep`, `item:halo=keep`, `item:beam=keep` and the
note on `landing`), which closes round seven's twelve cards. He finished that walk on the `launch-prep`
alias while round eight sat on the tree, so the line was transcribed against round seven's own spec
(`lab-review --root` on a scratch tree; today's spec refuses `r7` by design) and the alias is rebuilt
whenever a board changes from here. Round eight is cut to the three steps still open (`depth`, `face`,
`sweep`): `landing`, `bloom` and `halo` left inside the round with their pictures. `ProCardBeam` measures
its card's corner and passes it, zero included, with its contract (`pro-card-beam.test.tsx`). The wiring
follows the same day: the Aurora's places on the home page composed one by one, the publish glow resting
lit in the house five, the halo's rule in the Library.

Verbatim, on the halo: "Do not like as a button wrapper, only to light objects from behind."

Verbatim, on the beam: "We need to always ensure that the beam border and card border have matching
radii. In this example, the Pro card is off." (The board's Pro card named a radius token that does not
exist, so it computed square; the vendored library refuses a zero and falls back to its own 16px without
an error. Production's card matched at 2.8px. The wrapper measures now, so a square card gets a square
ring.)

Verbatim, on where the Aurora sits: "I think we go with a mix of all of them. The Aurora infusion into our
site identity should feel custom and bespoke, not a couple of identity components reused everywhere in
the same way constantly." This is a law for every later placement, not only the home page's two: a form
and a placement are chosen for the place, and the same composition twice on one page is the thing to
avoid.

Verbatim, in chat the same morning, on the lab and on rising tides: "you're encouraged to Rising Tides any
part of the library or lab as we progress; Rising Tides does not need to be limited to marketing and app."
He also called the stepped, form-based review "an incredible resource" (a paraphrase of the rest): once
the current lab work clears, the lab system is upgraded again before the next round begins.

## 2026-09-17 · the type scale is B with the spacing law and the dead link on the set; the Aurora is one light in three forms

**Became:** `docs/reviews/type-scale.json` round 7 (`ladder=b`, `tracking=adopt`, `not-found=on-ladder`,
`item:b=keep`, no notes: every answer the board's own recommendation) and the `type-wiring` lane (one
`@theme` block, every heading on a step, the board retired into the Library's Type section);
`docs/reviews/light.json` round 7 (`item:throw=keep`, `item:aurora=keep`, and `step`, `ring`, `lift`,
`float`, `face`, `sweep` returned as `refine`), the `aurora-wiring` lane (the Aurora as one Library
component in three kept forms, the seam, the throw and the field; the 8 second clock; `SectionLight`,
dark grounds only) and the light board's round eight (three cards that were never decisions leave the
walk, four become one question on one scene, the marks must run). Naming from here: "the Aurora" is
his word for the coloured light as a whole; the board's chapter-scale "aurora" is its FIELD form.

Verbatim, on the throw: "I like the throw. Assuming it's basically an alternative way to use our Aurora,
similar to the seam."

Verbatim, on the field: "Approved on the Aurora. However, we're keeping all Aurora forms off of paper, as
mentioned in the previous round. Assuming this, similar to seam and throw, is another alternative way to
infuse the Aurora into our UI."

Verbatim, on the depth cues, which is the question round eight answers on the board itself: "our step,
ring, lift, and float: a set of four options to choose from, or are we trying to use everything, and if
so, how?" And on the lift's specimen: "since the top card in the stack is moved to a lower Y coordinate
than the card below it, the shadows don't actually stack at all."

Verbatim, on the lit face: "Genuinely cannot see it in action here." On the sweep: "I see the static gray
edge ring, but can't get the animation to play, even by clicking replay. Stopping here."

Verbatim, on the review itself, after rereading his paste: "please be sure everything paired together
makes sense, and we aren't attached notes to incorrect questions and messing everything up getting
crisscrossed." (Nothing was crossed: the trailing `note: "on paper: ..."` was the batch before's, held
by his browser under a step withdrawn inside the round. "Copy so far" now sends nothing for a withdrawn
step and never a note the ledger already holds.)

## 2026-09-17 · the hero is the stack with the code above; the palette is Graphite with no accent; the aurora stays off the light ground

**Became:** `docs/reviews/home-hero.json` round 7 (`stream=stack-above`) and the `hero-wiring` lane
(the caption under the code dropped); `docs/reviews/palette.json` round 8 (`palette=graphite`,
`accent=none`, `card=declared`, `faint=in`) and the `palette-wiring` lane; `docs/reviews/light.json`
round 7 (`cadence=8s`, `publish=house-five`, `second=home-arc`, `item:seam=keep`, and the `paper` ask
withdrawn from the light board); the ROADMAP's flag on the app's light mode; "Copy so far" sending only
a board's open round (`composeSoFar`).

Verbatim, on the hero: "We can drop the "Every photo here came from a guest who scanned it" label
underneath the QR code."

Verbatim, on the palette's card in dark mode: "If we ever need to design that glass style over photos, we
can design that custom."

Verbatim, on the seam: "This seam application of our Aurora looks great. I'm assuming I'm approving the
colored glow component that can be applied as needed, not a single specific application of it right
here."

Verbatim, on the publish flourish: "Let's keep it consistent with the rest of our glows. Don't need a
single stray glow color, let's use either our house five or sampled depending on whether it "bleeds"
from media."

Verbatim, on the aurora on paper: "After experimenting with these, we may not be able to use the Aurora
on white/paper surfaces. It's barely noticeable and almost appears as a weird shadow or a stray artifact
rather than the beautiful glow it has on darker surfaces. No light ground usage is a decision for now.
This will have repercussions for our dark vs light mode app later we should flag now."

Verbatim, on the review: "Once a question has been handled through you and fully resolved, it should
not continue to copy for future batch answers."

## 2026-09-16 · the lab winds down into the Library; a favourite becomes a working version, never another tree of explorations

**Became:** `docs/PROGRAM.md` "The round" (step 6) and "Every round gets Will's notes"; CLAUDE.md
"Build"; the promote path is the priority of every sitting from here: a kept item lands in the
Library as a working version and a board retires, and a later exploration branches from a Library
entry rather than from a board that was never selected. The one exception he named: the home hero's
stream gets a short catalog of polished treatments first, then the wiring.

Verbatim: "let's do the catalog first to pick the best design then wire. However, for this existing
desk work, let's make the overall goal to wind down the current lab work as we progress and pass our
favorite ideas into the library, where they can be further branched into new explorations later but
at least exist as a working version now. That way we don't accidentally branch this into infinite
trees of track explorations, never actually selecting anything."

## 2026-09-16 · the home hero is the source, centred, without the count; the stream wants polish

**Became:** `docs/reviews/home-hero.json` round 5 (`direction=source`, `headline=ruled`,
`lockup=centred`, `count=cut`); the hero's wiring round; the lit surface and the publish beat's colour
close on the light board (`docs/reviews/glow-doctrine.json`, `glow-moments.json`: both `light`).

Verbatim, on the direction: "The album coming out of the code definitely looks best. However, I think
we can improve this visual a lot. The random stream feels worse than a more polished one."

## 2026-09-16 · a track returns a catalog to rule on item by item; the Library owns every design fact; history is the last two rounds

**Became:** the revamp (four rounds: the lab, the docs diet and the track protocol, the Library as
the complete inventory, the six paper boards rebuilt as catalogs); `docs/PROGRAM.md` "The round", "A
round returns a catalog", "Every round gets Will's notes" and "The record's depth"; `ITEM_VERDICTS`
(`keep | refine | kill`) and `LIBRARY_VERDICTS` (`keep | redesign | retire`) in
`src/components/lab/board-spec.ts` and the review grammar's item scope (`item:<id>=<verdict> "note"`);
the one-round manifest template and the spawn paragraph in `docs/tracks/README.md`; CLAUDE.md "Keeping
the docs healthy" ("nothing under `docs/` is history") and `src/lib/record-depth-policy.test.ts`; the
`lab-catalog`, `lab-sweep` and `docs-adr-fold` lanes.

On the lab, verbatim: "The lab UI is super broken, at least on localhost." The full menu open at the
top of every page and not collapsible; "On this page" a weird section at the top; 1:1 previews with
left padding overflowing to the right ("use the full window first"); the page-wide configs not
sticky; "I can't unpick a selection to return to a non-selected state." "This in no way reflects the
full list of errors. It's just what I could spot during a quick look. If you find more while addressing
these, please attempt to fix as well." (The layout faults were a browser holding an old copy of the
lab's stylesheet; the unpick and the 1:1 gutter were real.)

On the explorations, verbatim: the tracks "are turning into massively over-engineered pages"; what he
wanted was "design catalogs of ideas to ship in the lab", from which he can kill, refine, or "promote
the best to the Library"; the spill placements board "is a decent example". Brand-voice should have
been "a couple dozen spot examples across the marketing site and app", where he can "compare 2 brand
voices in usage side by side" with "a config to choose which 2, then select my winner"; type-scale "a
few different scales side by side" on real UI, no variable lists. Agents that ran two and three rounds
without his notes "made research papers out of their first round's work". "Gallery view by default,
notes per item"; where a gallery does not fit, the agent builds the best presentation for the
question. The Lab's tooling is built progressively: "GUIs, configs, previews, iFrames, questions,
information callouts, galleries, accordions... think dynamic docs."

On the record, verbatim: "we're over-indexing the importance of archival documentation"; the Library
owns all design information (the preview, the variants, the unique rules, the tokens): "If it exists
in our UI design, it exists here with nothing slipping by... The idea of a 'history' is unimportant";
docs handle "anything active" (workflows, database, agent init, systems, sitemaps, roadmap) with
history "highly limited to very recent work"; "revamp all of our working systems from the ground up";
"I'd like this to be the change that lets us breeze through future marketing and app rounds."

His answers to the plan's questions (paraphrase): a review is notes AND a keep / refine / kill
verdict per item, with asks only for what is not one item; history is the current round and the one
before; the Library covers components, marketing sections and app screens, each with a live preview,
plus tokens; all six paper boards are rebuilt as catalogs before his next review; the palette catalog
is walked first.

## 2026-09-15 · a question carries its context; an exploration is a catalog

**Became:** the ask shape (`src/components/lab/board-spec.ts`: a real question, its context, where to
look, options labelled in words with what each means, the dock state that shows it); the `?` answer
("not clear to me") in the review grammar; the review card on the board; `guidance.md#boards-the-
review-surface`; PROGRAM.md "Exploration rounds are light and iterative"; the palette board rebuilt as
the first catalog.

On his first review through the desk (the light board; three asks answered, two marked not clear):

> "I made it through these, but honestly, it was tough to understand what I was being asked for most
> of those questions already... Remember that the more clearly you can ask me questions, the more
> easily it is for me to respond."
>
> "Each exploration page feels like a small research paper into its track, so when you use very
> technical terms or nicknames from spots in these 'reports', it makes me have to go deep into the
> track to gain the relevant context and even begin understanding the question being asked. Having
> the link helps a bit, but framing the context more with the question would help a ton."
>
> "That's also a helpful note for future agents we spawn: our goal is to get creative while designing
> to find a combination of intuitive content flow/layouts and engaging visuals. When we're exploring,
> the goal is to get a few of our best concepts created for review, pick the best direction and refine
> for production polish. Simply designing a few (or many, complexity and context dependent)
> variations will always beat a mountain of 'research text'. Prime example: for the new palette
> exploration, it almost feels like I'm reading a PhD on color theory. We're simply exploring new
> color palettes - having a dozen polished variants with preview palettes with some demo UI to config
> & compare would've been far more helpful than this massive mountain we've created. Then I end up
> with six configs that aren't clearly explained. I have to toggle around the page to see what they
> impact. Building future explorations almost as a catalog of previews to select from would be much
> faster, and likely more lightweight and streamlined on your side to simply design beautiful
> components and organisms."

On the two he could not answer: "Am I being asked what aurora placement within the footer? Or what
aurora replacement looks better in general?" and "Hard to visibly tell what Family and Lift are from
the previews." The ruling on the light board's register the same night: "Identity feels way too
weak. Let's use accent as the global register, and we can modify it as needed in the future if it
feels too strong."

## 2026-09-15 · the lab is an internal app; the library is the whole rule set

**Became:** the Library x Lab round (this shell, the kit, the rule layer, the desk); `README.md`.

> "I think we need a dedicated round of library and lab UI work to make nav and presentation
> better before I can review the track work itself. For example, there's no cross-page navigation,
> each page's presentation can be super messy so it's hard for me to understand the work."
>
> "Think of this as building our own internal app to manage our design system, exploratory lab work
> that gets merged in. Remember, the goal is for the library to represent our entire working rule
> set so that everything influencing new agents' design work is visible to both me as a human, you
> as an orchestrator, and new agents. This removes any hidden influences from my sight, and
> separates global rules from component-exclusive (which helps minimize working rules agents need
> to follow in their explorations). The lab should be configured to support exploratory work, and
> may include its own UI library to support those explorations, such as the fixed/sticky GUI,
> config tools, preview galleries, variant selection, human vs ai notes, review questions, etc."

Decisions the same day: the review panel composes a message rather than writing the repo; these
rulings move into the repo; the routes rename to Library and Lab and the lab's separate token set
retires; the boards migrate in a wave after the shell, the kit, the rule layer and the desk land.

## 2026-09-15 · agent pushes do not run CI

**Became:** `.github/workflows/ci.yml`, `scripts/vercel-ignore-build.mjs`, CLAUDE.md "Git".

> "We've reached our GitHub Actions budget for the month. Burned through it massively the last
> couple of days with the sub-agents... I'd like to adjust our agent strategy moving forward so that
> we don't have single days that burn entire monthly GitHub action budgets again. Every single commit
> does not need a full CI/CD deployment, especially when it's UI heavy with minimal risk."

## 2026-09-15 · the review surface

**Became:** `guidance.md#boards-the-review-surface`; the board dock and 1:1 stages; PROGRAM.md's
"the app's UI is open".

> "For any pagewide configs, the GUI control should be fixed so that variants can be toggled on
> different previews anywhere on the page for better back-and-forth comparisons. Having to scroll
> back to the top (such as for palette) makes it very hard to review differences."
>
> "The iFrame previews throw off anything related to size, making those reviews particularly
> difficult (such as type scale - the whole point is reviewing accurate sizing). This needs to be
> fixed for pixel-perfect lab demos/previews, whether it's working off of the iframes or something
> new."
>
> "I'd love to see more UI examples for comparison, especially if they can be live production
> components using the demo palettes."
>
> "We can choose dark and light separately, don't have to be a package deal. Dark will apply to
> marketing and app, light applies to paper in marketing and light mode in app."
>
> "Overall, I don't really love our app design in general, dropdown/nested menus included. The app
> is functionally great, but UI design lags far behind the design work we've been doing for the
> marketing site... any UI that touches App in an active lab track may be worked on before the
> dedicated app agents get to it later."
>
> On a voice board: "any examples should actually show the distinction (can include similarities as
> well)"; on a light board: "this currently feels more like a fun research report without many
> applicable takeaways to carry into the platform."

## 2026-09-14 · rising tides, from the ground up

**Became:** bible 22 (`rising-tides`); PROGRAM.md "Rising tides"; CLAUDE.md's Build step.

Paraphrase of the ruling, which rejected a "bar" rule an agent had drafted from Will's own example:
there should not be a "bar" rule at all; the rule is the Rising Tides policy, enforced. No agent
can know the finished design bar in advance ("else you'd build it in one round"), so the goal is a
better and better iterative flow that funnels into a progressive bar we keep shaping. The core value
is high-agency decision-making per element: every section, component, flow and line is unprotected;
an agent asks "if this didn't exist yet, what would the perfect version be?", then builds that: if
the existing work points there, elevate; if the ideal deviates, rework entirely; lots of room in the
middle. Agents are empowered to push beyond the existing systems, components and rules to set new
peak standards. A binary of "always rework" or "always elevate slightly" produces either big progress
that loses what we like or so little risk that no progress is felt. When Will gives an example, it is
an illustration of the principle, never the rule's text.

## 2026-09-14 · unlimited design resources; light QA in exploration; nothing is protected

**Became:** PROGRAM.md (Program principles, hard gate 1); CLAUDE.md's Build step and the red-team
carve-out; the manifest template's "Assets requested from Will" line; `docs/ASSETS.md`.

> "New standing policy globally should be to design assuming you have unlimited design resources to
> support, and simply request anything needed to support; this can be incredibly specific: a row of
> themed event card images, a party video of fast paced highlight clips, inspiration images for a
> new/updated section, etc."
>
> "Since we're not messing with real functionality, testing and QA can be light, and we can red team
> more deeply on completion, since UI exploration should be more iterative rather than thorough per
> round which wastes time for iterative cycles."
>
> "We've established a few nearly production-grade elements so far, but the majority of the site
> lags far behind, and nothing should feel protected as we progress."

## 2026-09-14 · the bible's second edition

**Became:** `src/app/(dev)/design/rules/bible.ts` (nine rules rewritten, each with a status);
mono retired (bible 7 is the two-faces rule); copy opened (bible 21).

Paraphrase: Will reviewed the 22 rules line by line. Media stays the loudest thing and the interface
muted, but a section without media must still be beautiful (the accent and the aurora carry colour
where there is no media); marketing may be louder than the app in most aspects, only the token set is
shared by law; mono leaves entirely; copy is unprotected; shadows are allowed in dark where objects
stack; lamps may light a section without media (the footer is the model); the grounds are four, with
the muted panel the set-apart block; the "bar" rule is rising tides.

## 2026-09-12 · less is more: the bible plus the contracts is the whole design law

**Became:** the 22-rule bible on `/design/library/rules`; `@contract-for` tests; CLAUDE.md's
"the design law is short on purpose"; the ★ convention (a landmine, never a decision).

Paraphrase of the ruling, on seeing a first bible of 433 rules: a short global bible of
visual-identity rules, hand-authored and ratified by him, plus each component's functional contract,
is the whole design law; everything else on the site is precedent an agent may break. His diagnosis:
rules that were his one-off revision notes got logged as permanent law, and agents referencing 400+
rules produced "incredibly repetitive" designs or "very minor upgrades rather than taking big
swings"; docs and rules had created "a fear in new agents where it feels safer to aim small". He
wants big swings toward production-grade fidelity, prototyped in the lab first. No copy is pinned by
a test (his own byte-pinned lines included); a contract never freezes a look; a ★ marks a silent
breakage on revert and nothing else; his human review is parked until the UI era lands unless
something blocks or is high-leverage.

## 2026-09-11 · the library is what agents pull from; the lab is temporary

**Became:** the Library and Lab areas; `docs/ROADMAP.md` "the design lab on its own subdomain".

Paraphrase: the design library (`/design`) is what agents pull from; the lab is a temporary
exploratory surface. He wants the lab "closely tied and unified with the marketing site and app for
the agents to continually learn from and upgrade", which argues for one repository and, later, a
second deployment of the same code.

## 2026-09-01 · rules are provisional

**Became:** PROGRAM.md "★ RULES ARE PROVISIONAL TOO"; the health strip on the library home.

Paraphrase: most of the laws, doctrines, don't-revert notes and policy tests in the repo were
written by agents to keep themselves consistent, against a design system that has since moved; they
are not his rulings. The test to apply, in his words:

> "Is this a good rule that prevents bad choices, or is this a bad system that prevents good
> choices?"

Every round audits the rules it touches, keeps the ones encoding a real scar, reshapes the ones whose
reason expired, and says which it did and why in the commit.

## 2026-09-01 · chapters open strong

**Became:** bible 17 (`chapters-open-strong`); `docs/systems/design-system.md#chapters-the-attention-arc`.

The ruling as recorded in the system doc: a chapter is a pacing principle, not a component; the
first section of a chapter opens with a bespoke device (a heading a tier up, a film-cut entrance,
air, a straddling object, a drawn rule, a lit subject, a full-bleed frame) and the rest of the
chapter runs on the utility rhythm.

## 2026-08-27 · focused rounds, prototype first

**Became:** PROGRAM.md's round definitions; the lab as the iteration surface; the "would this hold up
next to the homepage?" screenshot gate in `guidance.md`.

> "Would it be more helpful to deep think with multiple dedicated plan rounds (like UI, theming,
> shuffling, generation, encoding) which may be better than a single huge pass over a massive single
> plan."

Paraphrase of the lesson behind it: reel generation shipped "zero design magic" despite ambitious
planning because the magic was never prototyped; the help centre later shipped "incredibly bland and
completely paper... best case, initial wireframes" because it was built in one pass while the home
page got screenshot-and-iterate loops. Creative and UI work is prototyped in the lab, reacted to,
tuned, then wired; every new page ends at the screenshot gate beside the home page.

## 2026-06-20 · action colours are universal

**Became:** the per-action colour system in `globals.css` (like, save, hide, approve, delete, reel);
`docs/systems/design-system.md#the-identity-achromatic-media-is-the-color`.

Paraphrase, correcting a "guest viewer unchanged" translation artifact: one colour per action
everywhere it appears, guest and host alike; the only guest/host difference is the action set, never
the colours, because colour clarity helps every user read state.

## 2026-05-31 · craft is the differentiator; guest pages are the host's

**Became:** `guidance.md` (the emil skill is primary); bible 4 (`guest-surface-is-the-host`);
`docs/systems/design-system.md#the-craft-guidance-stack`.

Paraphrase: Will installed the `emil-design-eng` skill himself and asked that it be followed on
craft-heavy UI (custom easing curves, motion under 300 ms, press feedback, GPU-only transforms,
entrances via `@starting-style`, staggers, reduced-motion safety); "taste is the differentiator".
Guest-facing pages are the host's event, not a Partyreel ad: formal, minimally branded, premium and
non-intrusive.

## 2026-05 · one brand, two volumes; media is the colour

**Became:** bible 1 (`media-is-the-color`), bible 2 (`one-token-set`); the achromatic identity
(zero brand hue since the V1 rebuild).

Paraphrase: the marketing site and the host app are one brand on one shared core design system;
marketing may run louder to attract users, but louder means bolder type, richer media frames and
more motion, never a wider palette; the chrome stays achromatic so the photographs and videos take
the stage. Marketing visuals are media-ready frames (a browser window, a phone screen, a gallery
grid, a QR card, a reel player) built so real media drops in without a layout change.

## 2026-05 · no em-dashes in copy

**Became:** bible 19 (`no-em-dashes`); `src/lib/no-em-dash-policy.test.ts`; CLAUDE.md "Copy".

Paraphrase: the long dash reads as an "AI copy" tell; recast with a comma, parentheses, a colon or
two sentences. A forward policy on user-facing copy, not a blind retroactive find-and-replace.
