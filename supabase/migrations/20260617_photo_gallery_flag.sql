-- Add in_gallery boolean to photos table.
-- Photos in the gallery are visible to guests on the gallery link.
-- Only visible photos can be in the gallery; hiding a photo removes it from the gallery.
alter table beenthere.photos
  add column if not exists in_gallery boolean not null default false;

-- Index for fast gallery queries
create index if not exists photos_gallery_idx
  on beenthere.photos (event_id, in_gallery)
  where visibility = 'visible' and in_gallery = true;
