// Cocoa & Credits API (Cloudflare Pages Functions + D1).
// The D1 database is bound to the Pages project as "DB".
//
// GET    /api/health          -> { ok: true }
// GET    /api/data            -> { movies, ratings }
// POST   /api/movies          -> add a movie, returns the new row (409 if the title+year is already on the list)
// PATCH  /api/movies/:id      -> update a movie's shared details
// DELETE /api/movies/:id      -> remove a movie and its ratings
// PUT    /api/ratings         -> add or update one person's rating

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const fail = (status, error) => json({ error }, status);

const str = (v, max) => (v == null ? "" : String(v).trim().slice(0, max));
const yearOf = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null;
};
const tropesOf = (v) =>
  JSON.stringify(Array.isArray(v) ? v.slice(0, 50).map((t) => str(t, 80)).filter(Boolean) : []);
const dateOf = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function movieOut(r) {
  let tropes = [];
  try { tropes = JSON.parse(r.tropes || "[]"); } catch {}
  return { ...r, tropes };
}

async function readBody(request) {
  try {
    const text = await request.text();
    if (text.length > 20000) return null;
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return fail(503, "Database not connected");

  const parts = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
  const [resource, id] = parts;
  const method = request.method;

  try {
    if (resource === "health" && method === "GET") return json({ ok: true });

    if (resource === "data" && method === "GET") {
      const [m, r] = await db.batch([
        db.prepare("SELECT * FROM movies ORDER BY created_at DESC LIMIT 5000"),
        db.prepare("SELECT * FROM ratings LIMIT 20000"),
      ]);
      return json({ movies: m.results.map(movieOut), ratings: r.results });
    }

    if (resource === "movies" && !id && method === "POST") {
      const b = await readBody(request);
      if (!b) return fail(400, "Invalid request");
      const title = str(b.title, 200);
      if (!title) return fail(400, "Title is required");
      const year = yearOf(b.year);
      const dup = await db
        .prepare("SELECT id FROM movies WHERE lower(title) = lower(?1) AND coalesce(year, 0) = ?2")
        .bind(title, year || 0)
        .first();
      if (dup) return fail(409, "Already on the list");
      const row = {
        id: crypto.randomUUID(),
        catalog_id: str(b.catalog_id, 200) || null,
        title,
        year,
        network: str(b.network, 60),
        stars: str(b.stars, 300),
        notes: str(b.notes, 2000),
        tropes: tropesOf(b.tropes),
        added_by: str(b.added_by, 60),
        created_at: new Date().toISOString(),
      };
      await db
        .prepare(
          "INSERT INTO movies (id, catalog_id, title, year, network, stars, notes, tropes, added_by, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)"
        )
        .bind(row.id, row.catalog_id, row.title, row.year, row.network, row.stars, row.notes, row.tropes, row.added_by, row.created_at)
        .run();
      return json(movieOut(row), 201);
    }

    if (resource === "movies" && id && method === "PATCH") {
      const b = await readBody(request);
      if (!b) return fail(400, "Invalid request");
      const title = str(b.title, 200);
      if (!title) return fail(400, "Title is required");
      const res = await db
        .prepare("UPDATE movies SET title=?2, year=?3, network=?4, stars=?5, notes=?6, tropes=?7 WHERE id=?1")
        .bind(id, title, yearOf(b.year), str(b.network, 60), str(b.stars, 300), str(b.notes, 2000), tropesOf(b.tropes))
        .run();
      if (!res.meta.changes) return fail(404, "Movie not found");
      return json({ ok: true });
    }

    if (resource === "movies" && id && method === "DELETE") {
      await db.batch([
        db.prepare("DELETE FROM ratings WHERE movie_id=?1").bind(id),
        db.prepare("DELETE FROM movies WHERE id=?1").bind(id),
      ]);
      return json({ ok: true });
    }

    if (resource === "ratings" && method === "PUT") {
      const b = await readBody(request);
      if (!b) return fail(400, "Invalid request");
      const movieId = str(b.movie_id, 100);
      const personName = str(b.person_name, 60);
      const person = personName.toLowerCase();
      const rating = Number(b.rating);
      if (!movieId || !person) return fail(400, "Movie and name are required");
      if (!Number.isInteger(rating) || rating < 0 || rating > 5) return fail(400, "Rating must be 0 to 5");
      const exists = await db.prepare("SELECT 1 FROM movies WHERE id=?1").bind(movieId).first();
      if (!exists) return fail(404, "Movie not found");
      await db
        .prepare(
          "INSERT INTO ratings (movie_id, person, person_name, rating, watched, updated_at) VALUES (?1,?2,?3,?4,?5,?6) " +
            "ON CONFLICT (movie_id, person) DO UPDATE SET person_name=excluded.person_name, rating=excluded.rating, watched=excluded.watched, updated_at=excluded.updated_at"
        )
        .bind(movieId, person, personName, rating, dateOf(b.watched), new Date().toISOString())
        .run();
      return json({ ok: true });
    }

    return fail(404, "Not found");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong");
  }
}
