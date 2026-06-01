"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { publishAnnouncementAction } from "@/app/admin/announcements/actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  announcementSchema,
  type AnnouncementInput,
} from "@/lib/validation/announcement";

// Operator compose form for a host-facing announcement. RHF + zodResolver + the shared form primitives
// (the marketing contact/careers pattern); publishes via the AAL2-gated server action, then resets.
export function AnnouncementCompose() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", body: "", href: "", publishedAt: "" },
  });

  function onSubmit(values: AnnouncementInput) {
    startTransition(async () => {
      const result = await publishAnnouncementAction(values);
      if (result.ok) {
        toast.success("Announcement published.");
        form.reset();
        return;
      }
      toast.error("Couldn't publish the announcement.", {
        description: result.message,
      });
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What's new" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="A short message for hosts"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="href"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Link{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="publishedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Schedule{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, publishes now if blank)
                </span>
              </FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Publishing…" : "Publish announcement"}
        </Button>
      </form>
    </Form>
  );
}
