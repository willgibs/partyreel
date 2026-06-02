"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AvatarCropper } from "@/components/app/avatar-cropper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function initialFrom(displayName: string | null, email: string | null): string {
  const source = displayName?.trim() || email?.trim() || "";
  return source ? source.charAt(0).toUpperCase() : "?";
}

// Account-page avatar control: shows the current avatar (or initial fallback), opens the
// cropper on pick, POSTs the cropped webp, and removes via DELETE. Optimistic: the chosen
// crop shows instantly here, and router.refresh() re-renders the server layout so the account
// menu (UserMenu) picks up the new presigned URL.
export function AccountAvatarForm({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  email: string | null;
}) {
  const router = useRouter();
  // Local source of truth for THIS form's avatar (immediate feedback); the UserMenu updates
  // separately via router.refresh().
  const [currentUrl, setCurrentUrl] = useState<string | null>(avatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // The optimistic object URL, tracked so we can revoke it when replaced / on unmount.
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function setPreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setCurrentUrl(url);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = ""; // allow re-picking the same file later
    if (picked) setFile(picked);
  }

  async function handleCropped(blob: Blob) {
    setSaving(true);
    try {
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: blob,
      });
      const body = (await res.json().catch(() => null)) as {
        ok: boolean;
        message?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        toast.error(body?.message ?? "Couldn't save your photo.");
        return;
      }
      setPreview(URL.createObjectURL(blob)); // optimistic; revoked on next change/unmount
      setFile(null); // close the cropper
      toast.success("Photo updated.");
      router.refresh();
    } catch {
      toast.error("Couldn't save your photo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as {
        ok: boolean;
        message?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        toast.error(body?.message ?? "Couldn't remove your photo.");
        return;
      }
      setPreview(null);
      toast.success("Photo removed.");
      router.refresh();
    } catch {
      toast.error("Couldn't remove your photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={currentUrl ?? undefined} alt="" />
        <AvatarFallback className="text-lg">
          {initialFrom(displayName, email)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
          >
            {currentUrl ? "Change photo" : "Upload photo"}
          </Button>
          {currentUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={saving}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, or WebP.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={onFileChange}
      />

      <AvatarCropper
        file={file}
        saving={saving}
        onCancel={() => {
          if (!saving) setFile(null);
        }}
        onCropped={handleCropped}
      />
    </div>
  );
}
