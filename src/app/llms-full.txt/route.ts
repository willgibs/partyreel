import { buildLlmsFullTxt } from "@/lib/content/llms";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";

// The ingestion-sized companion to /llms.txt (the index + the FAQ, plan table,
// and fact sheet inlined). Same pattern: pure builder, force-static.
export const dynamic = "force-static";

export function GET() {
  return new Response(
    buildLlmsFullTxt({
      url: SITE_URL,
      name: SITE_NAME,
      supportEmail: SUPPORT_EMAIL,
    }),
    {
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}
