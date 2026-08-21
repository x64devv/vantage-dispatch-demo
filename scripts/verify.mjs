/* verify.mjs — drive the exported app in a real browser and assert.
 *
 *   npm run build && node serve.mjs &   then   npm run verify
 *
 * ⚠⚠ "It builds" is not "it works". Every defect found in the Vantage build so
 * far was found by a person using the product, so this walks the demo the way
 * the demo is walked, clicks the things that will be clicked, and reads values
 * back out of the DOM — including reading pixels back out of the signature
 * canvas, because a signature that draws in the wrong place is invisible to any
 * assertion that only looks at the markup.
 *
 * ⚠ THE COPY CHECKS RUN INSIDE [data-tablet="screen"] ONLY. The demo rails quote
 * sentences the app must never say; a check that read the whole page would find
 * them there and be wrong. Same trap the driver app hit.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4174';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS = 'shots';

let pass = 0;
const fails = [];
const ok = (what, cond) => {
  if (cond) pass++;
  else fails.push(what);
};
const eq = (what, got, want) => ok(`${what} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`, got === want);
const has = (what, hay, needle) => ok(`${what} — missing: ${needle}`, String(hay).includes(needle));
const hasnt = (what, hay, needle) => ok(`${what} — must not contain: ${needle}`, !String(hay).includes(needle));
/* ⚠ Tags, grades and trail destinations are uppercased by the design system, so
   innerText returns them uppercased. Copy that is READ ALOUD is asserted
   verbatim with has(); labels the stylesheet shouts are asserted with hasU(). */
const hasU = (what, hay, needle) =>
  ok(`${what} — missing: ${needle}`, String(hay).toUpperCase().includes(String(needle).toUpperCase()));

mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1800, height: 1150 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(120);
};
const screenText = () => page.locator('[data-tablet="screen"]').innerText();

/* ⚠ "It is on the page" is not "you can see it". Two things scrolled out of the
   tablet in the first browser pass — the running count and the board's own foot
   figures — and no text assertion could tell. This measures. */
async function visible(what, testid) {
  const el = await page.getByTestId(testid).boundingBox();
  const scr = await page.locator('[data-tablet="screen"]').boundingBox();
  const inside = !!el && !!scr && el.y >= scr.y - 1 && el.y + el.height <= scr.y + scr.height + 1;
  ok(`${what} — is on screen without scrolling`, inside);
}
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

/* ── 1. Sign in ─────────────────────────────────────────────────────────── */
await go('/');
{
  const t = await page.locator('body').innerText();
  has('sign-in names the branch', t, 'Village Walk Electrical');
  has('sign-in names the terminal', t, '101 / T118');
  has('sign-in is honest about being a demo', t, 'This is a demo build');
  // ⚠ Disabled means dimmed AND labelled.
  const btn = page.getByTestId('signin');
  eq('sign-in button is inert before a PIN', await btn.getAttribute('aria-disabled'), 'true');
  has('...and says what is missing', await btn.innerText(), 'Enter your PIN');
  for (const d of ['4', '1', '1', '8']) await page.getByRole('button', { name: d, exact: true }).click();
  eq('PIN pad fills', (await page.getByTestId('pin').innerText()).length, 4);
  await shot('01-signin');
  await page.getByTestId('signin').click();
  await page.waitForURL('**/board/**');
}

/* ── 2. The board ───────────────────────────────────────────────────────── */
{
  const t = await screenText();
  has('board · collection lane', t, 'Awaiting collection');
  has('board · driver lane', t, 'Awaiting our driver');
  has('board · carrier lane', t, 'Awaiting a carrier');
  has('board · the counters strip', t, 'waiting 11');
  has('board · the ageing row past 14 days', t, '3% penalty due');
  hasU('board · the cross-store row', t, 'Sold at AV');
  has('board · Nancy is on it', t, 'Nancy Muhoni');
  has('board · the collection that carries a serial', t, 'Simba Mhlanga');

  // ⚠ The collection lane must not be the narrow column. Three equal columns.
  const widths = await page.locator('[data-tablet="screen"] [data-testid^="row-"]').first().evaluate(() => {
    const cols = document.querySelectorAll('[data-tablet="screen"] [style*="grid-template-columns"]');
    const board = [...cols].find((c) => getComputedStyle(c).gridTemplateColumns.split(' ').length === 3);
    return getComputedStyle(board).gridTemplateColumns.split(' ').map((x) => Math.round(parseFloat(x)));
  });
  ok(`board · three lanes of equal width — got ${widths.join(' / ')}`, new Set(widths).size === 1);
  await visible('board · the foot figures', 'counters');
  await shot('02-board');
}

/* ── 3. The consignment, and the fiscal document ────────────────────────── */
await go('/consignment/CN-VE-000418/');
{
  const t = await screenText();
  has('consignment · the fiscal signature', t, 'D498-C19F-E480-D38A');
  has('consignment · the customer reference', t, 'VE01/0033736');
  // ⚠⚠ The rule: attach the invoice, never re-render it. The panel says so.
  has('consignment · the document is named, not drawn', t, 'The PDF as ZIMRA signed it');
  has('consignment · and says why nothing is drawn', t, 'a re-rendered invoice is precisely what the rule forbids');
  // ⚠ The pin grade, and what it means.
  has('consignment · pin grade is the lowest', await page.getByTestId('pin-grade').innerText(), 'Salesperson');
  has('consignment · and says what that is worth', t, 'Nobody has stood on it');
  // The three lines, with the SKUs from the material.
  has('consignment · the television', t, 'OB-MP-GB-301071066');
  has('consignment · the bracket SKU from §SD-4', t, 'OB-MP-GB-801000067');
  has('consignment · the home theatre SKU from §SD-4', t, 'OB-MP-GB-431520183');
  has('consignment · the bound serial', t, '#G-000004791204');
  hasU('consignment · scanned, not typed', t, 'Scanned');
  has('consignment · money at the door is not a balance', t, 'it is not a balance');
  await shot('03-consignment');
}

/* ── 4. Scan out, going well ────────────────────────────────────────────── */
await go('/scan/LD-000377/');
{
  // ⚠ The desk opens mid-scan. Units 1–3 are already bound; an empty sheet at
  //   07:12 would be the lie.
  const count = await page.getByTestId('count').innerText();
  eq('scan · opens mid-load', count.trim(), '3 of 13');
  has('scan · and how many serials are already bound', await screenText(), '4 of 10');
  const t = await screenText();
  has('scan · the last accepted serial', t, '#G-000004779338');
  hasU('scan · the camera is labelled a simulation', t, 'Camera · simulated');
  has('scan · the line in hand is Nancy’s television', t, 'CTV Samsung 85" QA85Q7FAAUXKE');

  // The four checks, four separate answers.
  const scanBtn = page.getByTestId('scan');
  eq('scan · bind is inert before the checks', await scanBtn.getAttribute('aria-disabled'), 'true');
  has('scan · ...and says how many are left', await scanBtn.innerText(), '4 left');
  for (const id of ['description', 'quantity', 'serial', 'condition']) {
    await page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' }).click();
  }
  eq('scan · bind becomes live once all four are answered', await scanBtn.getAttribute('aria-disabled'), null);
  // ⚠⚠ The count must still be there after four taps. It was not, at first.
  await visible('scan · the running count, after answering the checks', 'count');
  await shot('04-scan-checks');

  // ⚠ Assert this BEFORE the bind: afterwards the line in hand is the bracket,
  //   which is unserialised, and the typed-entry control is correctly absent.
  has('scan · typed entry is offered and labelled', await screenText(), 'Type the serial instead — recorded as typed');

  await scanBtn.click();
  await page.waitForTimeout(120);
  const t2 = await screenText();
  has('scan · Nancy’s serial is now bound', t2, '#G-000004791204');
  eq('scan · the count advanced', (await page.getByTestId('count').innerText()).trim(), '4 of 13');
  // The trail row, in the rail, naming where it went.
  const rail = await page.locator('body').innerText();
  hasU('trail · the bind names the consignment line', rail, 'Consignment line · this sale is not on hire-to-buy');
  await shot('05-scan-bound');
}

/* ── 5. The block ───────────────────────────────────────────────────────── */
await go('/scan/LD-000381/');
{
  for (const id of ['description', 'quantity', 'serial', 'condition']) {
    await page.getByTestId(`check-${id}`).getByRole('button', { name: 'Yes' }).click();
  }
  await page.getByTestId('scan').click();
  await page.waitForTimeout(150);
  const t = await screenText();
  // ⚠⚠ Verbatim from TRP-004 §4 and the console. Do not paraphrase.
  has('block · the sentence, verbatim', t, 'This freezer was sold on 21 June and sent to Kwekwe. Fetch the loading clerk before continuing.');
  has('block · the serial', t, '#G-000004652985');
  has('block · the invoice it was sold on', t, '410233');
  has('block · the exception reference the console renders', t, 'EX-000029114');
  has('block · raised at 07:31 by T. Mukanya', t, '07:31');
  has('block · fault is a billing field, chosen from a list', t, 'fault TVSH');
  has('block · the trip is still allowed to leave', t, 'One blocked line does not ground a truck');

  // ⚠⚠ NO SKIP. The override exists, is a separate grant, and is not held.
  hasnt('block · there is no skip', t, 'Skip');
  hasnt('block · and no continue-anyway', t, 'Continue anyway');
  const ov = page.getByTestId('override');
  eq('block · the override is inert', await ov.getAttribute('aria-disabled'), 'true');
  has('block · ...and names the grant that would open it', await ov.innerText(), 'Serial Mismatch Override');
  await shot('06-block');

  // The sheet row for that line reads Blocked, not Waiting.
  hasU('block · the sheet row says blocked', await page.getByTestId('sheet-CN-MW-000121#1').innerText(), 'Blocked');
}

/* ── 6. Hand to the driver ──────────────────────────────────────────────── */
await go('/handover/LD-000377/');
{
  const seal = page.getByTestId('seal');
  // Lines are still outstanding on LD-000377 (the demo bound one of them).
  eq('handover · sealing is inert while lines are outstanding', await seal.getAttribute('aria-disabled'), 'true');
  has('handover · ...and says how many', await seal.innerText(), 'not yet accounted for');
  const t = await screenText();
  has('handover · the seal numbers', t, 'Z-114882');
  has('handover · the second seal', t, 'Z-114883');
  // ⚠⚠ No signature pad on this screen, and the screen says why.
  eq('handover · there is no signature pad here', await page.locator('[data-tablet="screen"] [data-testid="signature"]').count(), 0);
  has('handover · ...and it says why', t, 'He signs on his own phone');
  has('handover · the driver’s half is not built, and it says so', t, 'His half is not built');
  // ⚠ The disagreement is a real control, not a sentence about one.
  hasU('handover · refusal is an available action', t, 'If he will not take it');
  has('handover · ...with reasons from a list', t, 'The count is short — a line is not on the truck');
  await shot('07-handover');
  await page.getByTestId('refuse-the').click();
  await page.waitForTimeout(100);
  has('handover · a refusal is recorded where both people are standing', await screenText(), 'Refused at the door');
  has('handover · ...and the goods do not travel', await screenText(), 'The goods stay in this building');
}

/* ── 7. The collection that carries a serial ────────────────────────────── */
await go('/collection/COL-VE-2026-08-20-0007/');
{
  const t = await screenText();
  has('collection · the receiver', t, 'Simba Mhlanga');
  has('collection · the ID number', t, '63-1774209-M-18');
  hasU('collection · no vehicle', t, 'No vehicle');
  has('collection · the serial bound at a counter', t, '#G-000004776031');
  has('collection · the write it makes', t, 'Vantage Trans. Sales Entry');
  has('collection · the paper it replaces', t, 'Name of Driver');
  // ⚠⚠ No photograph of an identity document anywhere.
  has('collection · the ID slot is a labelled placeholder', t, 'No photograph of an identity document, real or stock');
  eq('collection · no image element inside the tablet', await page.locator('[data-tablet="screen"] img').count(), 0);

  const done = page.getByTestId('complete');
  eq('collection · completion is inert', await done.getAttribute('aria-disabled'), 'true');
  has('collection · ...and names both missing things', await done.innerText(), 'the ID photograph and a signature');
  await page.getByTestId('id-photo').click();
  has('collection · ...then only the signature', await done.innerText(), 'Missing a signature');

  /* ⚠⚠ The signature trap: read the ink back out of the canvas and check it
     landed where the pointer went. A backing store of 640×200 displayed at ~390
     CSS px means an unscaled implementation puts the ink ~1.6× too far right. */
  const canvas = page.getByTestId('signature');
  const box = await canvas.boundingBox();
  const px = box.x + box.width * 0.25;
  const py = box.y + box.height * 0.5;
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.35, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  const inkAt = await canvas.evaluate((c, frac) => {
    const ctx = c.getContext('2d');
    const x = Math.round(c.width * frac);
    // scan a 9px band around the vertical middle
    const d = ctx.getImageData(x - 4, Math.round(c.height * 0.5) - 6, 9, 13).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    return n;
  }, 0.25);
  ok(`signature · ink lands under the pointer (found ${inkAt} inked pixels at 25% across)`, inkAt > 0);

  const strayAt = await canvas.evaluate((c) => {
    const ctx = c.getContext('2d');
    // 90% across: nothing was drawn there. Ink here means the scaling is wrong.
    const d = ctx.getImageData(Math.round(c.width * 0.9) - 4, 0, 9, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    return n;
  });
  ok(`signature · no ink where the pointer never went (found ${strayAt})`, strayAt === 0);

  eq('collection · completion is live once both are present', await done.getAttribute('aria-disabled'), null);
  await done.click();
  await page.waitForTimeout(120);
  has('collection · the note is raised', await screenText(), 'Collection note COL-VE-2026-08-20-0007');
  has('trail · the counter bind names its destination', await page.locator('body').innerText(), 'no truck involved');
  await shot('08-collection');
}

/* ── 8. The collection that carries none ────────────────────────────────── */
await go('/collection/COL-VE-2026-08-20-0006/');
{
  const t = await screenText();
  has('collection · the bedset', t, 'Luxury Supreme Bedset Queen');
  // ⚠ It says the control ran WITHOUT a serial rather than implying one.
  has('collection · says plainly that nothing here is serialised', t, 'Nothing on this consignment is serialised');
  has('collection · and points at the one that is', t, 'CN-BR-000028');
  hasnt('collection · no serial is shown on an unserialised collection', t, '#G-0000047760');
  await shot('09-collection-unserialised');
}

/* ── 9. Exceptions ──────────────────────────────────────────────────────── */
await go('/exceptions/');
{
  const t = await screenText();
  has('exceptions · the reference', t, 'EX-000029114');
  // ⚠ Verbatim from the console's own EXCEPTIONS[0].expanded.
  has('exceptions · the console’s wording', t, 'Serial #G-000004652985 scanned onto trip 03; the trail says it left Kwekwe on 24 June. The load is held.');
  has('exceptions · the grant, named', t, 'Serial Mismatch Override');
  has('exceptions · the first month is explained in advance', t, 'That is the system working');
  has('exceptions · what is not built is named', t, 'Neither is built here');
  eq('exceptions · the override here is inert too', await page.getByTestId('override-here').getAttribute('aria-disabled'), 'true');
  await shot('10-exceptions');
}

/* ── 10. Copy rules, inside the tablet only ─────────────────────────────── */
{
  const routes = ['/', '/board/', '/consignment/CN-VE-000418/', '/scan/LD-000377/', '/scan/LD-000381/', '/handover/LD-000377/', '/collection/COL-VE-2026-08-20-0007/', '/exceptions/'];
  const banned = ['Payment received', 'payment received', 'Skip scan', 'Skip this', 'Continue anyway', 'Override anyway'];
  for (const r of routes) {
    await go(r);
    const t = await screenText();
    for (const b of banned) hasnt(`copy · ${r} says nothing like "${b}"`, t, b);
  }
}

/* ── 11. The projector switch, and a hard reload ────────────────────────── */
{
  await go('/board/?bare=1');
  const railCount = await page.locator('text=What this design assumes').count();
  eq('?bare=1 drops the rails', railCount, 0);
  await shot('11-bare');

  await go('/scan/LD-000377/');
  const before = await page.getByTestId('count').innerText();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const after = await page.getByTestId('count').innerText();
  eq('a hard reload keeps the desk', after.trim(), before.trim());
}

/* ── 12. Nothing threw ──────────────────────────────────────────────────── */
ok(`no page or console errors — saw ${errors.length}: ${errors.slice(0, 3).join(' | ')}`, errors.length === 0);

await browser.close();

console.log(`\n${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  FAIL  ${f}`);
console.log(fails.length ? '\nFAIL\n' : '\nOK\n');
process.exit(fails.length ? 1 : 0);
