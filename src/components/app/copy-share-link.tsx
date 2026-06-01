"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CopyShareLinkProps = {
  /** Public album URL (…/a/<share_token>) guests can view without an account. */
  url: string;
};

export function CopyShareLink({ url }: CopyShareLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      // Revert the icon after a beat; the toast is the durable confirmation.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="font-mono text-xs"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={copy}
        aria-label="Copy share link"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
