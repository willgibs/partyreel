"use client";

import { useState } from "react";

import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCapacity, planById } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { ACCOUNT } from "../fixtures";

import { HostFrame } from "./settings";

/**
 * ACCOUNT AND BILLING: Maya's Account on an Event Pass, its Plan card first
 * (billing's home: there is no billing page, and the user menu's Plan row
 * opens this card).
 *
 * ★ THE PAGE IS QUOTED, NOT MOUNTED. `account/page.tsx` is a server component
 * reading a session, and its forms write to the signed-in account (a name, an
 * address, a password, a photo, a Stripe session), so the page's own
 * composition is drawn here with production's atoms, line for line in its
 * order and its words, and every press goes nowhere. What the frame proves is
 * the atoms on a real page: cards, fields, buttons, switches, a face.
 */

/** A switch row as `notification-prefs-form.tsx` draws it: the name and its line beside the switch. */
function Pref({
  id,
  label,
  hint,
  on,
}: {
  id: string;
  label: string;
  hint: string;
  on: boolean;
}) {
  const [checked, setChecked] = useState(on);
  return (
    <li className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <Label
        htmlFor={id}
        className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
      >
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </span>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={setChecked} />
    </li>
  );
}

export function AccountScreen() {
  const pass = planById("event_pass");
  return (
    <HostFrame>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <PageHeading>Account</PageHeading>
          <p className="text-sm text-muted-foreground">
            Manage your profile and how you sign in.
          </p>
        </div>

        <Card id="plan">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>
              {`${ACCOUNT.plan} · ${formatBytes(ACCOUNT.usedBytes)} of ${formatBytes(ACCOUNT.capBytes)} used · expires ${ACCOUNT.expires}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground">
                  Events
                </dt>
                <dd className="text-sm">
                  <span className="font-medium text-warning">
                    {`${ACCOUNT.events.used} of ${ACCOUNT.events.of} used`}
                  </span>
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground">
                  Storage
                </dt>
                <dd className="text-sm">{`About ${formatCapacity(ACCOUNT.capBytes)}`}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Change plan</Button>
              <Button size="sm" variant="outline">
                Manage billing
              </Button>
              <Button size="sm" variant="outline">
                {`Renew ${pass.name}`}
              </Button>
            </div>
            <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{pass.name}</span>
              {` covers one event, paid once: ${pass.priceLabel.replace(" one-time", "")} for ${formatBytes(pass.storageBytes)}.`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your photo, name, and the email tied to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size="xl" seed="identity-host">
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  Change photo
                </Button>
                <Button size="sm" variant="ghost">
                  Remove
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="identity-display-name">Display name</Label>
              <div className="flex gap-2">
                <Input
                  id="identity-display-name"
                  defaultValue={ACCOUNT.displayName}
                  autoComplete="off"
                />
                <Button disabled>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                How you appear to guests on your events and your photos.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="identity-email">Email</Label>
              <div className="flex gap-2">
                <Input id="identity-email" readOnly value={ACCOUNT.email} />
                <Button variant="outline">Change</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email preferences</CardTitle>
            <CardDescription>
              What Partyreel may email you about. Your guests never hear from
              us.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              <Pref
                id="identity-pref-pass"
                label="Event Pass reminders"
                hint="A note two weeks before your Event Pass expires, so you can renew it."
                on
              />
              <Pref
                id="identity-pref-news"
                label="Product news and occasional tips"
                hint="Off means we send you none, and your address comes off the list."
                on={false}
              />
            </ul>
          </CardContent>
        </Card>
      </div>
    </HostFrame>
  );
}
