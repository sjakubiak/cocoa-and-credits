# Cocoa & Credits

A shared website for logging and rating Hallmark Christmas movies. Anyone with the link can search the catalog, add movies, and rate them. No accounts needed: each person types their name once and their browser remembers it.

- `site/` is the website (plain HTML, nothing to build).
- `supabase/` has the database setup: `schema.sql` creates the tables, `catalog_seed.sql` loads the movie catalog (486 Hallmark Christmas movies, 2000–2026).

Setup takes about 15 minutes, all on free plans.

## 1. Create the database (Supabase)

1. Sign up at supabase.com and create a new project (any name, pick a region near you, save the database password somewhere).
2. When it's ready, open **SQL Editor** → **New query**. Paste all of `supabase/schema.sql` and click **Run**.
3. New query again. Paste all of `supabase/catalog_seed.sql` and click **Run**.
4. Open **Project Settings → API** (or the **Connect** button). Copy the **Project URL** and the **anon public** key.
5. Open `site/config.js` and paste them in place of `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY`.

The anon key is meant to be public. It only allows what the database rules allow: reading the catalog, and adding, rating and removing movies on the list.

## 2. Put the site online (Render)

1. Create a new GitHub repository (for example `cocoa-and-credits`) and upload this whole folder to it.
2. In Render, choose **New → Static Site** and pick that repository.
3. Settings:
   - **Build Command:** leave empty
   - **Publish Directory:** `site`
4. Click **Create Static Site**. Render gives you a link like `cocoa-and-credits.onrender.com`. Share that link.

Render static sites stay online on the free plan and don't go to sleep.

## Good to know

- **Free Supabase projects pause after a week with no visits.** If that happens, sign in to Supabase and click **Restore project**. Your data is kept.
- **Anyone with the link can edit or remove movies.** Removing asks for a second tap first.
- **The catalog lives in the `catalog` table.** To add a movie or fix a detail, use Supabase's **Table Editor**. Changes show up in search the next time the page loads. The `premise` column is what lets plot searches work, so fill it in for movies you care about.
- **Without the Supabase keys,** the site still works but saves only in that one browser. This is handy for trying it out.

## How the search works

No AI is involved. Search scores every catalog movie against the words you type. Titles and actor names count most, then plot summaries. It forgives typos ("Merry Memeories"), matches the start of words, and knows that related words go together: "teacher" with "school", "prince" with "royal", "baker" with "cookie", "Bears" with "football". The code is in `site/search.js`.

The catalog came from Wikipedia's lists of Hallmark Channel original movies and from published Hallmark holiday schedules. It has plot summaries for 2016–2019 and the 2026 season. Older movies can be found by title or actor.
