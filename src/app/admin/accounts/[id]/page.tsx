import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { adminNotFoundMetadata } from "@/app/admin/not-found.metadata";
import { AdminNotFoundPageScreen } from "@/app/admin/not-found.screen";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  getAccountDetail,
  readAccountHourUploads,
  readAccountUploads,
  type Reading,
} from "@/lib/db/queries/accounts";
import { getAccountDeletionState } from "@/lib/lifecycle/account-deletion";
import { nextPurgeWindow } from "@/lib/lifecycle/purge-time";
import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import { captureWarning } from "@/lib/observability/sentry";
import { formatBytes } from "@/lib/utils";
import { isUuidShape } from "@/lib/validation/uuid-shape";
import { PageHeading } from "@/components/shared/page-heading";
import { capLabel } from "../cap";
import {
  hourLabel,
  hourState,
  NO_READING,
  uploadsState,
  usedOfLabel,
  windowLabel,
} from "../uploads";
import {
  CancelDeletionControl,
  DeleteAccountControl,
} from "./delete-account-control";

export const dynamic = "force-dynamic";

/** When tonight's purge has run, as the operator reads it (the window's end, `purge-time.ts`). */
function nextPurgeBy(): string {
  return formatAdminTimestamp(nextPurgeWindow(Date.now()).end);
}

/** The account, read once a request for the page and its title (React's cache shares it within the render). */
const readAccount = cache(getAccountDetail);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // The title reads the record, so it passes the portal's gate first, as the page does (the album page says why).
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return { title: "Account" };
  const { id } = await params;
  // ★ A record that is gone is titled as the 404 it is (crumbs-28): the page draws its not-found itself. So is an id
  // that is not one, which is never read (the album page says why).
  return isUuidShape(id) && (await readAccount(id))
    ? { title: "Account" }
    : adminNotFoundMetadata;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

/** What a reading says when it was not taken: "No reading" and why, in the failure tone, never a zero. */
function NoReading({ reading }: { reading: Reading<unknown> }) {
  return (
    <>
      <span className="text-destructive">{NO_READING}</span>
      {reading.ok ? null : (
        <span className="block text-caption break-words text-muted-foreground">
          {reading.message}
        </span>
      )}
    </>
  );
}

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { id } = await params;
  // An id that is not one names no account and is never read (build 33's red-team); drawn here, never thrown. The
  // album page says why of both (crumbs-28).
  const account = isUuidShape(id) ? await readAccount(id) : null;
  if (!account) return <AdminNotFoundPageScreen />;
  // Her uploads are read beside the deletion state, each its own read: one that fails says No reading and never
  // fails the page, so the operator who came to read something else (the delete below) still has it.
  const [deletion, uploads, hour] = await Promise.all([
    getAccountDeletionState(id),
    readAccountUploads(account.profile),
    readAccountHourUploads(id),
  ]);
  // Said once to Sentry (the read swallows its failure into No reading, so nothing else would), with the first reason.
  const unread = [uploads.used, hour].flatMap((r) => (r.ok ? [] : [r.message]));
  if (unread.length > 0) {
    captureWarning("admin", "account: uploads read failed", {
      user_id: id,
      unread: unread.length,
      message: unread[0],
    });
  }
  const uploadsAt = uploadsState(uploads);
  const hourAt = hourState(hour);

  const { profile } = account;
  const capText = capLabel(account.effectiveCapBytes);
  const subscriptionLabel = account.hasSubscription
    ? "Active subscription"
    : profile.tier === "event_pass"
      ? "Event Pass"
      : "None";

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/accounts"
        prefetch={false}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Accounts
      </Link>

      <div>
        <PageHeading>
          {profile.display_name?.trim() || profile.email || "Account"}
        </PageHeading>
        <p className="text-sm text-muted-foreground">
          {profile.email ?? profile.id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Tier">
            <Badge variant="secondary">{account.tierLabel}</Badge>
          </Row>
          <Row label="Subscription">{subscriptionLabel}</Row>
          {profile.tier_expires_at ? (
            <Row label="Pass expires">
              <span>{formatAdminDate(profile.tier_expires_at)}</span>
            </Row>
          ) : null}
          {profile.storage_grace_until ? (
            <Row label="Over-cap grace until">
              <span>{formatAdminDate(profile.storage_grace_until)}</span>
            </Row>
          ) : null}
          <Row label="Stripe">
            {account.stripeCustomerUrl ? (
              <a
                href={account.stripeCustomerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground underline"
              >
                View customer
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              "No customer"
            )}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage and usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* Her plan's cap holds her albums and her Deleted together, so each is drawn and the total is the figure
              the cap is read against (a delete frees nothing until the item leaves Deleted for good). */}
          <Row label="Albums">{formatBytes(account.activeBytes)}</Row>
          <Row label="Deleted">{formatBytes(account.deletedBytes)}</Row>
          <Row label="Stored">
            {formatBytes(account.storedBytes)} of {capText}
          </Row>
          <Row label="Counter (real bytes)">
            {formatBytes(account.storageUsedBytes)}
          </Row>
          <Row label="Events">{formatCount(account.eventCount)}</Row>
          <Row label="Media">{formatCount(account.mediaCount)}</Row>
        </CardContent>
      </Card>

      {/* The refusals an upload meets before the room: the plan's allowance over its window and the hour's breaker
          (the same reads the presign makes, `uploads_used` and the month's ledger row). Read-only: nothing here
          lifts a count (admin-observability.md). */}
      <Card>
        <CardHeader>
          <CardTitle>Uploads</CardTitle>
          <CardDescription>
            What her plan lets her and her guests upload. A delete never gives
            it back.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={windowLabel(uploads.window)}>
            {uploads.used.ok ? (
              <span className="inline-flex flex-wrap items-center justify-end gap-2">
                {uploadsAt === "at" ? (
                  <Badge variant="warning">At limit</Badge>
                ) : null}
                {usedOfLabel(uploads)}
              </span>
            ) : (
              <NoReading reading={uploads.used} />
            )}
          </Row>
          {uploadsAt === "at" ? (
            <p className="text-caption text-muted-foreground">
              At her allowance: her guests&apos; uploads are refused until the
              window turns.
            </p>
          ) : null}
          <Row label="Started this hour">
            {hour.ok ? (
              <span className="inline-flex flex-wrap items-center justify-end gap-2">
                {hourAt === "at" ? (
                  <Badge variant="warning">At limit</Badge>
                ) : null}
                {hourLabel(hour)}
              </span>
            ) : (
              <NoReading reading={hour} />
            )}
          </Row>
          {hourAt === "at" ? (
            <p className="text-caption text-muted-foreground">
              At the hour&apos;s breaker: uploads are refused until the next UTC
              hour.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Created">
            <span>{formatAdminTimestamp(profile.created_at)}</span>
          </Row>
          <Row label="Last active">
            <span>{formatAdminTimestamp(profile.last_active_at)}</span>
          </Row>
          <Row label="User ID">
            <code className="rounded bg-muted px-1.5 py-0.5 font-sans text-xs tabular-nums select-all">
              {profile.id}
            </code>
          </Row>
        </CardContent>
      </Card>

      {/* The operator half of self-serve deletion: for the person who writes in
          from an address they can no longer sign in with, and for a takedown
          that ends in closing the account. Once requested, the one control left
          is the private failsafe, Cancel deletion, until the purge has run (a
          profile row here means the sign-in still exists). */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            {deletion.requestedAt ? "Deletion in progress" : "Delete account"}
          </CardTitle>
          <CardDescription>
            {deletion.requestedAt
              ? "The profile is anonymised and the account cannot sign in. The purge cron finishes the hard delete."
              : "Immediate and permanent, exactly as if the account holder had done it themselves."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {deletion.requestedAt ? (
            <>
              <Row label="Requested">
                <span>{formatAdminTimestamp(deletion.requestedAt)}</span>
              </Row>
              <Row label="Events left to purge">
                {formatCount(deletion.eventCount)}
              </Row>
              {deletion.heldEventCount > 0 ? (
                <Row label="Blocked by a legal hold">
                  <Badge variant="secondary">
                    {formatCount(deletion.heldEventCount)}
                  </Badge>
                </Row>
              ) : (
                // What the person was told: the sign-in goes by this time, and only then can the
                // address start fresh (a held account waits for its hold, and is never told).
                <Row label="Purged by">
                  <span>{nextPurgeBy()}</span>
                </Row>
              )}
              {deletion.eventCount === 0 && (
                <p className="text-muted-foreground">
                  Nothing left to purge. The next run removes the sign-in
                  record.
                </p>
              )}
              <div className="pt-1">
                <CancelDeletionControl
                  userId={profile.id}
                  eventCount={deletion.eventCount}
                />
              </div>
            </>
          ) : (
            <DeleteAccountControl
              userId={profile.id}
              identifier={profile.email ?? profile.id}
              eventCount={deletion.eventCount}
              heldEventCount={deletion.heldEventCount}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
