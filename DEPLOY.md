# Deploying Lifebook

Lifebook builds to a directory of static files. There is no server of ours in
the path at any point — the app runs in the browser, keeps everything in
IndexedDB, and talks to exactly one other origin (your Supabase project) and
only if you configured accounts. So "hosting it" means "serving a folder".

```
npm ci
npm run verify     # tests, build, prohibitions audit
```

Output lands in `dist/`.

## Cloudflare Pages

The best fit, and the one this repo is set up for.

**Project settings**

| Setting | Value |
| --- | --- |
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 or later (`NODE_VERSION` build variable) |

That is the whole configuration. Three things that usually need attention on a
single-page app do not need it here:

- **No SPA rewrite rule.** The app uses hash routing (`/#/life`), so every URL
  a browser ever requests is `/`. There is no `_redirects` file and none is
  needed. If you ever switch to browser routing you will need
  `/*  /index.html  200`.
- **No build-time secrets.** See below.
- **Headers** are already declared in `public/_headers`, which Vite copies into
  `dist/` verbatim. Read that file before your first deploy: it explains why
  the Content-Security-Policy line is left commented out and which of the two
  versions is correct for your deployment.

**Environment variables** (Settings → Environment variables, *Production* and
*Preview* separately)

| Variable | When |
| --- | --- |
| `VITE_SUPABASE_URL` | only if you want accounts |
| `VITE_SUPABASE_ANON_KEY` | only if you want accounts |
| `VITE_ENABLE_GOOGLE` | `false` to hide Google sign-in |

Set none of them and the app runs entirely local — no sign-in screen, nothing
synced, which is a legitimate way to ship it.

Anything prefixed `VITE_` is **compiled into the bundle and is public**. The
anon key is designed for that: every table it can reach is behind row-level
security with no cross-row policy (`supabase/migrations/0001_init.sql`). The
`service_role` key is not designed for that and must never appear in a
Cloudflare variable, this repository, or any file that reaches a browser.

**After deploying with accounts**, add the Pages URL to your Supabase project
under Authentication → URL Configuration → Redirect URLs, or the email link and
the Google round-trip will bounce.

**The service worker.** Updates are prompted, not silent, so a returning person
keeps the bundle they are mid-sentence in until they accept the new one. The
`_headers` file keeps `/sw.js` uncached at the edge so that prompt can actually
arrive.

## Anywhere else

Netlify, Vercel, GitHub Pages, S3, a directory behind nginx — all fine, same
build, same two rules: serve `dist/`, and if the host ignores `_headers`,
reproduce those headers in its own configuration. For a subpath deployment
(`example.com/lifebook/`) set `base: '/lifebook/'` in `vite.config.ts`; the PWA
manifest already uses relative `start_url` and `scope`.

## What is not on the deploy path

- No analytics, no error-reporting service, no tag manager. The content is
  people's beliefs about themselves; none of it goes to a third party. The
  `ErrorBoundary` logs to the console and nowhere else.
- No fonts from a CDN — all three families are bundled from `@fontsource`, so
  the app makes no font request to Google.
- No payment code. `PURCHASE_URL` is a link out.
