-- Structured topic for /contact submissions (the contact round, 2026-08-28).
-- WHY: the rebuilt form's first field is a required topic picker. A structured
-- value (unlike the free-text subject) is what the /admin/support inbox can
-- group by today and what future support routing/auto-answers can key on.
-- Nullable on purpose: rows predating the field have no topic, and requiredness
-- is an app-layer rule (the DB stays permissive so a mid-deploy old client
-- inserting without a topic never errors).
-- The value list mirrors CONTACT_TOPICS in src/lib/constants/contact.ts (the
-- app-side single source); change one -> change the other.
alter table public.contact_submissions add column topic text
  check (topic in ('hosting', 'guest', 'billing', 'press', 'privacy', 'bug', 'other'));
