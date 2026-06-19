-- Add media_type column to distinguish images from videos.
-- Videos are excluded from the slideshow gallery.
alter table beenthere.photos
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video'));

-- Index to make slideshow queries efficient.
create index if not exists photos_media_type_idx on beenthere.photos (event_id, media_type, status, visibility);
