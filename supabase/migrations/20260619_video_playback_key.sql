-- Store the transcoded H.264 MP4 key separately from the original upload.
alter table beenthere.photos
  add column if not exists playback_key text;
