import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE ENROLMENT SECRET READS IN THE BODY FACE (crumbs-78). It was a bare `<code>`, which falls to the preflight's
 * mono stack, and the product has no mono face (Will, 2026-09-14: "kill mono entirely"): a value that has to look
 * like a value gets a muted plate in the sans face, as the account page's code does. The face is the whole of the
 * change, so the pin reads the class that sets it; the painted look is production's to show (the portal cannot be
 * signed in locally, so this is the component's own eye).
 */
const SECRET = "JBSWY3DPEHPK3PXP";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      mfa: {
        listFactors: async () => ({ data: { all: [] } }),
        unenroll: vi.fn(),
        enroll: async () => ({
          data: {
            id: "factor-1",
            totp: { qr_code: "data:image/svg+xml;base64,AAAA", secret: SECRET },
          },
          error: null,
        }),
        challenge: vi.fn(),
        verify: vi.fn(),
      },
    },
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const { MfaEnroll } = await import("./mfa-enroll");

describe("the MFA enrolment", () => {
  it("★ draws the secret on the muted plate in the sans face, never the preflight's mono stack", async () => {
    render(<MfaEnroll />);
    const secret = await screen.findByText(SECRET);
    expect(secret.tagName).toBe("CODE");
    expect(secret).toHaveClass("font-sans");
    expect(secret).toHaveClass("bg-muted");
  });

  it("draws the code to scan beside it", async () => {
    render(<MfaEnroll />);
    expect(
      await screen.findByAltText("Two-factor authentication QR code"),
    ).toHaveAttribute("src", "data:image/svg+xml;base64,AAAA");
  });
});
