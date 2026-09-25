import "server-only";

import { cache } from "react";

import { getRequestAuth } from "@/lib/supabase/request-auth";

import { livePendingChange, type PendingChange } from "./email-change";

/**
 * The account's address as Supabase Auth holds it, and the change still waiting on its codes, for
 * the email row. One read per request through the request's own `getUser()` (the layout's gate
 * already paid for it), and the clock is read HERE rather than in the page: a component body is
 * render, and `react-hooks/purity` refuses `Date.now()` there (the admin's `serverNow` is the same
 * move).
 */
export const getAccountEmailState = cache(
  async (): Promise<{
    email: string | null;
    pending: PendingChange | null;
  }> => {
    const { user } = await getRequestAuth();
    return {
      email: user?.email ?? null,
      pending: livePendingChange(user, Date.now()),
    };
  },
);
