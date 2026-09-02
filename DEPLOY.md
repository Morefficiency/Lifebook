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

## Cloudflare Workers (static assets)

This is what the repo is configured for, and what Cloudflare now steers new
projects towards: a Worker that serves the built files and runs no code of its
own. `wrangler.toml` carries the whole configuration —

```toml
name = "lifebook"          # must equal the Worker's name
compatibility_date = "..."

[assets]
directory = "./dist"
not_found_handling = "none"
```

— and `.node-version` pins the build to Node 22.

`not_found_handling` is `none` on purpose. The usual value for a single-page app
is `single-page-application`, which rewrites every unknown path to index.html.
Lifebook uses hash routing (`/#/life`), so the only path a browser ever requests
is `/`; a 404 here means a genuinely missing file and should say so rather than
be papered over with the app shell.

### Dashboard settings

In the Worker → **Settings** → **Build**:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Branch | the branch that actually has the app |

**Build command is the one people leave empty.** With no build command there is
no `dist/`, and the deploy fails with

```
✘ [ERROR] Could not detect a directory containing static files
```

which reads like a configuration problem and is really "nothing was built".

### Which branch

A Worker builds one branch. Check what is on it before pointing anything at it:

```bash
git log --oneline -1 origin/main
```

If the app lives on a working branch rather than on `main`, you have two
choices, and only the first is a good long-term answer:

1. **Merge the working branch into `main`**, then build `main`. Production then
   means "reviewed and merged", which is what you want the word to mean.
2. **Change the Worker's branch** to the working branch. Faster today, and it
   makes every future deploy depend on remembering which branch is the real one.

Pointing it at a branch that does not have the app yet is the failure mode here,
and when the build command is also empty it does not look like one.

### Connecting the repository

You do not start on GitHub — there is no button there for this. Start in the
Cloudflare dashboard; it redirects you to GitHub to install its app, where you
pick the account, choose **Only select repositories**, and grant it this
repository alone. Afterwards, repository access is changed at
`github.com/settings/installations`, which is also where you revoke it.

### Headers still apply

`public/_headers` is copied into `dist/` by Vite, and wrangler parses it for
Workers static assets exactly as Pages does — so the frame, sniff, referrer and
permissions headers, and the cache rules that keep `/sw.js` fresh, all survive
the move. Read that file before your first deploy: it explains why the
Content-Security-Policy line is left commented out and which of the two versions
is correct for your deployment. `e2e/headers.mjs` serves the real build under
that policy and checks the app still works, so the choice is tested rather than
hoped for.

### Environment variables

Worker → Settings → **Variables and Secrets**, and note that these are needed at
*build* time, not runtime — Vite compiles them into the bundle — so they belong
in the build configuration's variables.

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

**After deploying with accounts**, add the deployed URL to your Supabase project
under Authentication → URL Configuration → Redirect URLs, or the email link and
the Google round-trip both bounce.

### The service worker

Updates are prompted, not silent, so a returning person keeps the bundle they
are mid-sentence in until they accept the new one. The `_headers` file keeps
`/sw.js` uncached at the edge so that prompt can actually arrive.

### Deploying from a terminal instead

```bash
npm run build
npx wrangler deploy            # reads wrangler.toml
npx wrangler deploy --dry-run  # check the config without shipping
```

`wrangler login` opens a browser once. For CI, use a token scoped to
**Workers Scripts: Edit** on the one account and nothing else, stored as a
repository secret — never in a file in this repository.

## Cloudflare Pages instead

Pages works equally well and needs one change: swap the `[assets]` block in
`wrangler.toml` for `pages_build_output_dir = "dist"`, and use
`npx wrangler pages deploy`. The two forms are mutually exclusive — wrangler
refuses a config that claims to be both.

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
