-- Cocoa & Credits: database setup
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.
-- After it finishes, do the same with catalog_seed.sql.

-- 1. The movie catalog: every Hallmark Christmas movie the search can find
create table if not exists catalog (
  id       text primary key,
  title    text not null,
  year     int,
  network  text default 'Hallmark',
  stars    text default '',
  premise  text default ''
);

-- 2. The movies your group has watched and logged
create table if not exists movies (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  text references catalog(id) on delete set null,
  title       text not null,
  year        int,
  network     text default '',
  stars       text default '',
  notes       text default '',
  tropes      text[] default '{}',
  added_by    text default '',
  created_at  timestamptz default now()
);
create unique index if not exists movies_title_year_key on movies (lower(title), coalesce(year, 0));

-- 3. Everyone's own rating for each logged movie
create table if not exists ratings (
  movie_id     uuid not null references movies(id) on delete cascade,
  person       text not null,          -- lower-case name, used to match the same person
  person_name  text not null,          -- name as they typed it
  rating       int not null default 0 check (rating between 0 and 5),
  watched      date,
  updated_at   timestamptz default now(),
  primary key (movie_id, person)
);

-- Anyone with the link can read and add. (The catalog itself is read-only from the site;
-- add or fix catalog rows in Supabase's Table Editor.)
alter table catalog enable row level security;
alter table movies  enable row level security;
alter table ratings enable row level security;

drop policy if exists "Anyone can read the catalog" on catalog;
create policy "Anyone can read the catalog" on catalog for select using (true);

drop policy if exists "Anyone can use the movie list" on movies;
create policy "Anyone can use the movie list" on movies for all using (true) with check (true);

drop policy if exists "Anyone can rate" on ratings;
create policy "Anyone can rate" on ratings for all using (true) with check (true);

grant select on catalog to anon;
grant select, insert, update, delete on movies, ratings to anon;
