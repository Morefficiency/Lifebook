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

The best fit, and the one this repo is configured for. Two files carry the
configuration so you do not have to type it into a dashboard:

- `wrangler.toml` — the project name and `pages_build_output_dir = "dist"`.
  **`name` must equal your Pages project name**, or the build stops and says so.
- `.node-version` — pins Node 22 for the build.

### Before you connect anything: which branch?

Pages builds one branch as *production* and every other branch as a *preview*.
Check what is actually on the branch you are about to point it at:

```bash
git log --oneline -1 origin/main
```

If the app lives on a working branch rather than on `main`, you have two
choices, and only the first is a good long-term answer:

1. **Merge the working branch into `main` first**, then point Pages at `main`.
   Production then means "reviewed and merged", which is what you want the word
   to mean.
2. **Set the production branch to the working branch** in Pages
   (Settings → Builds → Branch control). Faster today, and it makes every future
   deploy depend on remembering which branch is the real one.

### Connecting it

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorize the Cloudflare GitHub app and pick the repository. Grant it access
   to that one repository, not to the whole account.
3. Name the project **`lifebook`** — the same string as `name` in
   `wrangler.toml`.
4. Set the production branch (see above).
5. Build command `npm run build`, output directory `dist`. Pages will read both
   from `wrangler.toml` anyway; typing them changes nothing.
6. Add environment variables *if* you want accounts (next section), then
   **Save and Deploy**.

Every push to the production branch redeploys. Every other branch gets its own
preview URL, which is genuinely useful here: you can look at a change to the
constellation on a phone before it is anyone's production.

Three things that normally need attention on a single-page app do not need it:

- **No SPA rewrite rule.** The app uses hash routing (`/#/life`), so every URL a
  browser ever requests is `/`. There is no `_redirects` file and none is
  needed. If you ever switch to browser routing you will need
  `/*  /index.html  200`.
- **No server-side secrets.** See below.
- **Headers** are already declared in `public/_headers`, which Vite copies into
  `dist/` verbatim and Pages reads directly. Read that file before your first
  deploy: it explains why the Content-Security-Policy line is left commented out
  and which of the two versions is correct for your deployment.
  `e2e/headers.mjs` serves the real build under that policy and checks the app
  still works, so the choice is tested rather than hoped for.

### Environment variables

Settings → Environment variables, set for *Production* and *Preview*
separately.

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

**After deploying with accounts**, add the Pages URL — and the
`*.pages.dev` preview pattern, if you want previews to be able to sign in — to
your Supabase project under Authentication → URL Configuration → Redirect URLs.
Otherwise the email link and the Google round-trip both bounce.

### The service worker

Updates are prompted, not silent, so a returning person keeps the bundle they
are mid-sentence in until they accept the new one. The `_headers` file keeps
`/sw.js` uncached at the edge so that prompt can actually arrive.

### Deploying from a terminal instead

If you would rather not connect Git, the same build ships with one command:

```bash
npm run build
npx wrangler pages deploy          # reads wrangler.toml
```

`wrangler login` opens a browser once. For CI, use a token scoped to
**Cloudflare Pages: Edit** on the one account and nothing else, stored as a
repository secret — never in a file in this repository.

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
