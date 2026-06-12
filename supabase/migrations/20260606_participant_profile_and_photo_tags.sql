alter table beenthere.event_participants
  add column if not exists profile_photo_key text,
  add column if not exists instagram_handle text,
  add column if not exists facebook_handle text,
  add column if not exists x_handle text,
  add column if not exists tiktok_handle text;

create table if not exists beenthere.photo_tags (
  photo_id uuid not null references beenthere.photos(id) on delete cascade,
  tagged_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  tagged_by_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, tagged_participant_id)
);
