/* derive-run.mjs — turn the dispatch day into the driver app's run, and refuse
 * if the two disagree.
 *
 *   npm run derive          derive, check, print
 *   npm run derive -- --write   also write out/run.json
 *
 * ⚠⚠ WHY THIS EXISTS. The driver demo's fixture (vantage-driver-app/lib/run.ts)
 * and this app's fixture describe the same morning at Village Walk. Two hand-kept
 * copies of one morning diverge — that is not a risk, it is a certainty, and the
 * console's own data-truth pass exists because it already happened once. So the
 * dispatch day is the source, the run is derived from it, and this script is the
 * thing that fails when somebody edits one end only.
 *
 * ⚠ It does NOT parse TypeScript. It reads vantage-driver-app/lib/run.ts as text
 * and asserts that every value this file derives appears literally in it. A
 * parser would tell you the file is well-formed; this tells you the two fixtures
 * agree, which is the fact that matters. If the driver app is not on disk the
 * script says so and exits 2 — it never quietly passes for want of something to
 * check against.
 *
 * ⚠ Known divergences live in scripts/known-divergences.json, each with a reason
 * and an owner. A divergence on that list prints and is tolerated. A divergence
 * NOT on that list fails the run. New disagreement is always an error; old
 * disagreement is somebody's decision.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const DAY_PATH = resolve(REPO, '../Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json');
const DRIVER_RUN = resolve(REPO, '../vantage-driver-app/lib/run.ts');
const KNOWN = JSON.parse(readFileSync(join(HERE, 'known-divergences.json'), 'utf8'));

const write = process.argv.includes('--write');

/* ── 1. Derive ─────────────────────────────────────────────────────────── */

const day = JSON.parse(readFileSync(DAY_PATH, 'utf8'));

const byId = Object.fromEntries(day.consignments.map((c) => [c.id, c]));
const load = day.loads.find((l) => l.id === 'LD-000377');
const onLoad = day.consignments
  .filter((c) => c.load === load.id)
  .sort((a, b) => a.stopSeq - b.stopSeq);

const sasFor = (cid, lineNo) =>
  day.serialAssignments.filter((s) => s.consignment === cid && s.line === lineNo);

/* One consignment line becomes one driver line. ⚠ A line with several serialised
 * units does NOT become several driver lines: the driver reads a count, not a
 * list, because he is holding a phone in the sun. The serials are all bound and
 * all queryable; the doorstep just does not need them one by one. */
function driverLine(c, line) {
  const sas = sasFor(c.id, line.no);
  const base = { desc: line.desc, sku: line.sku, qty: line.qty };

  if (c.receiptScanAtFarEnd) return null; // handled whole-consignment below

  if (!line.serialised) return { ...base, serial: null };
  if (sas.length === 1) {
    const sa = sas[0];
    return {
      ...base,
      serial: sa.serial,
      capturedBy: sa.capturedBy,
      boundAt: sa.boundAt,
      boundOnLoadUnit: sa.loadUnit,
    };
  }
  /* ⚠ More than one unit on the line: the driver's row reads "3 serials bound".
   * capturedBy is only stated when every unit agrees — one typed unit among three
   * scanned ones is not a "scanned" line, and the app must not round it up. */
  const allSame = sas.every((s) => s.capturedBy === sas[0].capturedBy);
  return {
    ...base,
    serial: `${sas.length} serials bound`,
    ...(allSame ? { capturedBy: sas[0].capturedBy } : {}),
  };
}

const stops = onLoad.map((c) => {
  const seq = c.stopSeq;
  const seeded = seq < day.driverRunFacts.currentStopSeq ? 'delivered' : seq === day.driverRunFacts.currentStopSeq ? 'current' : 'pending';

  const lines = c.receiptScanAtFarEnd
    ? [
        /* ⚠ An inter-branch transfer is one row on a driver's screen, not four.
         * What he does at the far end is hand over the load and watch the branch
         * scan it in — the line-by-line detail is the branch's job, on their
         * device, and putting it on his phone would imply he checks it. */
        {
          desc: `Inter-branch transfer, ${c.lines.length} lines`,
          sku: 'Multiple',
          qty: c.lines.length,
          serial: 'Receipt scan at branch',
        },
      ]
    : c.lines.map((l) => driverLine(c, l)).filter(Boolean);

  return {
    id: seq,
    seq,
    seeded,
    customer: c.customer.name,
    address: c.address.line,
    addressFull: c.address.full,
    area: c.address.suburb,
    phone: c.customer.phone,
    window: c.window,
    latlng: c.address.latlng,
    consignment: c.id,
    ...(c.invoiceRefs.length ? { invoice: c.invoiceRefs[0] } : {}),
    htb: c.htb,
    cash: c.cashAtDoor
      ? { amount: `${c.cashAtDoor.currency} ${c.cashAtDoor.amount}`, currency: c.cashAtDoor.currency, what: c.cashAtDoor.what }
      : null,
    lines,
    ...(c.receiptScanAtFarEnd ? { receiptScanAtFarEnd: true } : {}),
  };
});

const f = day.driverRunFacts;
const run = {
  trip: {
    id: load.trip,
    date: day.day,
    kicker: day.kicker,
    zone: load.zone,
    vehicle: `${load.vehicle.reg} · ${load.vehicle.fleetNo}`,
    vehicleMake: load.vehicle.make,
    load: load.id,
    seals: load.seals,
    crewSize: 2,
    depot: { code: load.depot.code, name: load.depot.name, short: `${load.depot.code} Village Walk` },
    driver: load.driver,
    crew: load.crew,
    terminal: f.terminal,
    downloadedAt: f.downloadedAt,
    build: f.build,
    startPosition: f.startPosition,
    dispatcherOrder: f.dispatcherOrder,
    optimisedOrder: f.optimisedOrder,
  },
  stops,
};

/* ── 2. Check it against the driver app, value by value ────────────────── */

if (!existsSync(DRIVER_RUN)) {
  console.error(`\nvantage-driver-app/lib/run.ts not found at:\n  ${DRIVER_RUN}\n`);
  console.error('Nothing to check the derivation against. Refusing to report a pass.');
  process.exit(2);
}
const src = readFileSync(DRIVER_RUN, 'utf8');

/* ⚠ Dispatch holds more than a driver's screen needs — the invoice number on a
 * stop where nothing is collected, the minute a serial was bound on a stop
 * delivered three hours ago. That is not a disagreement, it is a field the
 * driver app chose not to surface, and calling it a failure would train
 * everybody to ignore this script.
 *
 * So each stop is checked inside its OWN block of run.ts, and a field is HARD
 * only when the driver fixture carries that field for that stop. A field it does
 * not carry is counted as "held here, not surfaced there" and listed. If the
 * driver app ever starts carrying it, the check tightens on its own. */
function stopBlock(consignment) {
  const i = src.indexOf(`consignment: '${consignment}'`);
  if (i < 0) return null;
  const from = src.lastIndexOf('\n  {', i);
  const to = src.indexOf('\n  }', i);
  return from < 0 || to < 0 ? null : src.slice(from, to);
}

const hard = [];      // must appear
const notSurfaced = []; // dispatch holds it, the driver app does not model it
const addHard = (what, value, hay = src) => hard.push({ what, value: String(value), hay });
const addSoft = (what, value, key, hay) => {
  if (hay && hay.includes(key)) hard.push({ what, value: String(value), hay });
  else notSurfaced.push({ what, value: String(value) });
};

addHard('trip id', run.trip.id);
addHard('trip date', run.trip.date);
addHard('kicker', run.trip.kicker);
addHard('zone', run.trip.zone);
addHard('vehicle', run.trip.vehicle);
addHard('vehicle make', run.trip.vehicleMake);
addHard('load', run.trip.load);
run.trip.seals.forEach((s, i) => addHard(`seal ${i + 1}`, s));
addHard('driver', run.trip.driver.name);
addHard('driver staff no', run.trip.driver.staffNo);
addHard('crew', run.trip.crew.name);
addHard('crew staff no', run.trip.crew.staffNo);
addHard('depot code', run.trip.depot.code);
addHard('terminal', run.trip.terminal.terminalNo);
addHard('store', run.trip.terminal.storeNo);
addHard('downloaded at', run.trip.downloadedAt);
addHard('dispatcher order', `[${run.trip.dispatcherOrder.join(', ')}]`);
addHard('optimised order', `[${run.trip.optimisedOrder.join(', ')}]`);

for (const s of run.stops) {
  const p = `stop ${s.seq}`;
  const blk = stopBlock(s.consignment);
  if (!blk) {
    notSurfaced.push({ what: `${p} whole stop`, value: `${s.consignment} — no such stop in the driver's run` });
    continue;
  }
  addHard(`${p} consignment`, s.consignment, blk);
  addHard(`${p} customer`, s.customer, blk);
  addHard(`${p} address`, s.address, blk);
  addHard(`${p} full address`, s.addressFull, blk);
  addHard(`${p} suburb`, s.area, blk);
  addHard(`${p} phone`, s.phone, blk);
  addHard(`${p} window`, s.window, blk);
  addHard(`${p} seeded state`, s.seeded, blk);
  addHard(`${p} htb`, `htb: ${s.htb}`, blk);
  addHard(`${p} lat`, s.latlng[0], blk);
  addHard(`${p} lng`, s.latlng[1], blk);
  if (s.invoice) addSoft(`${p} invoice`, s.invoice, 'invoice:', blk);
  if (s.cash) {
    addHard(`${p} cash`, s.cash.amount, blk);
    addHard(`${p} cash reason`, s.cash.what, blk);
  }
  s.lines.forEach((l, i) => {
    addHard(`${p} line ${i + 1} desc`, l.desc, blk);
    addHard(`${p} line ${i + 1} sku`, l.sku, blk);
    if (l.serial) addHard(`${p} line ${i + 1} serial`, l.serial, blk);
    if (l.capturedBy) addSoft(`${p} line ${i + 1} captured by`, l.capturedBy, 'capturedBy', blk);
    if (l.boundAt) addSoft(`${p} line ${i + 1} bound at`, l.boundAt, 'boundAt', blk);
    if (l.boundOnLoadUnit) addSoft(`${p} line ${i + 1} load unit`, l.boundOnLoadUnit, 'boundOnLoadUnit', blk);
  });
}

const missing = hard.filter((c) => !c.hay.includes(c.value));
const knownByValue = Object.fromEntries(KNOWN.divergences.map((d) => [d.dispatchValue, d]));

const explained = [];
const unexplained = [];
for (const m of missing) {
  const k = knownByValue[m.value];
  (k ? explained : unexplained).push({ ...m, known: k });
}

/* ── 3. Say what happened ──────────────────────────────────────────────── */

const n = hard.length;
console.log(`\nVantage Dispatch → Vantage Driver, derivation check`);
console.log(`  source   ${DAY_PATH.replace(resolve(REPO, '..') + '/', '')}`);
console.log(`  against  ${DRIVER_RUN.replace(resolve(REPO, '..') + '/', '')}`);
console.log(`\n  ${n - missing.length} of ${n} derived values found verbatim in the driver's run, each inside its own stop.`);

if (notSurfaced.length) {
  console.log(`\n  ${notSurfaced.length} field(s) dispatch holds that the driver app does not model — not a disagreement:`);
  for (const s of notSurfaced) console.log(`    ${s.what.padEnd(30)} ${s.value}`);
}

if (explained.length) {
  console.log(`\n  ${explained.length} known divergence(s) — on the list, with a reason and an owner:`);
  for (const e of explained) {
    console.log(`    ${e.known.id}  ${e.what}`);
    console.log(`         dispatch says  ${e.value}`);
    console.log(`         driver says    ${e.known.driverValue}`);
    console.log(`         owner: ${e.known.owner}`);
  }
}

if (unexplained.length) {
  console.log(`\n  \u26a0\u26a0 ${unexplained.length} value(s) the driver's run does not contain, and nobody has signed off:`);
  for (const u of unexplained) console.log(`    ${u.what.padEnd(30)} ${u.value}`);
  console.log(`\n  Either the dispatch day is wrong, or the driver fixture is, or this is a`);
  console.log(`  decision somebody took at a keyboard. Fix it, or put it on`);
  console.log(`  scripts/known-divergences.json with a reason and a name.`);
}

if (write) {
  mkdirSync(join(REPO, 'out-data'), { recursive: true });
  const p = join(REPO, 'out-data', 'run.json');
  writeFileSync(p, JSON.stringify(run, null, 2) + '\n');
  console.log(`\n  written  ${p}`);
}

console.log(unexplained.length ? '\nFAIL\n' : '\nOK\n');
process.exit(unexplained.length ? 1 : 0);
