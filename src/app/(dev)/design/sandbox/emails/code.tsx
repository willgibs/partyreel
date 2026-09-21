"use client";

/**
 * THE CODE MAIL, AS A LABELLED MOCK. The real sign-in mail is a Supabase
 * dashboard template over Resend SMTP, out of this repo entirely (auth-
 * accounts.md), so nothing here is wired to anything: this is what its HTML
 * COULD be if the dashboard template were redrawn to match the brand, and the
 * banner says so on every option.
 */

/**
 * `button` (no visible digits, a Sign in button only) left the option set:
 * app-door r1 makes the code the way in for everybody, so a mail with no
 * code at all is no longer a real answer. Both shapes left standing draw the
 * digits; they differ only in whether a Continue button rides beneath them.
 */
export type CodeShape = "digits" | "digits-button";

const CODE = "482915";

function MockBanner() {
  return (
    <p
      data-inbox-mock-banner
      className="mb-4 rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-600"
    >
      Hypothetical: a dashboard template, not wired to anything
    </p>
  );
}

export function CodeMock({ shape }: { shape: CodeShape }) {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#111" }}>
      <MockBanner />
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>
        Sign in to Partyreel
      </h1>
      <p
        data-inbox-digits
        style={{
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: "0.15em",
          fontVariantNumeric: "tabular-nums",
          margin: "20px 0",
        }}
      >
        {CODE}
      </p>
      {shape === "digits-button" ? (
        <p style={{ margin: "8px 0 20px" }}>
          <a
            data-inbox-cta
            href="#"
            style={{
              background: "#101010",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Continue
          </a>
        </p>
      ) : null}
      <p style={{ color: "#888", fontSize: 12, marginTop: 24 }}>
        This code expires in 10 minutes. Didn&rsquo;t request it? Ignore this
        email.
      </p>
    </div>
  );
}
