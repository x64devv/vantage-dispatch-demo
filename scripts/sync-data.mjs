/* sync-data.mjs — keep lib/dispatch-day.json honest, in a checkout that has the
 * handoff beside it AND in one that does not.
 *
 * ⚠⚠ There is ONE dispatch day and it lives in the handoff:
 *   Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json
 * The app needs it inside its own tree to import it, so there is a second copy —
 * and a second copy of anything is a copy that drifts. `npm run build` runs this
 * first.
 *
 * ⚠⚠ AND THE CASE THIS FILE GOT WRONG THE FIRST TIME. This repo is pushed to
 * GitHub on its own, so on a build server the handoff is NOT beside it — and the
 * first version of this script exited 2 in that case, which is correct-sounding
 * and useless: it failed every Vercel build, so no deployment was ever produced
 * and vantage-dispatch-demo.vercel.app answered DEPLOYMENT_NOT_FOUND. A guard
 * that cannot tell "unverifiable" from "verifiable by another means" is a guard
 * that only ever blocks the honest case.
 *
 * So there are now three states, not two:
 *
 *   handoff present            → copy it, and PIN the copy by writing its
 *                                checksum to lib/dispatch-day.sha256
 *   handoff absent, pin matches → build. The copy is byte-identical to the one
 *                                that was checked against the driver app, and
 *                                the checksum committed beside it says so
 *   handoff absent, pin missing
 *   or the copy does not match → REFUSE, exit 2. This is the genuinely
 *                                unverifiable case and it is the only one worth
 *                                stopping a build for
 *
 * ⚠ The pin is only ever written when the real source is present, so it cannot
 * be forged by editing the copy: change lib/dispatch-day.json without the
 * handoff on disk and the next build refuses.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(REPO, '../Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json');
const DST = resolve(REPO, 'lib/dispatch-day.json');
const PIN = resolve(REPO, 'lib/dispatch-day.sha256');

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

if (existsSync(SRC)) {
  /* ── The working checkout: the handoff is the authority. ─────────────── */
  const src = readFileSync(SRC, 'utf8');
  const dst = existsSync(DST) ? readFileSync(DST, 'utf8') : null;

  if (dst !== src) {
    writeFileSync(DST, src);
    console.log(
      dst === null
        ? 'dispatch-day.json — copied from the handoff for the first time.'
        : '⚠ dispatch-day.json — the local copy had drifted and was overwritten from the handoff.',
    );
    console.log('  Run `npm run derive` before you trust anything downstream of it.');
  } else {
    console.log('dispatch-day.json — in step with the handoff.');
  }

  const digest = sha(src);
  const pinned = existsSync(PIN) ? readFileSync(PIN, 'utf8').trim() : null;
  if (pinned !== digest) {
    writeFileSync(PIN, digest + '\n');
    console.log(`  pinned ${digest.slice(0, 12)}… → lib/dispatch-day.sha256 ⚠ commit it with the copy.`);
  }
  process.exit(0);
}

/* ── A checkout without the handoff: a build server, or a clone of this repo
      on its own. The copy is all there is, so check it against the pin. ─── */
if (!existsSync(PIN)) {
  console.error(`\ndispatch-day.json's checksum is not in this checkout:\n  ${PIN}`);
  console.error('\nThe handoff is not here either, so there is nothing to verify the local copy against.');
  console.error('Refusing to build against a fixture nobody can check.\n');
  process.exit(2);
}
if (!existsSync(DST)) {
  console.error(`\nlib/dispatch-day.json is missing and the handoff is not in this checkout.\n`);
  process.exit(2);
}

const digest = sha(readFileSync(DST, 'utf8'));
const pinned = readFileSync(PIN, 'utf8').trim();

if (digest !== pinned) {
  console.error('\n⚠⚠ lib/dispatch-day.json does not match the checksum committed beside it.');
  console.error(`     pinned  ${pinned}`);
  console.error(`     on disk ${digest}`);
  console.error('\nSomebody edited the copy instead of the handoff. That edit has never been checked');
  console.error('against vantage-driver-app/lib/run.ts, so this build would ship a fixture that may');
  console.error('contradict the driver demo. Edit the handoff and re-run `npm run data`, then');
  console.error('`npm run derive`.\n');
  process.exit(2);
}

console.log(`dispatch-day.json — the handoff is not in this checkout (standalone build).`);
console.log(`  The pinned copy matches its recorded checksum ${pinned.slice(0, 12)}…, so it is the`);
console.log(`  same bytes that were checked against vantage-driver-app/lib/run.ts. Building.`);
