/* verify.mjs — drive the exported app in a real browser and assert.
 *
 *   npm run build && npm start &   then   npm run verify
 *
 * ⚠⚠ "It builds" is not "it works". Every defect found in the Vantage build so
 * far was found by a person using the product, so this walks the flow the way
 * the demo is walked and reads values back out of the DOM — including pixels
 * back out of the signature canvas, because ink in the wrong place is invisible
 * to any assertion that only looks at markup.
 *
 * ⚠ Copy checks run inside [data-tablet="screen"] only.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4174';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS = 'shots';

let pass = 0;
const fails = [];
const ok = (what, cond) => { if (cond) pass++; else fails.push(what); };
const eq = (what, got, want) => ok(`${what} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`, got === want);
const has = (what, hay, needle) => ok(`${what} — missing: ${needle}`, String(hay).includes(needle));
const hasnt = (what, hay, needle) => ok(`${what} — must not contain: ${needle}`, !String(hay).includes(needle));
/* ⚠ Tags and labels are uppercased by the stylesheet, so innerText shouts them.
   Copy that is READ ALOUD is asserted verbatim with has(); shouted labels with hasU(). */
const hasU = (what, hay, needle) =>
  ok(`${what} — missing: ${needle}`, String(hay).toUpperCase().includes(String(needle).toUpperCase()));

mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1800, height: 1150 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
/* ⚠ One 404 is deliberate: the check below that /exceptions is gone. Everything
   else is a real error and must be zero. */
let expect404 = false;
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (expect404 && m.text().includes('404')) return;
  errors.push(m.text());
});

const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(140); };
const screenText = () => page.locator('[data-tablet="screen"]').innerText();
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png` });

/* ⚠ The desk persists in localStorage, so blocks earlier in this file leave
   consignments already verified and scanned. A walk that has to start from the
   seeded morning says so and clears it, rather than quietly depending on
   whatever ran before it. */
const resetDesk = async () => {
  await go('/board/');
  await page.evaluate(() => localStorage.removeItem('vantage-dispatch-desk-v2'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
};

/* ⚠ "It is on the page" is not "you can see it". This measures. */
async function visible(what, testid) {
  const el = await page.getByTestId(testid).boundingBox();
  const scr = await page.locator('[data-tablet="screen"]').boundingBox();
  ok(`${what} — on screen without scrolling`,
    !!el && !!scr && el.y >= scr.y - 1 && el.y + el.height <= scr.y + scr.height + 1);
}

/* ── The furniture the review asked to be removed ───────────────────────── */
await go('/board/');
{
  const body = await page.locator('body').innerText();
  hasnt('no design-assumptions rail', body, 'What this design assumes');
  hasnt('no projector note', body, '?bare=1');
  hasnt('no beats note', body, 'running order');
  hasnt('no live record trail', body, 'Live record trail');
  hasnt('...nor its heading', body, 'Everything the driver does');
  hasnt('no "not built here" rail note', body, 'Not built here');
  // ⚠ The tablet now uses the whole window and scales UP rather than down.
  const w = await page.locator('[data-tablet="screen"]').evaluate((e) => e.getBoundingClientRect().width);
  ok(`the tablet renders larger than its design pixels — measured ${Math.round(w)}px for a 1280px screen`, w > 1280);
}

/* ── The board: two tabs, cards ─────────────────────────────────────────── */
{
  const t = await screenText();
  has('board · the collection tab', t, 'Awaiting collection');
  has('board · the driver tab', t, 'Awaiting our driver');
  hasnt('board · the carrier lane is gone', t, 'Awaiting a carrier');
  eq('board · exactly two tabs', await page.locator('[data-testid^="tab-"]').count(), 2);
  // ⚠ Collection is first. It is not the minor case.
  const first = await page.locator('[data-testid^="tab-"]').first().getAttribute('data-testid');
  eq('board · collection is the first tab', first, 'tab-collection');

  await page.getByTestId('tab-collection').click();
  await page.waitForTimeout(120);
  const tc = await screenText();
  has('board · the ageing row past fourteen days', tc, '3% penalty due');
  has('board · a collection card', tc, 'Simba Mhlanga');

  await page.getByTestId('tab-ourDriver').click();
  await page.waitForTimeout(120);
  has('board · Nancy is on the driver tab', await screenText(), 'Nancy Muhoni');
  // Big cards, not rows.
  const h = await page.getByTestId('card-CN-VE-000418').evaluate((e) => e.getBoundingClientRect().height);
  ok(`board · cards are card-sized — measured ${Math.round(h)}px`, h > 180);
  await shot('01-board');
}

/* ── Step 1: a card opens verification ──────────────────────────────────── */
await page.getByTestId('card-CN-VE-000418').click();
await page.waitForURL('**/consignment/CN-VE-000418/**');
{
  const t = await screenText();
  has('verify · the three steps are on screen', t, 'Verify');
  has('verify · ...and where it goes', t, 'Hand over');
  has('verify · the goods', t, 'CTV Samsung 85" QA85Q7FAAUXKE');
  has('verify · the real §SD-4 bracket SKU', t, 'OB-MP-GB-801000067');
  has('verify · the pin grade', await page.getByTestId('pin-grade').innerText(), 'Salesperson');
  has('verify · the invoice is named, not drawn', t, 'a re-rendered invoice is what the rule forbids');
  // ⚠ The serial is NOT a check on this screen — it cannot be answered by looking.
  eq('verify · three checks, not four', await page.locator('[data-testid^="check-"]').count(), 3);
  hasnt('verify · no serial check here', t, 'Serial captured');

  const btn = page.getByTestId('verify');
  eq('verify · the way on is inert', await btn.getAttribute('aria-disabled'), 'true');
  has('verify · ...and says how many are left', await btn.innerText(), '3 checks left');
  await visible('verify · the primary action', 'verify');
  await shot('02-verify');

  for (const id of ['description', 'quantity', 'condition']) {
    await page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' }).click();
  }
  eq('verify · becomes live once all three are answered', await btn.getAttribute('aria-disabled'), null);
  has('verify · ...and names the next step', await btn.innerText(), 'scan the serials');
  await btn.click();
  await page.waitForURL('**/scan/CN-VE-000418/**');
}

/* ── Step 2: a Scan button on the line ──────────────────────────────────── */
{
  const t = await screenText();
  eq('scan · the count starts at zero of one', (await page.getByTestId('count').innerText()).trim(), '0 of 1');
  await visible('scan · the running count', 'count');
  hasU('scan · the camera is labelled a simulation', t, 'Camera · simulated');
  // ⚠⚠ The control is ON the line, one per serialised line, and nowhere else.
  eq('scan · one Scan button, on the serialised line', await page.locator('[data-testid^="scan-"]').count(), 1);
  has('scan · the unserialised lines say why they have none', t, 'Not serialised — confirmed by count at verification');
  has('scan · typed entry is offered and labelled', t, 'recorded as typed');

  const onward = page.getByTestId('onward');
  eq('scan · the way on is inert until it is bound', await onward.getAttribute('aria-disabled'), 'true');
  has('scan · ...and says how many are left', await onward.innerText(), '1 serial still to scan');
  await shot('03-scan');

  await page.getByTestId('scan-1').click();
  await page.waitForTimeout(140);
  const t2 = await screenText();
  has('scan · the serial is bound', t2, '#G-000004791204');
  hasU('scan · scanned, not typed', t2, 'Scanned');
  eq('scan · the count advanced', (await page.getByTestId('count').innerText()).trim(), '1 of 1');
  has('scan · ...and the way on names the driver', await onward.innerText(), 'Hand to the driver');
  await shot('04-scan-bound');
}

/* ── The block ──────────────────────────────────────────────────────────── */
await go('/consignment/CN-MW-000121/');
{
  for (const id of ['description', 'quantity', 'condition']) {
    await page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' }).click();
  }
  await page.getByTestId('verify').click();
  await page.waitForURL('**/scan/CN-MW-000121/**');
  await page.getByTestId('scan-1').click();
  await page.waitForTimeout(160);

  const t = await screenText();
  // ⚠⚠ Verbatim from TRP-004 §4 and the console. Do not paraphrase.
  has('block · the sentence, verbatim', t, 'This freezer was sold on 21 June and sent to Kwekwe. Fetch the loading clerk before continuing.');
  has('block · the serial', t, '#G-000004652985');
  has('block · the invoice it was sold on', t, '410233');
  has('block · the reference the console renders', t, 'EX-000029114');
  // ⚠ The point the new flow makes: it passed every check a person can make.
  has('block · it passed the looking-checks', t, 'passed every check a person can make by looking');
  has('block · the truck still goes', t, 'one blocked line does not ground it');
  hasnt('block · there is no skip', t, 'Skip');
  hasnt('block · and no continue-anyway', t, 'Continue anyway');
  const ov = page.getByTestId('override');
  eq('block · the override is inert', await ov.getAttribute('aria-disabled'), 'true');
  has('block · ...and names the grant', await ov.innerText(), 'Serial Mismatch Override');
  await shot('05-block');
}

/* ── Step 3: hand to the driver ─────────────────────────────────────────── */
await go('/handover/LD-000377/');
{
  const t = await screenText();
  has('handover · the seals', t, 'Z-114882');
  const seal = page.getByTestId('seal');
  eq('handover · sealing is inert while lines are outstanding', await seal.getAttribute('aria-disabled'), 'true');
  has('handover · ...and says why', await seal.innerText(), 'Cannot seal');
  /* ⚠⚠ The driver signs HERE. The driver app has no accept-custody screen, so a
     screen claiming he signed on his own device would report a control nobody
     has built. Everything is signed on this tablet. */
  eq('handover · the driver signs on this tablet', await page.locator('[data-tablet="screen"] [data-testid="signature"]').count(), 1);
  hasU('handover · ...and the pad is his, by name', t, 'T. Mukanya signs for the load');
  has('handover · witnessed by the clerk on this terminal', t, 'Witnessed by R. Muparutsa on T118');
  hasnt('handover · nothing claims a device that does not exist', t, 'his own phone');
  hasnt('handover · ...nor his own terminal', t, 'his own device');
  hasnt('handover · ...nor D204', t, 'D204');
  hasU('handover · the refusal is a real control', t, 'If he will not take it');
  const accept = page.getByTestId('accept');
  eq('handover · accepting is inert before the seal', await accept.getAttribute('aria-disabled'), 'true');
  has('handover · ...and says which step is missing', await accept.innerText(), 'Seal the load first');
  await page.getByTestId('refuse-count').click();
  await page.waitForTimeout(120);
  has('handover · a refusal is recorded where both people are standing', await screenText(), 'Refused at the door');
  await shot('06-handover');
}

/* ── The driver's signature gate, walked THE WAY A PERSON WALKS IT ──────── */
{
  /* ⚠⚠ THIS BLOCK USED TO NAVIGATE BY URL — `go('/consignment/CN-VE-000418/')`
     for each of the five outstanding jobs — and so it passed while the app was
     unusable. The script knew the routes. The clerk does not. Wyne hit the wall
     the assertions could not see: from the handover screen there was no way to
     reach the five still to scan out, so every load looked like a dead end at
     the driver.

     ⚠ A verification that supplies its own navigation is testing the pages, not
     the product. Everything below CLICKS. */
  await resetDesk();
  await page.getByTestId('card-CN-VE-000402').click();
  await page.waitForTimeout(140);
  await page.getByTestId('verify').click();
  await page.waitForTimeout(140);
  await page.getByTestId('onward').click();
  await page.waitForTimeout(160);

  has('handover · reached by clicking, not by URL', page.url(), '/handover/LD-000377');
  has('handover · the sheet says how to clear it', await screenText(), 'Tap one to scan it out');
  has('handover · and what is outstanding', await page.getByTestId('seal').innerText(), '5 still to scan out');

  /* Work down the load sheet, which is what a goods-out clerk does. */
  for (const cid of ['CN-VE-000418', 'CN-VE-000421', 'CN-VE-000424', 'CN-VE-000427', 'CN-VE-000429']) {
    const row = page.getByTestId(`unit-${cid}`);
    ok(`handover · unit ${cid} is tappable while it is outstanding`, (await row.count()) === 1);
    await row.click();
    await page.waitForTimeout(160);
    has(`handover · tapping ${cid} opens its verification`, page.url(), `/consignment/${cid}`);

    for (const id of ['description', 'quantity', 'condition']) {
      const cell = page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' });
      if (await cell.count()) await cell.click();
    }
    await page.getByTestId('verify').click();
    await page.waitForTimeout(140);
    if (page.url().includes('/scan/')) {
      /* ⚠ Every serialised line, not just line 1. CN-VE-000424 carries three of
         them, and stopping after the first left the load un-sealable — which is
         how this walk found its own bug. */
      for (let i = 0; i < 12; i++) {
        const buttons = page.locator('[data-testid^="scan-"]');
        if ((await buttons.count()) === 0) break;
        await buttons.first().click();
        await page.waitForTimeout(90);
      }
      await page.getByTestId('onward').click();
      await page.waitForTimeout(160);
    }
    has(`handover · ${cid} lands back on the load sheet`, page.url(), '/handover/LD-000377');
  }

  const seal = page.getByTestId('seal');
  eq('handover · sealing is live once every consignment is scanned out', await seal.getAttribute('aria-disabled'), null);
  await seal.click();
  await page.waitForTimeout(140);
  /* ⚠ Once sealed the control is replaced by a statement, not left dimmed. */
  ok('handover · sealing states itself rather than dimming', (await page.getByTestId('sealed').count()) === 1);

  const accept = page.getByTestId('accept');
  eq('handover · accepting is still inert with no signature', await accept.getAttribute('aria-disabled'), 'true');
  has('handover · ...and says so plainly', await accept.innerText(), 'He has not signed yet');

  const canvas = page.getByTestId('signature');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.4, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(90);

  eq('handover · live once he has signed', await accept.getAttribute('aria-disabled'), null);
  await accept.click();
  await page.waitForTimeout(140);
  const t = await screenText();
  has('handover · custody accepted', t, 'Custody accepted');
  has('handover · signed by the driver', t, 'T. Mukanya');
  has('handover · on this tablet, not his', t, 'T118');
  has('handover · the gate pass is raised', t, 'GP-VE-2026-08-20-0021');
  await shot('09-handover-signed');
}

/* ── The load that does not go, and says why ────────────────────────────── */
{
  /* ⚠⚠ LD-000381 is one consignment and that consignment is stopped. The truck
     genuinely does not go — which is the control working, not the demo
     breaking. Before this the blocked scan had no exit at all and the load was
     unreachable: the same dead end, one screen earlier. */
  await resetDesk();
  await page.getByTestId('card-CN-MW-000121').click();
  await page.waitForTimeout(140);
  for (const id of ['description', 'quantity', 'condition']) {
    const cell = page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' });
    if (await cell.count()) await cell.click();
  }
  await page.getByTestId('verify').click();
  await page.waitForTimeout(140);
  await page.getByTestId('scan-1').click();
  await page.waitForTimeout(140);

  const onward = page.getByTestId('onward');
  eq('block · the way on stays inert', await onward.getAttribute('aria-disabled'), 'true');
  has('block · and says who to fetch', await onward.innerText(), 'Blocked — fetch the loading clerk');

  const out = page.getByTestId('to-load');
  ok('block · the clerk can still reach the load', (await out.count()) === 1);
  await out.click();
  await page.waitForTimeout(160);

  const t = await screenText();
  has('blocked load · reached from the block', page.url(), '/handover/LD-000381');
  has('blocked load · says the truck does not go', t, 'This load does not go');
  has('blocked load · names the exception', t, 'EX-000029114');
  hasU('blocked load · names the grant', t, 'Serial Mismatch Override');
  has('blocked load · names who holds it', t, 'Branch manager');
  has('blocked load · the seal control says which reason', await page.getByTestId('seal').innerText(), '1 line blocked');
  await shot('10-load-that-does-not-go');
}

/* ── The collection ─────────────────────────────────────────────────────── */
await go('/collection/COL-VE-2026-08-20-0007/');
{
  const t = await screenText();
  has('collection · the receiver', t, 'Simba Mhlanga');
  hasU('collection · no vehicle', t, 'No vehicle');
  has('collection · the serial bound at a counter', t, '#G-000004776031');
  has('collection · the paper it replaces', t, 'Name of Driver');
  has('collection · the ID slot is a labelled placeholder', t, 'No photograph of an identity document');
  eq('collection · no image inside the tablet', await page.locator('[data-tablet="screen"] img').count(), 0);

  const done = page.getByTestId('complete');
  eq('collection · completion is inert', await done.getAttribute('aria-disabled'), 'true');
  has('collection · ...and names both missing things', await done.innerText(), 'the ID photograph and a signature');
  await page.getByTestId('id-photo').click();
  has('collection · ...then only the signature', await done.innerText(), 'Missing a signature');

  /* ⚠⚠ The signature trap: read the ink back out of the canvas. */
  const canvas = page.getByTestId('signature');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.35, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(90);

  const inkAt = await canvas.evaluate((c) => {
    const d = c.getContext('2d').getImageData(Math.round(c.width * 0.25) - 4, Math.round(c.height * 0.5) - 6, 9, 13).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n;
  });
  ok(`signature · ink lands under the pointer (${inkAt} inked pixels at 25% across)`, inkAt > 0);
  const stray = await canvas.evaluate((c) => {
    const d = c.getContext('2d').getImageData(Math.round(c.width * 0.9) - 4, 0, 9, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n;
  });
  ok(`signature · no ink where the pointer never went (${stray})`, stray === 0);

  eq('collection · live once both are present', await done.getAttribute('aria-disabled'), null);
  await done.click();
  await page.waitForTimeout(140);
  has('collection · the note is raised', await screenText(), 'COL-VE-2026-08-20-0007');
  await shot('07-collection');
}

/* ── The unserialised collection skips the scan ─────────────────────────── */
await go('/consignment/CN-AV-000015/');
{
  for (const id of ['description', 'quantity', 'condition']) {
    await page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' }).click();
  }
  // ⚠ Nothing on it is serialised, so verification goes straight to the customer.
  has('verify · an unserialised job skips the scan', await page.getByTestId('verify').innerText(), 'hand to the customer');
  await page.getByTestId('verify').click();
  await page.waitForURL('**/collection/COL-VE-2026-08-20-0006/**');
  const t = await screenText();
  has('collection · the bedset', t, 'Luxury Supreme Bedset Queen');
  has('collection · says it carries no serial', t, 'Not serialised');
  hasnt('collection · and shows none', t, '#G-0000047760');
  await shot('08-collection-unserialised');
}

/* ── The dropped screen ─────────────────────────────────────────────────── */
{
  expect404 = true;
  const r = await page.goto(BASE + '/exceptions/', { waitUntil: 'networkidle' });
  ok(`the exceptions screen is gone — got ${r.status()}`, r.status() === 404);
  expect404 = false;
}

/* ── Copy rules, inside the tablet only ─────────────────────────────────── */
{
  const routes = ['/', '/board/', '/consignment/CN-VE-000418/', '/scan/CN-VE-000418/', '/handover/LD-000377/', '/collection/COL-VE-2026-08-20-0007/'];
  for (const r of routes) {
    await go(r);
    const t = await screenText();
    for (const b of ['Payment received', 'payment received', 'Skip scan', 'Continue anyway', 'Override anyway']) {
      hasnt(`copy · ${r} says nothing like "${b}"`, t, b);
    }
  }
}

/* ── A hard reload keeps the desk ───────────────────────────────────────── */
{
  await go('/scan/CN-VE-000418/');
  const before = await page.getByTestId('count').innerText();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(220);
  eq('a hard reload keeps the desk', (await page.getByTestId('count').innerText()).trim(), before.trim());
}

ok(`no page or console errors — saw ${errors.length}: ${errors.slice(0, 3).join(' | ')}`, errors.length === 0);

await browser.close();
console.log(`\n${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  FAIL  ${f}`);
console.log(fails.length ? '\nFAIL\n' : '\nOK\n');
process.exit(fails.length ? 1 : 0);
