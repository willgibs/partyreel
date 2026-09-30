"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/ui/client-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { toldNameLine } from "@/lib/guest/confirm-beat";
import { checkDisplayName } from "@/lib/guest/join";
import { setLastName } from "@/lib/guest/use-stored-name";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

/**
 * THE TOLD NAME'S CHANGE, FROM THE TOAST, AS A SMALL FORM (`popups` r1,
 * `forms=dialog`, Will 2026-09-27). The one beat of a confirmation tells her
 * the name her photographs now carry, with Change as the toast's action
 * (`confirm-beat.ts`); that Change used to open the whole name door in its
 * `account` mode, a held sheet for one field. It opens this instead: one
 * question with a field in it, a small centred dialog standing in what the
 * keyboard leaves. The in-card Change (the follow moment's) stays in place.
 *
 * ★ THE SAME WRITE THE DOOR'S ACCOUNT MODE MADE, AND NOTHING MORE. A confirmed
 * account's name is its profile's, so it goes through `updateDisplayNameAction`
 * (length, reserved words and profanity checked server-side; the local check is
 * only the fast refusal), and this device's last-typed name follows it, as the
 * door's own step does. The page hears the new name (`onRenamed`) and patches
 * her tiles at once, as the door's rename did.
 *
 * ★ OPENED THROUGH THE BEAT'S OWN MODULE, NOT A PROP: the toast that asks is
 * said from the page's effect, and the page mounts this form once. Same
 * module-singleton shape as `reportConfirmBeat` and `onConfirmBeat`.
 */

const listeners = new Set<(name: string) => void>();

/** The toast's Change: open the small name form on the name she was told. */
export function openToldNameChange(name: string) {
  for (const listener of listeners) listener(name);
}

export function ToldNameForm({
  onRenamed,
}: {
  /** The name her photographs now carry, once the account took it. */
  onRenamed: (name: string) => void;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    const listener = (name: string) => {
      setValue(name);
      setRefusal(null);
      setOpen(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const checked = checkDisplayName(value);
    if (!checked.ok) {
      setRefusal(checked.refusal.message);
      return;
    }
    startSave(async () => {
      const result = await updateDisplayNameAction(checked.name);
      if (!result.ok) {
        setRefusal(result.message ?? "That name isn't available.");
        return;
      }
      setLastName(checked.name);
      setOpen(false);
      onRenamed(checked.name);
      toast.success(toldNameLine(checked.name));
    });
  }

  return (
    <Popup open={open} onOpenChange={setOpen}>
      <PopupContent kind="form">
        {/* `contents`: the form is the popup's three parts, laid out by it. */}
        <ClientForm onSubmit={submit} className="contents">
          <PopupHeader
            title="Change your name"
            description="Your new name shows on everything you have already added."
          />
          <PopupBody className="space-y-2">
            <Label htmlFor={fieldId} className="sr-only">
              Your name
            </Label>
            <Input
              id={fieldId}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (refusal) setRefusal(null);
              }}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="done"
              aria-invalid={refusal ? true : undefined}
              aria-describedby={refusal ? `${fieldId}-refusal` : undefined}
              className="h-11 text-base"
            />
            {refusal ? (
              <p
                id={`${fieldId}-refusal`}
                role="alert"
                className="text-reading text-destructive"
              >
                {refusal}
              </p>
            ) : null}
          </PopupBody>
          <PopupFooter>
            <PopupClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </PopupClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save name"}
            </Button>
          </PopupFooter>
        </ClientForm>
      </PopupContent>
    </Popup>
  );
}
