alter table beenthere.event_participants
  add column if not exists recovery_code_hash text;

create index if not exists event_participants_recovery_code_hash_idx
  on beenthere.event_participants (event_id, recovery_code_hash)
  where recovery_code_hash is not null;
