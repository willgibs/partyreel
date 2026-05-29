"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { buildJoinSchema, type JoinValues } from "@/lib/validation/join";

const DISPLAY_NAME_KEY = "pr_display_name";

type JoinResponse =
  | { ok: true; session_token: string; event_id: string }
  | { ok: false; code: string; message: string };

export function JoinForm({
  event,
  qrToken,
  onJoined,
}: {
  event: GuestEvent;
  qrToken: string;
  onJoined: (sessionToken: string) => void;
}) {
  const schema = useMemo(
    () => buildJoinSchema(event.require_display_name, event.require_email),
    [event.require_display_name, event.require_email],
  );

  const form = useForm<JoinValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: "", email: "" },
  });

  // Prefill the name from a prior visit (returning-guest convenience).
  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) form.setValue("display_name", saved);
  }, [form]);

  async function onSubmit(values: JoinValues) {
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qr_token: qrToken,
        display_name: values.display_name || undefined,
        email: values.email || undefined,
      }),
    });
    const body = (await res.json()) as JoinResponse;

    if (!body.ok) {
      if (body.code === "display_name_required") {
        form.setError("display_name", { message: body.message });
        return;
      }
      if (body.code === "email_required") {
        form.setError("email", { message: body.message });
        return;
      }
      toast.error("Couldn't join", { description: body.message });
      return;
    }

    if (values.display_name) {
      localStorage.setItem(DISPLAY_NAME_KEY, values.display_name);
    }
    onJoined(body.session_token);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
        {event.description ? (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add your name and start sharing photos &amp; videos.
          </p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Your name{" "}
                  {!event.require_display_name && (
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    autoComplete="name"
                    placeholder="e.g. Alex"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {event.require_email && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Joining…"
              : "Join & start uploading"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-xs text-muted-foreground">
        No app, no account — your uploads go straight to the host.
      </p>
    </div>
  );
}
