-- Store the join token alongside its hash so dashboards can re-display
-- join links and QR signage for host-created events.
alter table beenthere.events add column if not exists join_token text;

update beenthere.events
   set join_token = 'demo-join-token'
 where public_id = 'demo-event'
   and join_token is null;
