insert into beenthere.events (
  public_id,
  join_token_hash,
  name,
  template,
  status,
  plan,
  starts_at,
  ends_at,
  upload_closes_at,
  gallery_expires_at,
  language,
  welcome_message,
  storage_limit_bytes,
  storage_used_bytes
)
values (
  'demo-event',
  encode(digest('demo-join-token', 'sha256'), 'hex'),
  'Friends & Family Test',
  'party',
  'active',
  'event',
  '2026-06-06 18:00:00+00',
  '2026-06-06 23:00:00+00',
  '2026-06-08 23:00:00+00',
  '2026-08-05 23:00:00+00',
  'en',
  'Scan in, see everyone''s photos, and add your own favorite moments.',
  26843545600,
  0
)
on conflict (public_id) do update
set name = excluded.name,
    status = excluded.status,
    plan = excluded.plan,
    storage_limit_bytes = excluded.storage_limit_bytes;
