/* Cocoa & Credits — catalog search with no AI.
   Scores each movie against the words you type: titles and actor names count most,
   plot words next. Forgives typos, matches the start of words, and knows that
   "teacher" relates to "school", "prince" to "royal", and so on. */
(function (root) {
  const STOP = new Set("a an and are as at be but by for from has he her his i in is it its me my of on or our she so that the their them there they this to was we were what when where who with you your about just like some saw watched watching seen think thing guy girl woman man lady she's he's it's movie movies film hallmark".split(" "));
  const WEAK = new Set("christmas xmas holiday holidays noel merry season".split(" "));
  const GROUPS = [
    "teacher teachers school schools class classroom student students principal superintendent substitute choir",
    "royal royals king queen prince princess palace castle crown duke duchess kingdom majesty",
    "baker bakery bake baking cookie cookies gingerbread cake cakes pastry pie pies candy sweet sweetest sugar",
    "dog dogs puppy puppies corgi k9 howlidays barking pup",
    "cat cats kitten kittens catnip",
    "santa claus kringle nick nicholas elf elves reindeer sleigh northpole",
    "tree trees farm fir evergreen pine",
    "inn innkeeper lodge hotel resort cottage manor suite",
    "snow snowed snowbound snowstorm blizzard stranded storm snowflake",
    "time timeless travel loop past future 1895 wwii",
    "angel angels heaven heavenly guardian miracle miracles",
    "hanukkah chanukah menorah jewish oy",
    "football nfl chiefs bills bears touchdown playbook coach quarterback",
    "music musician musical singer singing song songs choir concert band duet carol rock country opry nashville piano",
    "doctor nurse hospital clinic vet veterinarian medical",
    "military soldier soldiers veteran veterans army navy marine deployed overseas uss sailor captain",
    "ex exes sweetheart sweethearts flame reunion reunite reunited reunites",
    "fake pretend pretending pose posing boyfriend girlfriend fiance fiancee setup setups matchmaker matchmaking",
    "twin twins swap swapped switched sister sisters",
    "widow widower widowed",
    "nephew niece kid kids daughter daughters son sons child children boy",
    "writer author novelist book books bookstore bookshop library journalist reporter letter letters",
    "wedding weddings bride bridesmaid married marry engaged engagement proposal veil",
    "chef restaurant cook cooking food feast dinner bar cafe",
    "ski skiing skate skating ice sculpture sculpting hockey",
    "tv television show host producer broadcast morning",
    "ornament ornaments decorations decorate decorating lights",
    "scrapbook photo photos photographer pictures memories",
    "ranch cowboy rancher horse texas montana",
    "dance dancing dancer ballet waltz nutcracker",
    "toy toys toyland workshop gift gifts present presents",
    "scotland scottish", "ireland irish", "england english london british", "italy italian rome", "vienna austria austrian", "denmark danish", "norway norwegian", "finland finnish", "wales welsh", "germany german heidelberg", "paris france french"
  ];
  const syn = new Map();
  GROUPS.forEach((g, i) => g.split(" ").forEach(w => { if (!syn.has(w)) syn.set(w, new Set()); syn.get(w).add(i); }));

  function norm(s) {
    return String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function stem(w) { // light plural/possessive trimming
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  }
  function tokens(s) { return norm(s).split(" ").filter(Boolean); }

  function editDist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        rowMin = Math.min(rowMin, cur[j]);
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function shareGroup(a, b) {
    const ga = syn.get(a) || syn.get(stem(a)), gb = syn.get(b) || syn.get(stem(b));
    if (!ga || !gb) return false;
    for (const g of ga) if (gb.has(g)) return true;
    return false;
  }

  // How well one query word matches one field word (0..1)
  function wordMatch(q, w) {
    if (q === w) return 1;
    const qs = stem(q), ws = stem(w);
    if (qs === ws) return 0.95;
    if (q.length >= 3 && w.startsWith(q)) return 0.85;
    if (q.length >= 4) {
      const max = q.length >= 8 ? 2 : 1;
      if (editDist(qs, ws, max) <= max) return 0.7;
    }
    if (shareGroup(q, w)) return 0.42;
    return 0;
  }

  function prepare(catalog) {
    return catalog.map(m => ({
      m,
      title: [...new Set(tokens(m.title))],
      stars: [...new Set(tokens(m.stars))],
      plot: [...new Set(tokens(m.premise).filter(w => !STOP.has(w)))],
      year: String(m.year || ""),
      normTitle: norm(m.title)
    }));
  }

  function bestIn(q, words) {
    let best = 0;
    for (const w of words) { const s = wordMatch(q, w); if (s > best) { best = s; if (s === 1) break; } }
    return best;
  }

  function search(prepared, query, limit) {
    limit = limit || 8;
    const raw = tokens(query);
    if (!raw.length) return [];
    const words = raw.filter(w => !STOP.has(w));
    const qWords = words.length ? words : raw;
    const nq = norm(query);
    const results = [];
    for (const p of prepared) {
      let score = 0, matched = 0, strong = 0;
      for (const q of qWords) {
        const weight = WEAK.has(q) ? 0.15 : 1;
        if (/^(19|20)\d\d$/.test(q)) { if (q === p.year) { score += 2.5; matched++; strong++; } continue; }
        const t = bestIn(q, p.title) * 3, s = bestIn(q, p.stars) * 2.6, pl = bestIn(q, p.plot) * 1.3;
        const best = Math.max(t, s, pl);
        if (best > 0) { score += best * weight; if (weight === 1) { matched++; if (best >= 1.8) strong++; } }
      }
      if (!score) continue;
      if (nq.length >= 4 && p.normTitle.includes(nq)) score += 6;
      else if (nq.length >= 4 && nq.includes(p.normTitle) && p.normTitle.length >= 6) score += 4;
      const meaningful = qWords.filter(q => !WEAK.has(q)).length || 1;
      const coverage = matched / meaningful;
      score *= 0.35 + 0.65 * coverage;
      if (strong === 0 && coverage < 0.5) continue;
      results.push({ movie: p.m, score: Math.round(score * 100) / 100 });
    }
    results.sort((a, b) => b.score - a.score || (b.movie.year || 0) - (a.movie.year || 0));
    return results.slice(0, limit);
  }

  const api = { prepare, search, norm };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CatalogSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
