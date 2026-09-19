import type { ContactTopicValue } from "@/lib/constants/contact";

/**
 * THREE SENDERS, so a decision reads against someone real rather than an empty
 * field. None of these ever reaches `submitContactForm`: every board below is
 * read-only evidence (the manifest's rule), so a persona is copy for a mock,
 * never a value handed to the real form's `defaultValues`.
 *
 * - `host` is mid-event with something broken: the `urgency` decision's case.
 * - `planner` is weighing a plan before she books: `topic`'s "billing" case
 *   doubles as a second voice so `topic`'s reporter is not the only one shown.
 * - `reporter` is background research for a piece: `topic`'s own case, and
 *   press is also the fastest-path hint with the least room to improve.
 */
export type PersonaId = "host" | "planner" | "reporter";

export type Persona = {
  name: string;
  email: string;
  topic: ContactTopicValue;
  subject: string;
  message: string;
};

export const PERSONAS: Record<PersonaId, Persona> = {
  host: {
    name: "Priya Nair",
    email: "priya@example.com",
    topic: "bug",
    subject: "Uploads stuck mid-reception",
    message:
      "Guests say their photos aren't landing in the album and my reception is happening right now.",
  },
  planner: {
    name: "Sam Okafor",
    email: "sam@example.com",
    topic: "billing",
    subject: "Storage for a 300-guest wedding",
    message:
      "Working out which plan covers a full weekend of video before I quote the couple.",
  },
  reporter: {
    name: "Dana Whitfield",
    email: "dana@example.com",
    topic: "press",
    subject: "Background for a roundup piece",
    message:
      "Writing about QR-based photo sharing at weddings and would love five minutes on background.",
  },
};
