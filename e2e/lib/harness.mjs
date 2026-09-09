/**
 * The dozen lines every e2e suite used to declare for itself.
 *
 * Sixteen scripts each carried their own copy of: a `fails` array, a `check`
 * that prints PASS or FAIL, a chromium launch that has to honour CHROMIUM_PATH
 * because this environment ships its own browser, a context, a page, and two
 * listeners collecting console and page errors. Roughly two hundred duplicated
 * lines, and — more to the point — sixteen places to edit the day the launch
 * flags change. That day has already happened once.
 *
 * The variation between the copies was real but shallow: different viewports,
 * three suites needing SwiftShader for WebGL, and two dialects of the final
 * summary line. All three are options here; nothing else differed.
 */
import { mkdirSync } from 'node:fs';

/** The local-only build, served by `npm run preview`. */
export const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';

/**
 * The build with a Supabase project configured, served by
 * `npm run preview:account` on its own port. The accounts and paywall suites
 * need that build and would silently walk the wrong one against BASE — which
 * is exactly what happened once, and is why this is a named export rather than
 * a literal repeated in two files.
 */
export const ACCOUNT_BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4174';

export const OUT = process.env.E2E_OUT ?? 'e2e/.out';

/** Software WebGL. Needed by any suite that renders the constellation. */
const WEBGL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/**
 * A browser, with this environment's own chromium when it has one.
 *
 * `webgl: true` adds the SwiftShader flags — without them a canvas suite fails
 * in a way that looks like a rendering bug rather than a missing GPU.
 */
export async function launch(chromium, { webgl = false } = {}) {
  const args = webgl ? WEBGL_ARGS : [];
  return chromium.launch(
    process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args }
      : { args },
  );
}

/**
 * A page, and the errors it produced.
 *
 * `errs` is live: it accumulates as the walk runs, so a suite asserts on it at
 * the end rather than subscribing to anything itself.
 */
export async function openPage(browser, { viewport = { width: 1280, height: 1000 }, ...rest } = {}) {
  const ctx = await browser.newContext({ viewport, ...rest });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  return { ctx, page, errs };
}

/**
 * The PASS/FAIL log and the exit code.
 *
 * `style: 'compact'` is the second dialect three suites used — "3 FAILED: a, b"
 * rather than "FAILURES: a | b". Kept so migrating a suite changes none of its
 * output, which is what makes the migration checkable by pass count.
 */
export function reporter({ out = OUT, style = 'verbose' } = {}) {
  mkdirSync(out, { recursive: true });
  const fails = [];

  const check = (name, ok, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) fails.push(name);
  };

  /** Print the summary and exit non-zero if anything failed. Never returns. */
  const finish = () => {
    console.log(
      style === 'compact'
        ? (fails.length ? `\n${fails.length} FAILED: ${fails.join(', ')}` : '\nall checks passed')
        : '\n' + (fails.length ? `FAILURES: ${fails.join(' | ')}` : 'ALL CHECKS PASSED'),
    );
    process.exit(fails.length ? 1 : 0);
  };

  return { check, fails, finish };
}
