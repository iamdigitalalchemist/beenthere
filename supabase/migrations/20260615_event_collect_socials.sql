alter table beenthere.events
  add column if not exists collect_socials boolean not null default false;
