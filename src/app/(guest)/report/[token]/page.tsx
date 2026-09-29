import type { Metadata } from "next";
import Link from "next/link";

import { GuestBar } from "@/components/guest/guest-bar";
import { ReportAnswerForm } from "@/components/guest/report-answer-form";
import { Button } from "@/components/ui/button";
import { readProofAsk } from "@/lib/db/queries/reports";
import { isProofToken, proofTokenHash } from "@/lib/reports/proof-token";

/**
 * WHERE A REPORTER ANSWERS AN OPERATOR'S QUESTION (admin-triage r2, `proof=confirm`): the page the Ask for proof
 * mail's one button opens. Her answer lands on the report itself, beside its photo, so the operator reads the
 * claim and its proof in one place. The token in the path is the capability (only its hash is stored); a used,
 * closed or unknown link reads the same one line, so the page is no oracle for which it was. Never indexed, and
 * nothing here names the reported item, the host or the reporter's address: only the album and the question.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your report",
  robots: { index: false, follow: false },
};

export default async function ReportAnswerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ask = isProofToken(token)
    ? await readProofAsk(proofTokenHash(token))
    : null;

  return (
    <>
      <GuestBar />
      <main className="flex flex-1 flex-col items-center px-5 py-12">
        <div className="flex w-full max-w-md flex-col gap-5">
          {ask ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-page text-balance">
                  Add to your report
                </h1>
                <p className="text-reading text-pretty text-muted-foreground">
                  {ask.eventName
                    ? `You reported something in ${ask.eventName}. The person reviewing it asks:`
                    : "The person reviewing your report asks:"}
                </p>
              </div>
              <blockquote className="border-l-2 pl-3 text-reading whitespace-pre-line">
                {ask.question}
              </blockquote>
              <ReportAnswerForm token={token} />
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-page text-balance">
                This link has already been used
              </h1>
              <p className="text-reading text-pretty text-muted-foreground">
                Or the report it belongs to is closed. If there is more to say,
                you can write to us.
              </p>
              <div>
                <Button asChild variant="outline">
                  <Link href="/contact">Write to us</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
