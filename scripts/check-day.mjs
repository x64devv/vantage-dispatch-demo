#!/usr/bin/env node
/* The invariants the day has to satisfy before a single screen is drawn.
 *
 * ⚠⚠⚠ THIS EXISTS BECAUSE 150 BROWSER ASSERTIONS AND 56 KOTLIN TESTS ALL PASSED
 * WHILE THREE CONSIGNMENTS COULD NOT BE DISPATCHED AT ALL. Their `Scan` buttons
 * bound nothing when pressed — the count sat at `0 of 1`, the gate never opened,
 * the goods never left. Every one of those assertions walked the scripted beats,
 * and the scripted beats walked the other consignments.
 *
 * Wyne found it the only way it could be found: by pressing the button.
 *
 *   *"the simulate scan is not working … not even one customer is getting past
 *   the scanning and the signing."*
 *
 * ⚠ A check over the DATA catches a whole class at once; a walk over ONE PATH
 * catches one path. This file is the cheap half and it runs first — `npm run
 * build` fails on it before Next.js starts.
 */

import { readFileSync } from 'node:fs';

const DAY = JSON.parse(readFileSync(new URL('../lib/dispatch-day.json', import.meta.url), 'utf8'));

const fails = [];
const ok = (what, cond) => { if (!cond) fails.push(what); };

/* Every unit that could be bound to a line, from BOTH places the day records
   them — a load's `serialAssignments` and a counter's `serialScans`. */
const unitsFor = (cid, lineNo) => {
  const assigned = DAY.serialAssignments.filter((s) => s.consignment === cid && s.line === lineNo);
  if (assigned.length) return assigned;
  const col = DAY.collections.find((c) => c.consignment === cid);
  return (col?.serialScans ?? []).filter((x) => x.line === lineNo);
};

const blocked = new Set(DAY.exceptions.map((e) => `${e.consignment}#${e.line}`));

/* ── ⚠⚠⚠ The invariant ─────────────────────────────────────────────────────
   Every serialised line has as many units to bind as it has quantity, or it is
   the one deliberate block. */
for (const c of DAY.consignments) {
  for (const l of c.lines) {
    if (!l.serialised) continue;
    const key = `${c.id}#${l.no}`;
    if (blocked.has(key)) continue;
    const have = unitsFor(c.id, l.no).length;
    ok(
      `${c.lane} ${c.id} line ${l.no} (${l.desc}) — serialised, qty ${l.qty}, ${have} to bind: ` +
        `its Scan button would do nothing`,
      have >= l.qty,
    );
  }
}

/* ⚠ And the block must STAY empty. A serial quietly added to CN-MW-000121 lets
   the wrong unit through and deletes beat 5. */
ok(
  'CN-MW-000121 line 1 has been given a serial — that is beat 5, and it must have none',
  unitsFor('CN-MW-000121', 1).length === 0,
);

/* ⚠ A line that is NOT serialised must have no serial pretending otherwise. */
for (const c of DAY.consignments) {
  for (const l of c.lines) {
    if (l.serialised) continue;
    ok(
      `${c.id} line ${l.no} is not serialised but carries ${unitsFor(c.id, l.no).length} serial(s)`,
      unitsFor(c.id, l.no).length === 0,
    );
  }
}

/* ⚠ Two grades of a fact: every capture is one of exactly two words. */
for (const s of [...DAY.serialAssignments, ...DAY.collections.flatMap((c) => c.serialScans)]) {
  ok(`${s.id} captured as ${JSON.stringify(s.capturedBy)}`, ['Scanned', 'Typed'].includes(s.capturedBy));
  ok(`${s.id} claims state ${s.state}`, s.state === 'BOUND_AT_DISPATCH');
}

/* ⚠ No serial is bound twice — the same physical unit cannot leave on two jobs. */
const seen = new Map();
for (const s of [...DAY.serialAssignments, ...DAY.collections.flatMap((c) => c.serialScans)]) {
  ok(`serial ${s.serial} is bound twice (${seen.get(s.serial)} and ${s.id})`, !seen.has(s.serial));
  seen.set(s.serial, s.id);
}

/* ⚠ Every consignment on the board can be reached and finished: it is either on
   a load, has a collection, or is honestly staged for neither. */
for (const c of DAY.consignments) {
  if (c.lane !== 'collection') continue;
  const col = DAY.collections.find((x) => x.consignment === c.id);
  ok(
    `${c.id} is on the collection lane with a collection record that has no receiver`,
    !col || (col.receiver?.name && col.receiver?.idNo),
  );
}

if (fails.length) {
  console.error(`\ndispatch-day.json — ${fails.length} broken:\n`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(2);
}
console.log(
  `dispatch-day.json — ${DAY.consignments.length} consignments, ` +
    `${DAY.serialAssignments.length} binds, every serialised line has something to scan.`,
);
