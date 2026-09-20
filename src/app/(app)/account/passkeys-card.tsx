"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  forgetPasskey,
  markPasskeyOffered,
  rememberPasskey,
} from "@/lib/auth/remembered-email";
import { createClient, PASSKEYS_ENABLED } from "@/lib/supabase/client";
import { formatEventDate } from "@/lib/utils";

/**
 * PASSKEYS, ON THE ACCOUNT PAGE (Will, 2026-09-20, `app-door` r1 `return=tap`,
 * wired behind `NEXT_PUBLIC_PASSKEYS`).
 *
 * The flagged answer, in one sentence: a press that signs anyone in without a
 * credential is never acceptable, and a passkey IS a credential, so the option
 * is right exactly as far as passkeys reach. This card is the second half of
 * that — the door offers to save one after a code sign-in, and a host manages
 * them here.
 *
 * ★ IT RENDERS NOTHING WHEN THE FLAG IS OFF, and the flag stays off until the
 * Supabase dashboard has passkeys enabled and its Relying Party id matches the
 * apex (lib/supabase/client.ts says why). So the shipped account page is
 * unchanged until Will sets both.
 *
 * ★ AND THE WHOLE CEREMONY IS THE BROWSER'S. `registerPasskey` needs
 * `navigator.credentials` and a live session; there is nothing a server action
 * could do here that the browser client is not already the right place for, so
 * this card has no action file. The session is the authorisation, and Supabase
 * scopes every passkey call to the caller.
 */
type Passkey = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function PasskeysCard() {
  const [keys, setKeys] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.passkey.list();
      setKeys(error ? [] : (data ?? []));
    } catch {
      // The experimental API throws when the project has no passkey factor.
      // An empty list is the honest reading: this account has none it can use.
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    if (!PASSKEYS_ENABLED) return;
    let active = true;
    void (async () => {
      if (!active) return;
      setSupported(
        typeof window !== "undefined" && "PublicKeyCredential" in window,
      );
      await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  if (!PASSKEYS_ENABLED) return null;

  async function add() {
    setBusy(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) {
        toast.error("Couldn't save a passkey", { description: error.message });
      } else {
        // The device HINT is what lets /login draw its one-press button without
        // firing a WebAuthn ceremony on page load (remembered-email.ts).
        rememberPasskey();
        markPasskeyOffered();
        toast.success("Passkey saved on this device.");
        await load();
      }
    } catch {
      // A cancelled system sheet is a decision, not an error worth shouting.
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
      if (error) {
        toast.error("Couldn't remove that passkey.");
      } else {
        const left = (keys ?? []).filter((k) => k.id !== id);
        // ★ The hint must go with the LAST key, or the door keeps offering a
        // one-press that can only fail. A stale hint costs one refused press;
        // clearing it here keeps even that from happening.
        if (left.length === 0) forgetPasskey();
        setKeys(left);
        toast.success("Passkey removed.");
      }
    } catch {
      toast.error("Couldn't remove that passkey.");
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Sign in faster on a device you trust. A passkey uses your fingerprint,
          face or screen lock, and never leaves the device. Your email code and
          Google keep working.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {keys === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No passkeys yet on this account.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Fingerprint className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {key.friendly_name ?? "Passkey"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatEventDate(key.created_at)}
                    {key.last_used_at
                      ? ` · last used ${formatEventDate(key.last_used_at)}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove this passkey"
                  disabled={busy}
                  onClick={() => void remove(key.id)}
                  className="active:scale-90 motion-reduce:active:scale-100"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy || !supported}
          onClick={() => void add()}
          className="active:scale-[0.99] motion-reduce:active:scale-100"
        >
          <Fingerprint /> {busy ? "Working…" : "Add a passkey"}
        </Button>
        {!supported && (
          <p className="text-xs text-muted-foreground">
            This browser can&rsquo;t save passkeys.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
