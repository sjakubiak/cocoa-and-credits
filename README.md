# Cocoa & Credits

A shared website for logging and rating Hallmark Christmas movies. Anyone with the link can search the catalog, add movies, and rate them. No accounts needed: each person types their name once and their browser remembers it.

Live at **https://cocoa-and-credits.pages.dev**, hosted free on Cloudflare Pages with a Cloudflare D1 database.

## What's in the repo

- `site/` is the website (plain HTML, nothing to build). `site/catalog.json` is the catalog of 486 Hallmark Christmas movies from 2000–2026 that the search uses.
- `functions/api/[[path]].js` is the small API the page calls to read and save the shared list. Cloudflare Pages runs it automatically.
- `d1/schema.sql` creates the two database tables, `movies` and `ratings`.

## How it's set up on Cloudflare

- **Pages project:** `cocoa-and-credits`, connected to this GitHub repo. Build command is empty, and the build output directory is `site`. Every push to `main` deploys automatically.
- **Database:** a D1 database named `cocoa-and-credits`, bound to the Pages project as `DB` (Settings → Bindings).
- To recreate the tables, paste `d1/schema.sql` into the database's **Console** tab in the Cloudflare dashboard.

The free plans cover this easily, and D1 doesn't pause when the site goes unused.

## Good to know

- **Anyone with the link can add, edit or remove movies.** Removing asks for a second tap first.
- **To fix or add a catalog movie,** edit `site/catalog.json` and push. The `premise` field is what lets plot searches work.
- **To see or edit the raw data,** open the D1 database in the Cloudflare dashboard and use **Explore Data** or the **Console** tab.

## How the search works

No AI is involved. Search scores every catalog movie against the words you type. Titles and actor names count most, then plot summaries. It forgives typos ("Merry Memeories"), matches the start of words, and knows that related words go together: "teacher" with "school", "prince" with "royal", "baker" with "cookie", "Bears" with "football". The code is in `site/search.js`.

The catalog came from Wikipedia's lists of Hallmark Channel original movies and from published Hallmark holiday schedules. It has plot summaries for 2016–2019 and the 2026 season. Older movies can be found by title or actor.
