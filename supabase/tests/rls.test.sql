-- Security tests for the XOholy schema.
--
-- The platform's core promise is that everything in a feed has been reviewed. These
-- assertions prove the database enforces that on its own, so no application bug can
-- leak unreviewed content. Each block raises on failure, so a non-zero psql exit means
-- a real regression.

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Fixtures (created as superuser, which bypasses RLS)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'mallory@example.com');

insert into profiles (id, handle, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'alice', 'Alice'),
  ('22222222-2222-2222-2222-222222222222', 'bob', 'Bob'),
  ('33333333-3333-3333-3333-333333333333', 'mallory', 'Mallory');

insert into posts (id, author_id, kind, caption, status, published_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'embed', 'An approved sermon clip', 'approved', now()),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'embed', 'Still awaiting moderation', 'pending', null),
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',
   'embed', 'Rejected content', 'rejected', null);

insert into moderation_reviews (post_id, stage, verdict, rationale, model)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'doctrine', 'approve',
        'Expository teaching from Romans; clearly within the Content Standards.', 'test');

insert into prayer_list (user_id, post_id, note)
values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Praying about a job decision');

-- ---------------------------------------------------------------------------
-- The central guarantee: unreviewed content is unreachable
-- ---------------------------------------------------------------------------

do $$
declare visible int;
begin
  perform test_become_anon();
  select count(*) into visible from posts;
  if visible <> 1 then
    raise exception 'anon should see exactly the 1 approved post, saw %', visible;
  end if;
  reset role;
end $$;

do $$
declare visible int;
begin
  -- Alice is a signed-in stranger: she may see Bob's approved post and nothing else.
  perform test_become('11111111-1111-1111-1111-111111111111');
  select count(*) into visible from posts where status = 'pending';
  if visible <> 0 then
    raise exception 'a signed-in user must not see pending posts, saw %', visible;
  end if;

  select count(*) into visible from posts where status = 'rejected';
  if visible <> 0 then
    raise exception 'a signed-in user must not see rejected posts, saw %', visible;
  end if;
  reset role;
end $$;

do $$
declare visible int;
begin
  -- ...but an author always sees their own work, whatever its status.
  perform test_become('22222222-2222-2222-2222-222222222222');
  select count(*) into visible from posts where author_id = '22222222-2222-2222-2222-222222222222';
  if visible <> 2 then
    raise exception 'Bob should see both of his own posts, saw %', visible;
  end if;
  reset role;
end $$;

-- ---------------------------------------------------------------------------
-- Clients submit posts; they do not publish them
-- ---------------------------------------------------------------------------

-- NOTE ON STYLE: these blocks record success in a flag and raise *after* the inner
-- BEGIN...EXCEPTION has ended, rather than raising inside it. Raising inside would be
-- caught by the block's own handler — the assertion would swallow its own failure and
-- could never fail. Mutation testing caught exactly that; do not "simplify" this back.

do $$
declare escalated boolean := false;
begin
  perform test_become('11111111-1111-1111-1111-111111111111');
  begin
    insert into posts (author_id, kind, caption, status)
    values ('11111111-1111-1111-1111-111111111111', 'text', 'Self-approved', 'approved');
    escalated := true;
  exception
    when others then null;  -- expected: RLS WITH CHECK rejected it
  end;
  reset role;

  if escalated then
    raise exception 'a client must not be able to insert an already-approved post';
  end if;
end $$;

do $$
declare escalated boolean := false;
begin
  perform test_become('22222222-2222-2222-2222-222222222222');
  begin
    update posts set status = 'approved'
     where id = 'aaaaaaaa-0000-0000-0000-000000000002';
    escalated := true;
  exception
    when others then null;  -- expected: blocked by column grant or by the guard trigger
  end;
  reset role;

  if escalated then
    raise exception 'a client must not be able to promote their own post to approved';
  end if;
end $$;

do $$
declare current_caption text;
begin
  -- The author can still edit what they are allowed to edit.
  perform test_become('22222222-2222-2222-2222-222222222222');
  update posts set caption = 'An edited caption'
   where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  select caption into current_caption from posts
   where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  if current_caption <> 'An edited caption' then
    raise exception 'author should be able to edit their own caption';
  end if;
  reset role;
end $$;

-- ---------------------------------------------------------------------------
-- Private data stays private
-- ---------------------------------------------------------------------------

do $$
declare visible int;
begin
  -- A prayer list is between a user and God.
  perform test_become('11111111-1111-1111-1111-111111111111');
  select count(*) into visible from prayer_list;
  if visible <> 0 then
    raise exception 'Alice must not see Bob''s prayer list, saw % rows', visible;
  end if;
  reset role;

  perform test_become('22222222-2222-2222-2222-222222222222');
  select count(*) into visible from prayer_list;
  if visible <> 1 then
    raise exception 'Bob should see his own prayer list, saw % rows', visible;
  end if;
  reset role;
end $$;

do $$
begin
  -- Moderation records have no client policy at all, so every client role is denied.
  perform test_become('11111111-1111-1111-1111-111111111111');
  begin
    perform count(*) from moderation_reviews;
    if (select count(*) from moderation_reviews) > 0 then
      raise exception 'moderation_reviews must be unreachable from a client';
    end if;
  exception
    when insufficient_privilege then null;
  end;
  reset role;
end $$;

do $$
declare visible int;
begin
  -- Watch history is the most sensitive data here; no client may read it.
  perform test_become('11111111-1111-1111-1111-111111111111');
  begin
    select count(*) into visible from view_events;
    if visible > 0 then
      raise exception 'view_events must not be readable by a client';
    end if;
  exception
    when insufficient_privilege then null;
  end;
  reset role;
end $$;

-- ---------------------------------------------------------------------------
-- Blocking cuts both ways
-- ---------------------------------------------------------------------------

do $$
declare visible int;
begin
  perform test_become('11111111-1111-1111-1111-111111111111');
  insert into blocks (blocker_id, blocked_id)
  values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

  select count(*) into visible from posts where author_id = '22222222-2222-2222-2222-222222222222';
  if visible <> 0 then
    raise exception 'Alice blocked Bob, so Bob''s posts must be hidden from her; saw %', visible;
  end if;
  reset role;

  -- ...and Bob loses sight of Alice too, or blocking is a one-way mute he can evade.
  perform test_become('22222222-2222-2222-2222-222222222222');
  select count(*) into visible from profiles where id = '11111111-1111-1111-1111-111111111111';
  if visible <> 0 then
    raise exception 'blocking must be symmetric; Bob can still see Alice''s profile';
  end if;
  reset role;
end $$;

-- ---------------------------------------------------------------------------
-- XOholy never hosts media it did not create
-- ---------------------------------------------------------------------------

do $$
declare double_stored boolean := false;
begin
  insert into post_embeds (post_id, provider, provider_id, canonical_url)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'youtube', 'dQw4w9WgXcQ',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  begin
    insert into post_media (post_id, mux_asset_id)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'asset_123');
    double_stored := true;
  exception
    when others then null;
  end;

  if double_stored then
    raise exception 'a shared embed must never also carry hosted media';
  end if;
end $$;

do $$
declare duplicated boolean := false;
begin
  -- The dedupe guarantee: the same video shared twice is one post, not two.
  begin
    insert into posts (id, author_id, kind, status)
    values ('aaaaaaaa-0000-0000-0000-000000000009',
            '11111111-1111-1111-1111-111111111111', 'embed', 'pending');
    insert into post_embeds (post_id, provider, provider_id, canonical_url)
    values ('aaaaaaaa-0000-0000-0000-000000000009', 'youtube', 'dQw4w9WgXcQ',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    duplicated := true;
  exception
    when others then null;
  end;

  if duplicated then
    raise exception 'the same provider video must not produce two posts';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Counters
-- ---------------------------------------------------------------------------

do $$
declare xo int; amen int; pray int;
begin
  insert into reactions (user_id, post_id, kind) values
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'xo'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'xo'),
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'amen'),
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'pray');

  select xo_count, amen_count, pray_count into xo, amen, pray
    from posts where id = 'aaaaaaaa-0000-0000-0000-000000000001';

  if xo <> 2 or amen <> 1 or pray <> 1 then
    raise exception 'reaction counters wrong: xo=% amen=% pray=%', xo, amen, pray;
  end if;

  delete from reactions
   where user_id = '11111111-1111-1111-1111-111111111111'
     and post_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and kind = 'xo';

  select xo_count into xo from posts where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  if xo <> 1 then
    raise exception 'un-XO should decrement the counter, got %', xo;
  end if;
end $$;

do $$
declare stamped timestamptz;
begin
  -- published_at reflects when a post became visible, not when it was submitted.
  update posts set status = 'approved' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
  select published_at into stamped from posts where id = 'aaaaaaaa-0000-0000-0000-000000000002';
  if stamped is null then
    raise exception 'published_at should be stamped when a post is approved';
  end if;
end $$;

rollback;

\echo 'RLS and schema assertions passed.'
