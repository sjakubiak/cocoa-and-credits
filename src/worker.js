// Cocoa & Credits as a Cloudflare Worker: /api/* goes to the D1-backed API,
// everything else is served from the static site in ./site.
import { onRequest } from "../functions/api/[[path]].js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const path = url.pathname.slice(4).split("/").filter(Boolean);
      return onRequest({ request, env, params: { path } });
    }
    return env.ASSETS.fetch(request);
  },
};
