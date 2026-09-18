import { redirect } from "next/navigation";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

// /design is the library's door (the Library x Lab round, 2026-09-15): the
// old hand-written landing duplicated the sidebar and is gone; the library
// home is generated from the same data the sidebar reads.
export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  redirect(withDesignKey("/design/library", key));
}
