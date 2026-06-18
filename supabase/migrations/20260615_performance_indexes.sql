-- Performance indexes for high-traffic queries.
-- guest_sessions lookup by token hash (used on every authenticated request)
create index if not exists guest_sessions_token_hash_idx
  on beenthere.guest_sessions (session_token_hash);

-- guest_session_participants: find active sessions per event quickly
create index if not exists guest_session_participants_session_event_idx
  on beenthere.guest_session_participants (guest_session_id, active_for_event)
  where active_for_event = true;

-- photos: cover thumbnail lookup in smart/custom albums (by participant, filtered)
create index if not exists photos_participant_visible_idx
  on beenthere.photos (event_participant_id, uploaded_at asc)
  where status = 'ready' and visibility = 'visible' and thumbnail_key is not null;

-- photo_tags: smart album "by tag" query — find all tags per event
create index if not exists photo_tags_tagged_participant_idx
  on beenthere.photo_tags (tagged_participant_id);

-- album_photos: cover thumbnail and photo listing per album
create index if not exists album_photos_album_id_idx
  on beenthere.album_photos (album_id, added_at asc);

-- events: owner lookup for dashboard
create index if not exists events_owner_created_idx
  on beenthere.events (owner_user_id, created_at desc);

-- photos: all photos for an event ordered by upload time (gallery query)
create index if not exists photos_event_all_idx
  on beenthere.photos (event_id, uploaded_at desc)
  where visibility <> 'deleted';
