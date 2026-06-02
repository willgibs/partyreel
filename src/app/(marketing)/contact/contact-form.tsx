"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";

import { submitContactForm } from "./actions";

// Shared card shell so the live form and the success state render in one identical
// container: submitting swaps the inner content without the frame appearing or
// reflowing (the old success state was a card while the form was bare).
function FormCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      {children}
    </div>
  );
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: ContactInput) {
    const result = await submitContactForm(values);
    if (result.ok) {
      setSubmitted(true);
      form.reset();
      toast.success("Thanks! Your message is on its way.");
    } else {
      toast.error(result.error);
    }
  }

  if (submitted) {
    return (
      <FormCard>
        {/* h-full + justify-center so the short confirmation sits centered in the
            stretched card frame (the grid matches its height to the form column). */}
        <div
          data-contact-success
          className="flex h-full flex-col items-start justify-center gap-3"
        >
          <h3 className="font-heading text-lg font-medium">Message sent</h3>
          <p className="text-sm text-muted-foreground">
            Thanks for reaching out. We&rsquo;ll get back to you within one
            business day.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubmitted(false)}
          >
            Send another
          </Button>
        </div>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Honeypot — hidden from real users; bots that fill it are silently dropped. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            {...form.register("website")}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Subject{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="What's this about?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="How can we help?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="self-start transition-transform active:scale-[0.98]"
          >
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
        </form>
      </Form>
    </FormCard>
  );
}
