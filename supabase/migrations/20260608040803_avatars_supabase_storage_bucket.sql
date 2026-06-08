-- Avatar storage bucket (migrates profile photos off Cloudflare R2 onto Supabase Storage).
-- One deterministic object per user at avatars/<userId>/avatar.webp (the bucket is the namespace,
-- so the path drops the old "avatars/" R2 prefix). Upload + delete run server-side via the
-- service-role admin client (which BYPASSES storage RLS) so NO storage.objects policy / GRANT is
-- needed; reads use the public CDN URL (avatars are public profile photos). profiles.avatar_updated_at
-- stays the service-role-write-only existence marker AND the ?v= cache-bust version, kept in lockstep
-- with this object by /api/account/avatar (the only writer of both).
--
-- file_size_limit (512 KiB) + allowed_mime_types are defense-in-depth ONLY: the route still runs the
-- authoritative Content-Length + actual-byte size check and the magic-byte isWebp() sniff before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp'])
on conflict (id) do nothing;
