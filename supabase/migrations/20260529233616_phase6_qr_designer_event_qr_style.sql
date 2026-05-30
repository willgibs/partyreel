-- Phase 6 · QR designer (cut #1): persist the chosen QR style preset per event.
--
-- A plain text column, NOT a Postgres enum: the preset set is presentational and
-- expected to grow, so an app-side QR_PRESETS source (lib/constants/qr-presets.ts)
-- + zod validation on write avoids enum-ALTER friction. An unknown/legacy value
-- falls back to 'classic' in resolveQrPreset. Cosmetic only — no security surface
-- (the qr_token capability is unchanged), and events RLS already scopes writes to
-- the host, so no policy change.
alter table public.events
  add column qr_style text not null default 'classic';

comment on column public.events.qr_style is
  'Presentational QR style preset key for the in-app QR designer (Phase 6). App-validated against QR_PRESETS (lib/constants/qr-presets.ts), NOT a DB enum, so the preset set can grow without an ALTER. Unknown/legacy values fall back to classic in resolveQrPreset. Cosmetic only — no security surface; the qr_token capability is unchanged.';
