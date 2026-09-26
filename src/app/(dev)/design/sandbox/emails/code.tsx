"use client";

/**
 * THE CODE MAIL, AS A LABELLED MOCK. The real sign-in mail is a Supabase
 * dashboard template over Resend SMTP, out of this repo entirely (auth-
 * accounts.md), so nothing here is wired to anything: this is what its HTML
 * COULD be if the dashboard template were redrawn to match the brand, and the
 * banner says so on every option.
 */

/**
 * `button` (no visible digits, a Sign in button only) left the option set
 * first: app-door r1 makes the code the way in for everybody, so a mail with
 * no code at all is no longer a real answer. `digits` (no button at all) left
 * next, on the identity round: the verified-required gate now promises "One
 * tap and you're in" before she ever opens this inbox, and a mail with
 * nothing to tap would break that promise the moment she got here.
 *
 * `continue` and `promise` both keep the digits AND a button beneath them,
 * differing only in what the button says. `copy` (the refresh's addition)
 * questions the button itself: no email client runs the script a real
 * one-tap copy would need, but the digits are still the one thing she can
 * act on without leaving her inbox, so they become the highlighted block,
 * captioned for the tap-and-hold gesture every mail client already
 * supports, with a small text link underneath for the device that has
 * nowhere local to paste them back into.
 */
export type CodeShape = "continue" | "promise" | "copy";

const CODE = "482915";

const BUTTON_LABEL: Record<"continue" | "promise", string> = {
  continue: "Continue",
  promise: "One tap, you're in",
};

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
      {shape === "copy" ? (
        <>
          {/* A static block, not a button: no email client runs the script a
              real one-tap copy would need. What changes is the invitation —
              the code reads as the thing to select, captioned for the native
              tap-and-hold gesture every mail client already supports. */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              width: "100%",
              margin: "20px 0 6px",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px dashed #ccc",
              background: "#fafafa",
              boxSizing: "border-box",
            }}
          >
            {/* The size-of reader measures a node's OWN computed font-size
                (mock.tsx's sizeOf), so the marker sits on this span, not the
                flex row around it: the row itself never declares a size. */}
            <span
              data-inbox-digits
              style={{
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: "0.15em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {CODE}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>
              Copy
            </span>
          </div>
          <p style={{ color: "#888", fontSize: 12, margin: "0 0 20px" }}>
            Tap and hold to copy, then switch back to Partyreel and paste it
            in.
          </p>
          <p style={{ margin: "0 0 20px" }}>
            <a
              data-inbox-cta
              href="#"
              style={{ color: "#111", fontSize: 13, fontWeight: 600 }}
            >
              Or continue in your browser instead
            </a>
          </p>
        </>
      ) : (
        <>
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
              {BUTTON_LABEL[shape]}
            </a>
          </p>
        </>
      )}
      <p style={{ color: "#888", fontSize: 12, marginTop: 24 }}>
        This code expires in 10 minutes. Didn&rsquo;t request it? Ignore this
        email.
      </p>
    </div>
  );
}
