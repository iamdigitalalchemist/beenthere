create type beenthere.upload_policy as enum ('open', 'curated', 'strict');

alter table beenthere.events
  add column if not exists upload_policy beenthere.upload_policy not null default 'open';
