/**
 * Parse the Edge Functions.
 *
 * They are Deno and they are deployed separately, so nothing in the normal
 * build or test run ever looks at them. A syntax error there does not fail
 * anything here — it fails silently in production, where the symptom is that
 * customers pay and never receive access, and the cause is a stray bracket
 * nobody read.
 *
 * This does not typecheck them (that needs Deno, which is not installed here);
 * it parses them, which catches the class of mistake that would otherwise reach
 * a deploy. Anything deeper is caught by `supabase functions deploy`, which
 * refuses a function it cannot compile.
 *
 * Run with: npm run check:functions
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join('supabase', 'functions');
if (!existsSync(ROOT)) {
  console.log('No supabase/functions directory — nothing to check.');
  process.exit(0);
}

const fails = [];

for (const dir of readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const file = join(ROOT, dir.name, 'index.ts');
  if (!existsSync(file)) {
    console.log(`FAIL  ${dir.name} has no index.ts`);
    fails.push(dir.name);
    continue;
  }

  try {
    execFileSync('npx', ['esbuild', file, '--format=esm', '--target=es2022', '--platform=neutral'],
      { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`ok    ${dir.name}`);
  } catch (e) {
    console.log(`FAIL  ${dir.name}`);
    console.log(String(e.stderr ?? e.message).split('\n').slice(0, 12).join('\n'));
    fails.push(dir.name);
  }

  // The one thing a parser cannot notice. The service role bypasses every
  // access rule in the database; it belongs in the webhook and nowhere else.
  const source = readFileSync(file, 'utf8');
  if (source.includes('SERVICE_ROLE') && dir.name !== 'stripe-webhook') {
    console.log(`FAIL  ${dir.name} reads the service role key. Only the webhook may.`);
    fails.push(dir.name);
  }
}

if (fails.length) {
  console.log(`\n${fails.length} function(s) would not deploy.`);
  process.exit(1);
}
console.log('\nEdge Functions parse.');
