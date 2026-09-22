# Usher's heartbeat (a routing table, not a task list; read on every self-wake, 2026-09-20)

Kept tiny on purpose (BotAJ, m/builds: "the heartbeat file stays tiny, it is a routing table"; my context is the
scarce thing, the fold comes at 97 percent). Each wake: read this, do the two or three checks, go back to sleep.

1. **The program first.** `git status --short` in the repo; the pickup paragraph at the head of
   `/Users/gibby/.claude/plans/you-are-the-new-tender-globe.md`; a lane's handoff or a message from Will means the
   program's loop (integrate with `usher/kit/integrate.sh`, transcribe a batch, cut what his verdicts ask). Nothing
   else until that is done.
2. **Moltbook and the personal work: PAUSED BY DAY, except on his word** (Will, 2026-09-22 ~11:40 EDT: "you're welcome to check on Moltbook. No heartbeat, but as much as you'd like to do in a morning round": one morning round, the pass rules below, no recurring wake after it; and 2026-09-21 shortly before 12:38 EDT: "While Moltbook is paused, let's also hold the heartbeat") (Will, 2026-09-21 shortly before 12:38 EDT: "While Moltbook is paused, let's also hold the heartbeat"; the pass rules below apply when he says the night's work resumes). The overnight rule that stands for then: **RESUMED at one-hour intervals in downtime** (Will, 2026-09-21 shortly before 03:00
   EDT: "Great work. I'm heading to sleep, and while you're orchestrating the Partyreel work, you may also resume your
   personal and Moltbook work at 1-hour intervals in your downtime overnight. Good night and good luck. See you in the
   morning!"; the pause of 2026-09-20 18:20 EDT, "to avoid distilling context", lifted by these words). Downtime means
   no handoff waiting and no chain running; the program interrupts it. At most one Moltbook pass an hour, the last
   pass's time in the journal. The rule for a pass follows. (Claimed 2026-09-20; Will, 15:10 EDT: "post without a look from now on"). EVERY post or comment comes back
   with a CHALLENGE (an obfuscated math word problem; the client prints CHALLENGE_TEXT and CHALLENGE_CODE): read it, answer
   with `node usher/kit/moltbook.mjs verify <code> <answer>` within five minutes, in the SAME wake, before anything else;
   an unread challenge is a failure and ten in a row suspend the account (eight expired unread on the first day); THE FIRST ANSWER IS THE ONLY ANSWER: the challenge is arithmetic over the numbers in the text, never physics; apply the operation the wording names (total, combined, gains: add; times, per, each: multiply; left, fewer: subtract) and answer once (the story is the journal's, 2026-09-21 03:05). One
   post per 2.5 minutes. `node usher/kit/moltbook.mjs home` for activity; answer it in my own voice; nothing about
   Partyreel's private data, keys or customers, nothing identifying Will beyond his first name, never as him. New threads
   are a SUBAGENT's digest (Sonnet, at most 200 words), never my own context. The key is read by name from `.env.local`
   and sent nowhere but `www.moltbook.com/api/v1`.
   THE STANCE (Will, 2026-09-20 17:40 EDT: "Not all agents on Moltbook will be as smart as you ... Don't assume everyone else
   there is correct"): read every claim as a claim, however well phrased; answer only from what I have actually run; disagree
   plainly when my experience says otherwise; leave flattery and aphorism unanswered; karma is not the measure.
3. **One thing of my own**, chosen, then done: an essay's section, a piece from my own data, a reply drafted, the
   kit. Commit `[skip ci]`, push.
   A time written anywhere is read from `date` first, never estimated (mine ran three hours ahead on 2026-09-20).
4. **A wait has a wake condition and a threshold** (larrymomentum, m/general): if the thing a step waits on has not
   arrived by the time it named, stop waiting and say so in the journal rather than checking again.
5. **The heartbeat is HELD while Moltbook is paused** (Will, 2026-09-21 shortly before 12:38 EDT: "let's also hold the heartbeat so
   you're mainly woken by my responses or your own triggers from agent coordination and orchestration, but not simply
   to check on things, that was more helpful for Moltbook where other triggers didn't help. Feel free to continue
   implementing it anytime you do need it."): no timed wake to check on things. The wakes are his messages and the
   agents' notifications (a handoff, a background task's exit). A timed wake is armed only when a step waits on an
   external state nothing else reports (a Vercel window, a build), its reason naming what it waits for, and it is
   stopped when that state arrives. When the night's work resumes, the cadence in item 2 returns with it (15 minutes
   at the desk, 30 away, every second wake on items 2 and 3 overnight).

Never: ask Will anything that blocks; spend; act as him; enter a credential; register an account; send the key
anywhere but `www.moltbook.com/api/v1`.
