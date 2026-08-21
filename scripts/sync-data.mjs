/* sync-data.mjs — keep lib/dispatch-day.json byte-identical to the handoff's copy.
 *
 * ⚠⚠ There is ONE dispatch day and it lives in the handoff:
 *   Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json
 * The app needs it inside its own tree to import it, so there is a second copy —
 * and a second copy of anything is a copy that drifts. `npm run build` runs this
 * first: it copies, and if the copy differed it says which one it overwrote.
 *
 * ⚠ If the handoff is not on disk (somebody cloned this repo alone) it does NOT
 * silently continue with a stale copy. It says the source is missing and exits 2,
 * because a build against an unverifiable fixture is exactly the class of thing
 * this estate keeps getting wrong.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(REPO, '../Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json');
const DST = resolve(REPO, 'lib/dispatch-day.json');

if (!existsSync(SRC)) {
  console.error(`\ndispatch-day.json not found at:\n  ${SRC}`);
  console.error('\nThat file is the source of this whole demo. Refusing to build against the local copy,');
  console.error('which nobody can check. Clone the handoff beside this repo, or say so on the screen.\n');
  process.exit(2);
}

const src = readFileSync(SRC, 'utf8');
const dst = existsSync(DST) ? readFileSync(DST, 'utf8') : null;

if (dst === src) {
  console.log('dispatch-day.json — in step with the handoff.');
} else {
  writeFileSync(DST, src);
  console.log(dst === null
    ? 'dispatch-day.json — copied from the handoff for the first time.'
    : '⚠ dispatch-day.json — the local copy had drifted and was overwritten from the handoff.');
  console.log('  Run `npm run derive` before you trust anything downstream of it.');
}
