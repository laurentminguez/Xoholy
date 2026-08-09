-- Row-level security.
--
-- The premise of XOholy is that everything in the feed has been reviewed. That promise
-- cannot rest on every feed query remembering to filter — one forgotten predicate in
-- one code path would expose unreviewed content. So the database enforces it: an
-- ordinary client simply cannot select a post that is not 'approved'.
--
-- Moderation tables, raw analytics and DMCA records are service-role only. They are not
-- protected by a restrictive policy; they have *no* client policy at all, which with RLS
-- enabled means no anon or authenticated role can reach them under any circumstances.

alter table profiles            enable row level security;
alter table posts               enable row level security;
alter table post_embeds         enable row level security;
alter table post_media          enable row level security;
alter table reactions           enable row level security;
alter table prayer_list         enable row level security;
alter table follows             enable row level security;
alter table comments            enable row level security;
alter table shares              enable row level security;
alter table blocks              enable row level security;
alter table reports             enable row level security;
alter table moderation_reviews  enable row level security;
alter table dmca_notices        enable row level security;
alter table view_events         enable row level security;
alter table post_stats          enable row level security;
alter table user_affinity       enable row level security;

-- Blocking must work in both directions: a blocked user should not see the blocker's
-- content either, or blocking becomes a one-way mute that the blocked party can trivially
-- work around.
create or replace function is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
     where (blocker_id = a and blocked_id = b)
        or (blocker_id = b and blocked_id = a)
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create policy profiles_public_read on profiles
  for select using (
    id = auth.uid() or not is_blocked_between(auth.uid(), id)
  );

create policy profiles_insert_own on profiles
  for insert with check (id = auth.uid());

create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Posts
--
-- The core guarantee. A client sees a post only if it is approved and not from someone
-- they have blocked, or if it is their own.
-- ---------------------------------------------------------------------------

create policy posts_read_approved on posts
  for select using (
    author_id = auth.uid()
    or (status = 'approved' and not is_blocked_between(auth.uid(), author_id))
  );

-- Users submit posts; they do not publish them. The status column is deliberately not
-- settable to anything but 'pending' from a client — only the moderation pipeline,
-- running as service role, moves a post to 'approved'.
create policy posts_insert_own on posts
  for insert with check (author_id = auth.uid() and status = 'pending');

-- Authors may edit their own post, but RLS alone cannot express "you may change the
-- caption but not the status" — a WITH CHECK clause sees only the new row, so it cannot
-- compare against the old one. Column-level privileges express it exactly, and a trigger
-- catches anything that slips past (a future policy change, a mis-scoped grant).
create policy posts_update_own on posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy posts_delete_own on posts
  for delete using (author_id = auth.uid());

revoke update on posts from authenticated;
grant update (caption, topics, tradition_tags) on posts to authenticated;

create or replace function reject_client_status_change() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status
     and current_setting('role', true) is distinct from 'service_role'
     and current_user <> 'postgres' then
    raise exception 'post status is set by the moderation pipeline, not by clients';
  end if;
  return new;
end;
$$;

create trigger posts_guard_status before update on posts
  for each row execute function reject_client_status_change();

-- Media rows inherit their parent's visibility exactly.
create policy post_embeds_follow_post on post_embeds
  for select using (exists (select 1 from posts p where p.id = post_embeds.post_id));

create policy post_media_follow_post on post_media
  for select using (exists (select 1 from posts p where p.id = post_media.post_id));

-- ---------------------------------------------------------------------------
-- Interactions
-- ---------------------------------------------------------------------------

-- Aggregate counts live on `posts`; individual reaction rows are only ever needed to
-- render the viewer's own state ("have I already XO'd this?").
create policy reactions_read_own on reactions
  for select using (user_id = auth.uid());

create policy reactions_write_own on reactions
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from posts p where p.id = post_id and p.status = 'approved')
  );

create policy reactions_delete_own on reactions
  for delete using (user_id = auth.uid());

-- A prayer list is between a user and God. Owner-only, with no exception for anyone.
create policy prayer_list_owner_only on prayer_list
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy follows_read on follows
  for select using (true);

create policy follows_write_own on follows
  for insert with check (
    follower_id = auth.uid() and not is_blocked_between(auth.uid(), followee_id)
  );

create policy follows_delete_own on follows
  for delete using (follower_id = auth.uid());

create policy comments_read_approved on comments
  for select using (
    author_id = auth.uid()
    or (status = 'approved' and not is_blocked_between(auth.uid(), author_id))
  );

create policy comments_insert_own on comments
  for insert with check (
    author_id = auth.uid()
    and status = 'pending'
    and exists (select 1 from posts p where p.id = post_id and p.status = 'approved')
  );

create policy comments_delete_own on comments
  for delete using (author_id = auth.uid());

create policy shares_insert_own on shares
  for insert with check (user_id = auth.uid() or user_id is null);

create policy blocks_owner_only on blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Reporting is write-only for users. Letting a reporter read the report queue would
-- expose what everyone else has flagged, which invites brigading.
create policy reports_insert_own on reports
  for insert with check (reporter_id = auth.uid() or reporter_id is null);

create policy reports_read_own on reports
  for select using (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------

-- Clients write view events through an edge function (which batches and validates them)
-- and never read them. Watch history is among the most sensitive data the platform
-- holds; no client policy grants select.
create policy view_events_insert_own on view_events
  for insert with check (user_id = auth.uid() or user_id is null);

-- Aggregates are safe to read — they are already published as counts in the UI.
create policy post_stats_read on post_stats
  for select using (
    exists (select 1 from posts p where p.id = post_stats.post_id and p.status = 'approved')
  );

create policy user_affinity_owner_only on user_affinity
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Service-role only
--
-- moderation_reviews and dmca_notices intentionally have no policies. With RLS enabled
-- and no policy present, every client role is denied; only the service role (which
-- bypasses RLS) can reach them.
-- ---------------------------------------------------------------------------
