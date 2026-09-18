import type { Metadata } from "next";

import { AnnouncementCompose } from "@/components/admin/announcement-compose";
import { AnnouncementList } from "@/components/admin/announcement-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { listAnnouncements } from "@/lib/db/queries/announcements";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const items = await listAnnouncements();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <PageHeading>Announcements</PageHeading>
        <p className="text-sm text-muted-foreground">
          Publish a message to every host&rsquo;s notification bell. Schedule it
          for later, or publish now.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementCompose />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Published and scheduled
        </h2>
        <AnnouncementList items={items} />
      </div>
    </div>
  );
}
