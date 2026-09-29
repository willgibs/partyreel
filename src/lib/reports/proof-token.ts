/**
 * THE ANSWER LINK'S TOKEN (admin-triage r2, `proof=confirm`): what Ask for proof mails the reporter, and the one
 * thing that lets her add her answer to her report without an account. 32 random bytes as 64 lowercase hex, the
 * shape the telemetry redaction already strips from every URL and breadcrumb (`telemetry-redaction.ts`), and
 * stored only as its SHA-256, so the reports table never holds a working link. It dies with its first answer
 * and when the report closes (a trigger forgets its hash with the reporter's address).
 */
import "server-only";

import { createHash, randomBytes } from "node:crypto";

const TOKEN_SHAPE = /^[0-9a-f]{64}$/;

/** A fresh token for one ask. */
export function newProofToken(): string {
  return randomBytes(32).toString("hex");
}

/** The only form the token is kept in. */
export function proofTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A path segment that could be a token (anything else is a 404 without a read). */
export function isProofToken(raw: unknown): raw is string {
  return typeof raw === "string" && TOKEN_SHAPE.test(raw);
}
