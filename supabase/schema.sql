create extension if not exists "pgcrypto";

create schema if not exists beenthere;

create type beenthere.event_status as enum ('draft', 'active', 'ended', 'expired');
create type beenthere.event_role as enum ('owner', 'cohost', 'guest');
create type beenthere.participant_status as enum ('active', 'blocked', 'removed');
create type beenthere.photo_status as enum ('uploading', 'processing', 'ready', 'failed');
create type beenthere.photo_visibility as enum (
  'visible',
  'pending_review',
  'hidden',
  'reported',
  'deleted'
);
create type beenthere.event_plan as enum ('draft', 'event', 'event_plus');

create table beenthere.events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete restrict,
  public_id text not null unique,
  join_token_hash text not null unique,
  name text not null,
  template text not null default 'other',
  status beenthere.event_status not null default 'draft',
  plan beenthere.event_plan not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  upload_closes_at timestamptz not null,
  gallery_expires_at timestamptz not null,
  language text not null default 'en',
  welcome_message text not null default '',
  pin_hash text,
  storage_limit_bytes bigint not null default 0,
  storage_used_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table beenthere.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references beenthere.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role beenthere.event_role not null default 'guest',
  display_name text not null,
  status beenthere.participant_status not null default 'active',
  can_export_originals boolean not null default false,
  consent_uploaded_at timestamptz,
  consent_version text,
  profile_photo_key text,
  instagram_handle text,
  facebook_handle text,
  x_handle text,
  tiktok_handle text,
  recovery_code_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table beenthere.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table beenthere.guest_session_participants (
  guest_session_id uuid not null references beenthere.guest_sessions(id) on delete cascade,
  event_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  active_for_event boolean not null default false,
  last_active_at timestamptz not null default now(),
  primary key (guest_session_id, event_participant_id)
);

create table beenthere.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references beenthere.events(id) on delete cascade,
  event_participant_id uuid not null references beenthere.event_participants(id) on delete restrict,
  status beenthere.photo_status not null default 'uploading',
  visibility beenthere.photo_visibility not null default 'visible',
  original_key text not null,
  thumbnail_key text,
  preview_key text,
  original_file_name text not null,
  original_content_type text not null,
  original_size_bytes bigint not null,
  content_hash text,
  width integer,
  height integer,
  uploaded_at timestamptz not null default now(),
  taken_at timestamptz,
  deleted_at timestamptz,
  unique (event_id, event_participant_id, content_hash)
);

create table beenthere.photo_favorites (
  photo_id uuid not null references beenthere.photos(id) on delete cascade,
  event_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, event_participant_id)
);

create table beenthere.photo_tags (
  photo_id uuid not null references beenthere.photos(id) on delete cascade,
  tagged_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  tagged_by_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, tagged_participant_id)
);

create table beenthere.photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references beenthere.photos(id) on delete cascade,
  event_participant_id uuid references beenthere.event_participants(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table beenthere.upload_reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references beenthere.events(id) on delete cascade,
  event_participant_id uuid not null references beenthere.event_participants(id) on delete cascade,
  photo_id uuid references beenthere.photos(id) on delete cascade,
  reserved_bytes bigint not null,
  finalized_bytes bigint,
  status text not null default 'reserved',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table beenthere.export_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references beenthere.events(id) on delete cascade,
  requested_by_participant_id uuid not null references beenthere.event_participants(id) on delete restrict,
  include_hidden boolean not null default false,
  status text not null default 'queued',
  r2_key text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index photos_event_ready_idx
  on beenthere.photos (event_id, uploaded_at desc)
  where status = 'ready' and visibility = 'visible';

create index event_participants_event_idx on beenthere.event_participants (event_id);
create index upload_reservations_expiry_idx on beenthere.upload_reservations (expires_at);

create or replace function beenthere.increment_event_storage(
  target_event_id uuid,
  bytes_to_add bigint
)
returns void
language sql
as $$
  update beenthere.events
  set storage_used_bytes = storage_used_bytes + bytes_to_add,
      updated_at = now()
  where id = target_event_id;
$$;

alter publication supabase_realtime add table beenthere.photos;
