create table if not exists beenthere.photo_albums (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references beenthere.events(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photo_albums_event_id_idx
  on beenthere.photo_albums(event_id);

create table if not exists beenthere.album_photos (
  album_id   uuid not null references beenthere.photo_albums(id) on delete cascade,
  photo_id   uuid not null references beenthere.photos(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (album_id, photo_id)
);

create index if not exists album_photos_photo_id_idx
  on beenthere.album_photos(photo_id);
