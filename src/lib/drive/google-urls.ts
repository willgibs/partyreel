/**
 * EVERY GOOGLE ADDRESS PARTYREEL CALLS, AND THE THREE SCOPES IT ASKS FOR (drive-export.md, "OAuth"), pinned twice.
 *
 * ★ `drive.file`, NEVER MORE. Google's non-sensitive Drive scope reaches only the files and folders Partyreel creates,
 * so it needs brand verification only: no CASA, no 100-user cap. The restricted set (`drive`, `drive.readonly`,
 * `drive.metadata`, `drive.metadata.readonly`, `drive.activity*`, `drive.meet.readonly`, `drive.scripts`) is never
 * asked for. `openid email` are non-sensitive too and buy "connected as" and `sub`, the Google account's stable id.
 *
 * ★ AND EVERY ADDRESS IS ON THIS LIST: `google-urls.test.ts` reads every Google URL in the app's Drive code and the
 * Worker's and holds each to it, so a later "read what is in her folder" (a restricted scope) cannot slip in unseen.
 */

/** The scopes the authorization URL asks for, exactly (`google-urls.test.ts`). */
export const DRIVE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/drive.file",
] as const;

/** The one Drive scope a connection must hold (Google's granular consent lets her untick it). */
export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export const GOOGLE_URLS = {
  /** The consent screen (the browser goes there; the app only builds the address). */
  authorize: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
  revoke: "https://oauth2.googleapis.com/revoke",
  /** Metadata: files.create (a folder), files.get, files.list by our own appProperties, files.delete (our own). */
  files: "https://www.googleapis.com/drive/v3/files",
  /** The resumable upload (the Worker's). */
  upload: "https://www.googleapis.com/upload/drive/v3/files",
  /** about.get: her Drive's room. */
  about: "https://www.googleapis.com/drive/v3/about",
} as const;

/** The issuers an ID token from Google's own token endpoint may name. */
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;
