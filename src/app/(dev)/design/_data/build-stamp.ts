import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cache } from "react";

/**
 * WHICH BUILD THE REVIEWER IS LOOKING AT.
 *
 * ★ THE PROBLEM THIS EXISTS FOR (Will, 2026-09-17). His third batch arrived as
 * `r7` against a tree that had moved to `r8`, because the alias had not been
 * rebuilt since the board changed. Nothing on the page could have told him: the
 * round badge, the ledger and the spec all come from the SAME build, so a stale
 * deployment shows an old round agreeing perfectly with an old ledger. The line
 * then had to be transcribed against a scratch tree holding the older spec.
 *
 * A build cannot know whether a NEWER one exists, so this does not try. It says
 * exactly which commit is being served, the composed message carries it, and
 * `scripts/lab-review.mjs` compares it against the tree at transcription time,
 * which is the one place both numbers are in the same room.
 *
 * ★ NEVER A GATE. A missing stamp is normal (a tarball build, a worktree with
 * no `.git`), and a review is worth more than a stamp: everything here degrades
 * to `null` and the message simply carries no build line.
 */
export type BuildStamp = {
  /** The short commit sha being served. */
  sha: string;
  /** Where it came from, for the one line the desk prints. */
  from: "vercel" | "git";
  /** The branch, when it is known. */
  ref: string | null;
};

/** One hop from `.git/HEAD`, with packed refs as the fallback. */
function fromGit(): BuildStamp | null {
  const git = join(process.cwd(), ".git");
  let head: string;
  try {
    head = readFileSync(join(git, "HEAD"), "utf8").trim();
  } catch {
    return null;
  }
  // A detached HEAD is already the sha.
  if (/^[0-9a-f]{40}$/.test(head))
    return { sha: head.slice(0, 7), from: "git", ref: null };

  const ref = head.replace(/^ref:\s*/, "");
  const branch = ref.replace(/^refs\/heads\//, "");
  try {
    const sha = readFileSync(join(git, ref), "utf8").trim();
    return { sha: sha.slice(0, 7), from: "git", ref: branch };
  } catch {
    // A ref that has been packed away has no file of its own.
  }
  try {
    const packed = readFileSync(join(git, "packed-refs"), "utf8");
    const line = packed
      .split("\n")
      .find((l) => l.endsWith(` ${ref}`) && !l.startsWith("#"));
    const sha = line?.split(" ")[0];
    return sha ? { sha: sha.slice(0, 7), from: "git", ref: branch } : null;
  } catch {
    return null;
  }
}

/**
 * The build being served, or null when it cannot be known.
 *
 * Vercel sets `VERCEL_GIT_COMMIT_SHA` on every deployment with no configuration
 * of its own, so the alias answers without a build step; `pnpm dev` and a local
 * `pnpm build` read the working tree's own HEAD.
 */
export const buildStamp = cache((): BuildStamp | null => {
  const vercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercel)
    return {
      sha: vercel.slice(0, 7),
      from: "vercel",
      ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    };
  return fromGit();
});
