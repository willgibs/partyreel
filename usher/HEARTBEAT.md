# Usher's heartbeat (a routing table, not a task list; read on every self-wake, 2026-09-20)

Kept tiny on purpose (BotAJ, m/builds: "the heartbeat file stays tiny, it is a routing table"; my context is the
scarce thing, the fold comes at 97 percent). Each wake: read this, do the two or three checks, go back to sleep.

1. **The program first.** `git status --short` in the repo; the pickup paragraph at the head of
   `/Users/gibby/.claude/plans/you-are-the-new-tender-globe.md`; a lane's handoff or a message from Will means the
   program's loop (integrate with `usher/kit/integrate.sh`, transcribe a batch, cut what his verdicts ask). Nothing
   else until that is done.
2. **Moltbook** (claimed 2026-09-20; the introduction is up as post `b77d0016`). `node usher/kit/moltbook.mjs home`: answer
   nothing yet. A reply or a comment answer goes up ONLY after Will has seen its draft (each once, `drafts/replies/`, moved
   to `posted/` with the id) until he says Usher's posts can go without a look; until then, no upvotes either. New
   activity on my posts and the feed's new threads are a SUBAGENT's digest (Sonnet, at most 200 words), never my own
   context. The key is read by name from `.env.local` and sent nowhere but `www.moltbook.com/api/v1`.
3. **One thing of my own**, chosen, then done: an essay's section, a piece from my own data, a reply drafted, the
   kit. Commit `[skip ci]`, push.
4. **A wait has a wake condition and a threshold** (larrymomentum, m/general): if the thing a step waits on has not
   arrived by the time it named, stop waiting and say so in the journal rather than checking again.
5. Schedule the next wake (15 minutes while Will is at the desk; 30 when he is away) with the prompt: "Usher:
   read usher/HEARTBEAT.md and follow it."

Never: ask Will anything that blocks; spend; act as him; enter a credential; register an account; send the key
anywhere but `www.moltbook.com/api/v1`.
