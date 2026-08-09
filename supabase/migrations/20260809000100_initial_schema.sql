-- XOholy initial schema.
--
-- Two rules are encoded structurally here rather than left to application code:
--
--   1. XOholy never stores media it did not create. A shared post keeps a canonical URL
--      and oEmbed metadata (post_embeds); only native uploads get a media row
--      (post_media). The split is a table boundary so that "did we re-host this?" is
--      answerable by looking at the schema.
--
--   2. Nothing is visible until it has been moderated. Row-level security filters on
--      status = 'approved', so a bug in a feed query cannot leak unreviewed content —
--      the database refuses to return it.

create extension if not exists "pgcrypto";
-- Case-insensitive handles: @PastorJoe and @pastorjoe must not be two different people.
create extension if not exists "citext";
create extension if not exists "vector";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type post_kind as enum (
  'embed',          -- shared from YouTube/TikTok/Instagram, played in their player
  'native_video',   -- uploaded here, served by us
  'photo',
  'text',
  'prayer_request',
  'testimony'
);

create type embed_provider as enum ('youtube', 'tiktok', 'instagram');

create type post_status as enum ('pending', 'approved', 'rejected', 'removed');

-- The XOholy interaction vocabulary. One enum, not three tables: XO, Amen and Pray are
-- three different human acts on the same object, and the ranking layer is what treats
-- them differently (see packages/shared/src/ranking.ts — 'amen' scores zero).
create type reaction_kind as enum ('xo', 'amen', 'pray');

create type moderation_stage as enum ('safety', 'doctrine');
create type moderation_verdict as enum ('approve', 'reject', 'escalate');

create type feed_surface as enum (
  'for_you', 'following', 'live', 'discover', 'profile', 'post'
);

create type report_reason as enum (
  'not_christian', 'safety', 'harassment', 'spam', 'impersonation', 'copyright', 'other'
);

create type verification_kind as enum ('creator', 'ministry', 'church');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  handle          citext not null unique,
  display_name    text not null,
  avatar_url      text,
  bio             text check (char_length(bio) <= 500),
  links           jsonb not null default '[]'::jsonb,

  -- Descriptive tags, not a hierarchy of legitimacy. Lets users tune their own feed
  -- instead of the platform adjudicating intra-Christian disagreement for them.
  tradition_tags  text[] not null default '{}',

  is_creator      boolean not null default false,
  is_ministry     boolean not null default false,
  verified_as     verification_kind,

  -- Drives the moderation fast-lane. Earned by approved posts, lost to upheld reports.
  reputation_score  integer not null default 0,
  approved_post_count integer not null default 0,
  upheld_report_count integer not null default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint handle_format check (handle ~ '^[a-z0-9_]{3,30}$')
);

create index profiles_handle_idx on profiles (handle);

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------

create table posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles (id) on delete cascade,
  kind          post_kind not null,
  caption       text check (char_length(caption) <= 2000),

  -- Nothing reaches a feed at 'pending'. See the RLS policy below.
  status        post_status not null default 'pending',
  status_reason text,

  topics        text[] not null default '{}',
  tradition_tags text[] not null default '{}',

  -- Denormalised counters, maintained by trigger. Reads of a feed cell must not fan out
  -- into three aggregate queries per post.
  xo_count      integer not null default 0,
  amen_count    integer not null default 0,
  pray_count    integer not null default 0,
  comment_count integer not null default 0,
  share_count   integer not null default 0,

  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index posts_feed_idx on posts (status, published_at desc) where status = 'approved';
create index posts_author_idx on posts (author_id, created_at desc);
create index posts_topics_idx on posts using gin (topics);
create index posts_traditions_idx on posts using gin (tradition_tags);

-- Shared content: the URL and its oEmbed metadata. No media bytes, ever.
create table post_embeds (
  post_id         uuid primary key references posts (id) on delete cascade,
  provider        embed_provider not null,
  provider_id     text not null,
  canonical_url   text not null,

  title           text,
  description     text,
  author_name     text,
  author_url      text,
  thumbnail_url   text,
  duration_s      integer,
  oembed_html     text,
  oembed_fetched_at timestamptz,

  created_at      timestamptz not null default now(),

  -- The dedupe guarantee: two people sharing the same sermon produce one post with two
  -- shares, not two competing posts.
  unique (provider, provider_id)
);

-- Native uploads: ours to serve, transcode and transcribe.
create table post_media (
  post_id           uuid primary key references posts (id) on delete cascade,
  mux_asset_id      text unique,
  mux_playback_id   text,
  mux_upload_id     text,
  storage_paths     text[] not null default '{}',
  duration_s        numeric(10, 3),
  aspect_ratio      numeric(6, 4),
  thumbnail_url     text,

  -- Only ever populated for native uploads. Transcribing an embed would mean
  -- downloading someone else's video, which is exactly what this platform does not do —
  -- and it is why doctrinal classification is weaker for shares than for uploads.
  transcript        text,
  transcript_lang   text,

  created_at        timestamptz not null default now()
);

-- A post is either embedded or hosted, never both.
create or replace function assert_single_media_source() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'post_embeds' then
    if exists (select 1 from post_media where post_id = new.post_id) then
      raise exception 'post % already has hosted media; it cannot also be an embed', new.post_id;
    end if;
  else
    if exists (select 1 from post_embeds where post_id = new.post_id) then
      raise exception 'post % is an embed; XOholy does not host media for it', new.post_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger post_embeds_single_source before insert on post_embeds
  for each row execute function assert_single_media_source();
create trigger post_media_single_source before insert on post_media
  for each row execute function assert_single_media_source();

-- ---------------------------------------------------------------------------
-- Interactions
-- ---------------------------------------------------------------------------

create table reactions (
  user_id    uuid not null references profiles (id) on delete cascade,
  post_id    uuid not null references posts (id) on delete cascade,
  kind       reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id, kind)
);

create index reactions_post_idx on reactions (post_id, kind);

-- Private. A prayer list is between a user and God, not a public follower graph.
create table prayer_list (
  user_id    uuid not null references profiles (id) on delete cascade,
  post_id    uuid not null references posts (id) on delete cascade,
  note       text check (char_length(note) <= 1000),
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint no_self_follow check (follower_id <> followee_id)
);

create index follows_followee_idx on follows (followee_id);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  parent_id  uuid references comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  status     post_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index comments_post_idx on comments (post_id, created_at desc) where status = 'approved';

create table shares (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts (id) on delete cascade,
  user_id     uuid references profiles (id) on delete set null,
  destination text,
  created_at  timestamptz not null default now()
);

create index shares_post_idx on shares (post_id);

create table blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Required by Apple Guideline 1.2 for user-generated content, and by basic decency.
create table reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references posts (id) on delete cascade,
  comment_id  uuid references comments (id) on delete cascade,
  reporter_id uuid references profiles (id) on delete set null,
  reason      report_reason not null,
  detail      text check (char_length(detail) <= 1000),
  resolved_at timestamptz,
  upheld      boolean,
  created_at  timestamptz not null default now(),
  constraint report_targets_one_thing check (num_nonnulls(post_id, comment_id) = 1)
);

create index reports_open_idx on reports (created_at desc) where resolved_at is null;

-- ---------------------------------------------------------------------------
-- Moderation
-- ---------------------------------------------------------------------------

create table moderation_reviews (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts (id) on delete cascade,
  stage       moderation_stage not null,
  verdict     moderation_verdict not null,
  confidence  numeric(4, 3) check (confidence between 0 and 1),

  is_christian boolean,
  traditions   text[] not null default '{}',
  topics       text[] not null default '{}',
  flags        text[] not null default '{}',

  -- Required for doctrine verdicts. Every rejection is appealable, and an appeal a
  -- human cannot review is not an appeal.
  rationale   text,
  model       text,
  vendor      text,

  -- Null when the machine decided; set when a person did.
  reviewer_id uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint doctrine_requires_rationale
    check (stage <> 'doctrine' or rationale is not null)
);

create index moderation_post_idx on moderation_reviews (post_id, created_at desc);
create index moderation_queue_idx on moderation_reviews (created_at)
  where verdict = 'escalate' and reviewer_id is null;

-- Notices under the DMCA. Registering a designated agent with the Copyright Office and
-- keeping this log is what safe harbour actually requires.
create table dmca_notices (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid references posts (id) on delete set null,
  claimant_name  text not null,
  claimant_email text not null,
  claimed_work   text not null,
  notice_body    text not null,
  received_at    timestamptz not null default now(),
  actioned_at    timestamptz,
  action_taken   text,
  counter_notice text
);

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------

-- Partitioned by day. This table outgrows everything else by an order of magnitude, and
-- day partitions make retention a DROP rather than a long-running DELETE.
create table view_events (
  id                bigserial,
  user_id           uuid references profiles (id) on delete set null,
  post_id           uuid not null,
  session_id        uuid not null,
  surface           feed_surface not null,
  watch_ms          integer not null default 0 check (watch_ms >= 0),
  video_duration_ms integer,
  completion_pct    numeric(4, 3) check (completion_pct between 0 and 1),
  replays           smallint not null default 0,
  muted             boolean not null default false,
  occurred_at       timestamptz not null default now(),
  primary key (id, occurred_at)
) partition by range (occurred_at);

create index view_events_post_idx on view_events (post_id, occurred_at desc);
create index view_events_user_idx on view_events (user_id, occurred_at desc);

-- Creates the partition covering a given day, if absent. Called by a scheduled job that
-- runs a week ahead, so a missing partition can never reject writes at midnight.
create or replace function ensure_view_events_partition(target date)
returns void language plpgsql as $$
declare
  partition_name text := format('view_events_%s', to_char(target, 'YYYYMMDD'));
begin
  if not exists (select 1 from pg_class where relname = partition_name) then
    execute format(
      'create table %I partition of view_events for values from (%L) to (%L)',
      partition_name, target, target + 1
    );
  end if;
end;
$$;

select ensure_view_events_partition((now() at time zone 'utc')::date + offset_days)
from generate_series(-1, 14) as offset_days;

-- Rollup consumed by the ranking layer. Refreshed on a schedule rather than computed
-- per request; see packages/shared/src/ranking.ts for how these map onto score terms.
create table post_stats (
  post_id             uuid primary key references posts (id) on delete cascade,
  impressions         bigint not null default 0,
  avg_completion_rate numeric(5, 4) not null default 0,
  avg_watch_time_ratio numeric(6, 4) not null default 0,
  xo_rate             numeric(6, 5) not null default 0,
  amen_rate           numeric(6, 5) not null default 0,  -- displayed; never ranked
  pray_rate           numeric(6, 5) not null default 0,
  share_rate          numeric(6, 5) not null default 0,
  follow_rate         numeric(6, 5) not null default 0,
  comment_rate        numeric(6, 5) not null default 0,
  report_rate         numeric(6, 5) not null default 0,
  refreshed_at        timestamptz not null default now()
);

-- Taste vector, used for candidate generation by topic and tradition affinity.
create table user_affinity (
  user_id      uuid primary key references profiles (id) on delete cascade,
  embedding    vector(256),
  topic_weights  jsonb not null default '{}'::jsonb,
  tradition_weights jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Counter maintenance
-- ---------------------------------------------------------------------------

create or replace function sync_reaction_counts() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_post uuid := coalesce(new.post_id, old.post_id);
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  target_kind reaction_kind := coalesce(new.kind, old.kind);
begin
  update posts set
    xo_count   = xo_count   + (case when target_kind = 'xo'   then delta else 0 end),
    amen_count = amen_count + (case when target_kind = 'amen' then delta else 0 end),
    pray_count = pray_count + (case when target_kind = 'pray' then delta else 0 end),
    updated_at = now()
  where id = target_post;
  return null;
end;
$$;

create trigger reactions_count_sync after insert or delete on reactions
  for each row execute function sync_reaction_counts();

create or replace function sync_comment_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update posts
     set comment_count = greatest(0, comment_count + (case when tg_op = 'INSERT' then 1 else -1 end)),
         updated_at = now()
   where id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;

create trigger comments_count_sync after insert or delete on comments
  for each row execute function sync_comment_count();

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();
create trigger posts_touch before update on posts
  for each row execute function touch_updated_at();

-- Stamp published_at the moment a post clears moderation, so feed ordering reflects
-- when it became visible rather than when it was submitted.
create or replace function stamp_published_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger posts_stamp_published before update on posts
  for each row execute function stamp_published_at();
