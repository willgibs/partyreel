/**
 * WHERE A GATE SENDS A SIGNED-OUT REQUEST (crumbs-11): `/login`, carrying the page it asked for
 * when that page may be returned to (return-path.ts), so the sign-in lands back on it. The (app)
 * and (print) layouts both redirect here, which is why it is one function.
 *
 * A layout cannot read its own URL, so the proxy writes the request's path into a header
 * (REQUEST_PATH_HEADER) and this reads it back. The header is no authority: it only chooses among
 * allow-listed pages for the requester's own redirect, and a path off the list, a missing header
 * or one a client forged all come out as the bare `/login`, which is exactly the old behaviour.
 */
import "server-only";

import { headers } from "next/headers";

import { loginPath, REQUEST_PATH_HEADER } from "@/lib/auth/return-path";

export async function loginPathForRequest(): Promise<string> {
  return loginPath((await headers()).get(REQUEST_PATH_HEADER));
}
