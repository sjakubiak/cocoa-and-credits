-- Cocoa & Credits: Cloudflare D1 schema.
-- The movie catalog is the static file site/catalog.json, so only the shared list lives here.

CREATE TABLE IF NOT EXISTS movies (
  id          TEXT PRIMARY KEY,
  catalog_id  TEXT,
  title       TEXT NOT NULL,
  year        INTEGER,
  network     TEXT DEFAULT '',
  stars       TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  tropes      TEXT DEFAULT '[]',
  added_by    TEXT DEFAULT '',
  created_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS movies_title_year ON movies (lower(title), coalesce(year, 0));

CREATE TABLE IF NOT EXISTS ratings (
  movie_id     TEXT NOT NULL,
  person       TEXT NOT NULL,
  person_name  TEXT NOT NULL,
  rating       INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  watched      TEXT,
  updated_at   TEXT,
  PRIMARY KEY (movie_id, person)
);
