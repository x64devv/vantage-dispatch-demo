# CLAUDE.md — Vantage Dispatch

**Repo:** `XPOS/vantage-dispatch-demo/`
**What it is:** the demo build of the TVSH **store goods-out tablet**, from
`Transport-Material/design_handoff_dispatch_app/`.
**Deadline:** presentation **Wednesday 26 August 2026**, department heads and directors.
**Last updated:** 21 August 2026 — *six screens built and driven in a real browser, 141 assertions
passing. The projector pass is not done, and nobody has walked beats 1→13 across all three apps.*

---

## 1. What this is, and what it is not

A **six-screen Next.js tablet app**, static export, all state client-side, no server. It is the third
app of a three-app module; its siblings are `XPOS/vantage-transport-console/` (desktop) and
`XPOS/vantage-driver-app/` (phone), both built 20 August.

⚠ **This is a temporary demo build to beat a deadline, and it should stay honest about that.** The
real `:dispatchApp` (Kotlin / Compose Multiplatform) is Task B, in `vantage-lane`, after the 26th —
`design_handoff_dispatch_app/KOTLIN.md`.

**It is not** the real app. No camera, no scanner, no gateway, no Business Central, no auth, no
offline outbox, no permission model. Seeded day only. `README.md` opens with that warning.

⚠ **Unlike its two siblings it has no map, so it has no network dependency at all.** It runs with the
cable out. That is worth knowing on the day.

---

## 2. What it fills

`XPOS/vantage-driver-app/CLAUDE.md` §12, 20 August: *"⚠⚠ **Beats 4, 5 and 6 have no screen.**"* These
are those three.

| Beat | Screen | Route |
|---|---|---|
| **4** | SD-1 the goods-out board | `/board` |
| **5** | SD-2 scan out, and the block | `/scan/LD-000377` then `/scan/LD-000381` |
| **6** | SD-3 a customer collects | `/collection/COL-VE-2026-08-20-0007` |

Plus `/` sign in · `/consignment/[id]` · `/handover/[load]` · `/exceptions`.

⚠⚠ **Beat 7 is still half-built.** *"The driver accepts what the store scanned"* needs `V-05 Accept
custody` at **his** end and the driver app has nine screens, none of which is that. The store half —
`/handover/LD-000377` — is here, and it deliberately **has no signature pad on it**, because the
whole point is that he signs on his own device. **Raise this before the rehearsal.**

---

## 3. ⚠⚠ The data rule — this app produces the driver demo's input

There is one goods-out day and it lives in
`Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json`. `lib/dispatch-day.json` is a
copy that `npm run build` overwrites from it.

```
npm run derive      # rebuild the driver's run from the dispatch day and check it, value by value
```

**Result on 21 August: 147 of 149 derived values found verbatim inside the matching stop of
`vantage-driver-app/lib/run.ts`**, plus 8 fields dispatch holds that the driver's screen does not
model, plus 2 known divergences (§6.1).

⚠ A **new** disagreement fails the script. An **old** one is a decision, on
`scripts/known-divergences.json` with what each side says, why, and who owns closing it. Adding a
line there is a decision with a name on it, not a way to silence the check.

⚠ If `vantage-driver-app/lib/run.ts` is not on disk it exits 2 rather than passing. A derivation with
nothing to check against is not a green light.

⚠ The check was itself checked: changing one serial in `dispatch-day.json` makes it fail on exactly
that line. A check nobody has seen fail is not a check.

---

## 4. ⚠⚠ The four things that must survive implementation

1. **The block, with no skip button.** `app/scan/[load]/ScanView.tsx`. A serial BC does not hold here
   stops the line — not a warning, not a confirm with a *continue anyway*. The override is present,
   dimmed, and **names the grant the clerk does not hold**.
2. **The collection lane is not the minor case.** First on the board, same width as the others.
   Roughly a third of consignments never see a truck.
3. **No signature pad on `D-05`.** The driver accepts on his own terminal. A pad on the store's
   tablet would let one person scan the load *and* accept it, which is the control that is missing
   today.
4. **Two grades of a fact look different.** Scanned vs typed; a bound serial vs a counted quantity.
   Nothing rounds one up to the other.

⚠ And running through all four: **disabled = `opacity: .45` + a label naming what is missing.** Never
a dead control. `components/ui.tsx` `Btn dim`.

---

## 5. Conventions

**Tokens, never literals.** `app/globals.css` is the same Modernist sheet the console and the driver
app ship, unchanged except that Archivo is vendored in `app/fonts/` rather than pulled from Google.
**Radius is 0 everywhere** — the only exception is the tablet bezel, which is hardware.

**Monospace with `tabular-nums` for every figure a hand or a scanner produced** — serials,
quantities, money, times, document numbers, registrations. `MONO` in `components/ui.tsx`. Columns of
figures must not jitter.

**56px minimum touch target** (TRP-002 §4) — a device used standing up, in a stock room, in gloves.
The driver app's 44px is a phone in one hand; this is not that.

**Focus** is `2px solid var(--color-accent)`, offset 2px — never the browser default.

**Selected state is a fill, not a tick.** Accent for the affirmative, ink for the negative. A "no"
being ink rather than red is deliberate: a refusal is not an error.

**No animation** other than instant state change.

⚠ **Copy is part of the design.** `COPY-RULES.md` is spec. Do not paraphrase the block sentence, the
override label, or any of the lines in its §8.

**The tablet is laid out at true 1280 × 800 and scaled by a measured transform.** Nothing inside it
re-flows with the browser window — a design that changes shape on the projector is a different design
from the one that was reviewed.

---

## 6. ⚠ What this build found in the two apps that were already built

None of it was fixed here. **This repo reads the Vantage repos and commits to none.**

### 6.1 Two invented SKUs, where real ones exist ⚠⚠

`vantage-driver-app/lib/run.ts` carries `OB-MP-GB-3019921` (TV bracket) and `OB-MP-GB-3060412` (home
theatre) on invoice 414414, with a comment saying *"the console records the descriptions only, and no
SKU for either exists anywhere in the material"*.

**They do exist.** `Transport-Material/demo/TRANSPORT-DEMO-MOCKUP-PROMPTS.md` §SD-4 lists all three
lines of that consignment with SKUs and prices: `OB-MP-GB-801000067` at 77.06 and
`OB-MP-GB-431520183` at 388.74 — in the same folder as the console's own seed data.

This app uses the real ones. The derivation reports **D1** and **D2** rather than hiding them.
**Wyne's: accept them into the driver fixture (a two-line edit) or say the mockup prompt's SKUs are
not to be trusted either.**

⚠ The lesson generalises and it is one this estate has already paid for: *"no such value exists"* is a
claim about a search, not about the world.

### 6.2 T. Mukanya is on two trips at once ⚠⚠

`vantage-transport-console/lib/data.ts` `LIVE_TRIPS` makes him the driver of trip 03; `RECORD` puts
him on trip 05 carrying invoice 414414. He cannot do both.

**Wyne's call, 21 August: the console wins**, so both strings are kept and neither fixture was
edited. This app only ever claims he **raised** `EX-000029114` at 07:31 — the name on it — which is
true either way. Left open at the console's end.

### 6.3 The mockup prompt's board clock cannot be right ⚠

`SD-1` is specced at **07:40** and lists `CN-VE-000418` as still awaiting our driver. That
consignment's serial was bound at 07:12 and its load sealed at 07:33; a board at 07:40 would already
have let it go. **The board here is at 07:02**, so beat 4 runs before beat 5. Same class of
correction the driver app made to its own handoff's calendar.

### 6.4 Beat 6 as specced shows the collection control WITHOUT a serial ⚠

`SD-3` names Farai Ncube and a Luxury Supreme Bedset Queen — and bed sets are not serialised and
never will be (TRP-004 §7). **Both collections are built**: `COL-…-0006` is Farai's exactly as
specced, `COL-…-0007` is Simba Mhlanga's Hisense fridge from the same board, which binds
`#G-000004776031` at a counter with no truck in it. **Wyne picks which runs on the day.**

### 6.5 The driver's stop-5 freezer is recorded unserialised, and it is probably wrong ⚠⚠

TRP-004 §7 puts fridges inside the serialised set. The driver fixture binds no serial to that Defy
chest freezer, so marking it serialised here would stop the run deriving. It is flagged on the line
in `dispatch-day.json` rather than quietly fixed.

⚠ Note what the derivation **cannot** see: the two fixtures currently *agree*, and they agree on
something that may be false. A check that compares two documents cannot tell you they are both wrong.

### 6.6 Budiriro is Zone E; the console has trip 03 as Zone B ⚠

The suburb is from the mockup prompt, the zone from the console. Both quoted, neither reconciled. It
appears on no dispatch screen.

---

## 7. Build order

| # | Step | Status |
|---|---|---|
| S1 | `dispatch-day.json` — **the data pass, before any screen** | ✅ 14 consignments, 2 loads, 11 binds, 1 exception, 2 collections |
| S2 | `derive-run.mjs` + `known-divergences.json` — the derivation, and the refusal | ✅ 147/149; fails on a mutated serial |
| S3 | Scaffold, tablet frame, rails, `?bare=1`, `localStorage` | ✅ builds and exports 27 static routes |
| S4 | `/` sign in and desk & device | ✅ PIN gate names what is missing |
| S5 | `/board` — SD-1, three lanes, the ageing rows, the foot figures | ✅ lanes measured equal; foot strip measured on screen |
| S6 | `/consignment/[id]` — the pin grade and the attached document | ✅ the invoice is named, not drawn |
| S7 | `/scan/[load]` — SD-2, the four checks, the bind, **the block** | ✅ no skip; override dimmed and named |
| S8 | `/handover/[load]` — seals, gate pass, the other device, the refusal | ✅ no signature pad, and it says why |
| S9 | `/collection/[ref]` — SD-3, both cases | ✅ ink asserted from canvas pixels |
| S10 | `/exceptions` — D-12 | ✅ the console's wording, verbatim |
| S11 | **Demo pass on the real projector, with the other two apps** | ☐ **not done, and it is not optional** |

---

## 8. Traps

- ⚠⚠ **A guard that only blocks the honest case.** `sync-data.mjs` originally exited 2 whenever the
  handoff was not beside this repo — and this repo is pushed to GitHub **on its own**, so that is
  every build server. It failed every Vercel build, which produced no deployment, which is why
  `vantage-dispatch-demo.vercel.app` answered `DEPLOYMENT_NOT_FOUND` rather than anything about a
  build. **The refusal was right about the rule and wrong about the world.** There are three states
  now, not two: handoff present → copy and **pin** the copy's checksum into
  `lib/dispatch-day.sha256`; handoff absent and the pin matches → build, saying so; handoff absent
  and the pin is missing or does not match → refuse. ⚠ The pin is only ever written when the real
  handoff is on disk, so editing the copy alone still fails by name — the control survives, it just
  stopped catching the wrong thing.
- ⚠⚠ **`1fr` is not `minmax(0, 1fr)`.** The board's three lanes were `1fr 1fr 1fr` and a long goods
  description silently widened its own lane — making the **collection lane the narrow one**, which is
  the exact opposite of what that screen exists to say. Found by measuring the computed columns.
  `scripts/verify.mjs` measures them now.
- ⚠⚠ **The running count scrolled off.** With the whole left column in one scroll area, answering the
  four checks pushed the `3 of 13` off the top — and that number is the one thing SD-2 asks to be
  *"large and legible while the tablet moves"*. The count and the camera are now outside the scroll.
  **Found by looking at a screenshot, not by an assertion.** There is a measured assertion now.
- ⚠ **The board's foot figures were below the fold**, because the screen root was `minHeight: 100%`
  inside a scroll container. `height: 100%`, lanes scroll internally.
- ⚠⚠ **The signature canvas.** Backing store 640 × 200, displayed at whatever width the layout gives
  it. **Scale pointer coordinates by `canvas.width / rect.width` on both axes** or the ink lands away
  from the finger. `touch-action: none`. A single tap must leave a dot. `verify.mjs` reads the pixels
  back out — no markup assertion can see this bug.
- ⚠ **`innerText` returns what the stylesheet shouts.** Tags, grades and trail destinations are
  `text-transform: uppercase`, so an assertion on `'Scanned'` fails against `'SCANNED'`. `verify.mjs`
  has `has()` for copy that is read aloud and `hasU()` for labels the design uppercases — and the
  distinction matters, because using the loose one on a boardroom sentence would let a paraphrase
  through.
- ⚠ **Printing an enum on a screen.** `CustomerDelivery` rendered as `CUSTOMERDELIVERY`.
- ⚠ **`out/` does not open from `file://`.** Use `npm start` (`serve.mjs`, zero dependencies, no
  network), copied from the console.
- ⚠⚠ **`output: 'export'` will not emit `/scan/[load]` without `generateStaticParams`.** All three
  dynamic segments declare it; the client view lives in a sibling `…View.tsx`.
- ⚠ **The rails quote sentences the app must never say.** A copy check that reads the whole page will
  find them there and be wrong — `verify.mjs` asserts inside `[data-tablet="screen"]` only. The same
  trap the driver app hit.
- ⚠ **Archivo is vendored.** A demo laptop with no network otherwise falls back to `system-ui` and
  Modernist changes character entirely.

---

## 9. Status — 21 August 2026

| | |
|---|---|
| Handoff written, then built from | ✅ |
| Data pass (§3) before any screen | ✅ |
| Derivation proven to refuse | ✅ mutated a serial, watched it fail |
| Screens built | ✅ 6 of 6 |
| Seen in a real browser | ✅ headless Chromium, and screenshots read by eye |
| Seen on a projector | ☐ **no** |
| Deployed | ⚠ 21 Aug: pushed to `github.com/x64devv/vantage-dispatch-demo`, and **every Vercel build failed** on the guard above. Fixed and proven both ways; **the fix has not been pushed** |

**What was actually run**, on 21 August, in a Linux container:

- `npm install`, `npm run build` — compiles clean, exports **27 static routes**.
- `node scripts/derive-run.mjs --write` — **147 of 149** derived values found verbatim in
  `vantage-driver-app/lib/run.ts`, 8 not modelled by the driver app, 2 known divergences. Then the
  same script run against a deliberately mutated serial, which **failed on exactly that line** —
  because a check nobody has seen fail is not a check.
- `node serve.mjs`, then `node scripts/verify.mjs` — **141 assertions, 141 pass, 0 fail**, covering:
  every route renders with zero page and console errors · the PIN gate naming what is missing · three
  board lanes of **measured** equal width · the ageing row and the 3% penalty · the foot figures
  **measured** to be on screen · the fiscal document named rather than drawn · the pin grade and what
  it is worth · the real §SD-4 SKUs · the four checks gating the bind and saying how many are left ·
  the running count **measured** to survive four taps · typed entry offered as a different grade ·
  the block quoting TRP-004 §4 **verbatim** · no *skip*, no *continue anyway*, anywhere inside the
  tablet · the override inert and naming its grant, on two screens · the seal gate naming what is
  outstanding · **no signature element on the handover screen** · the refusal as a real control ·
  the collection gate naming both missing pieces · **the signature ink read back out of the canvas
  pixels, and no ink where the pointer never went** · the unserialised collection saying so and
  showing no serial · no `<img>` anywhere inside the tablet · the console's exception wording
  verbatim · `?bare=1` dropping the rails · a hard reload keeping the desk.
- The standalone case proven **both ways**, on a copy of this repo with no sibling directory: it
  builds and prints the pinned checksum it verified against, and — with one serial altered in
  `lib/dispatch-day.json` — it **refuses with both digests on screen**. A check nobody has seen fail
  is not a check, and this one had never been seen succeed in the environment that actually runs it.
- Screenshots of all eleven states, **looked at** — which is how the lane-width bug, the scrolling
  count, the below-the-fold foot strip and the `CUSTOMERDELIVERY` enum were found.

**What has NOT been verified:**

- ⚠⚠ **A projector, at the back of a room.** This is S11 and it is the one that will bite. The tablet
  scales to fit, so on a 1920 projector with both rails it renders at about 86% — 10px meta and 1px
  rules at 86% of 1280 is exactly what dies at the back. `?bare=1` exists for it. **Test it at the
  real distance before the day**, and if something is illegible raise it rather than quietly
  restyling the system.
- ⚠⚠ **Beats 1→13 end to end across all three apps.** The three agree on paper and by assertion.
  Nobody has walked the running order with all three open.
- ⚠ **A touchscreen.** The signature takes ink from a mouse and the scaling is asserted from pixels.
  Pointer events cover touch and `touch-action: none` is set, but nobody has signed it with a finger,
  and nobody has tapped a 56px target with a gloved hand.
- ⚠ **Windows.** Built and run on Linux only.
- ⚠ **The Kotlin `:dispatchApp`.** Not started.

*"It builds" is not "it works", and neither of them is "it was legible from the back".*

---

## 10. Still open, and Wyne's to answer

- ⚠⚠ **The two invented SKUs** (§6.1). Accept the real ones into the driver app, or reject both.
- ⚠⚠ **T. Mukanya on two trips** (§6.2). The console's to settle.
- ⚠⚠ **Is the Defy chest freezer 210L serialised?** (§6.5). If yes, it needs a serial here *and* in
  the driver fixture.
- ⚠ **Which collection runs at beat 6** (§6.4) — the specced bedset with no serial, or the fridge
  that binds one. The fridge makes the stronger argument; the bedset is what the prompt says.
- ⚠⚠ **`V-05 Accept custody` in the driver app.** Beat 7 has a store half and no driver half.
- Whether the real tablet blocks a serial it cannot validate offline, or binds it provisionally and
  raises the exception on sync (`KOTLIN.md` §3.2). **Both are defensible and it is not a keyboard
  decision.**
- Anything that would require **inventing a sentence about money**. Bring it to Wyne instead.

---

## 11. Rules inherited from the estate

From `XPOS/CLAUDE.md` §8, and they apply here even though this is a demo.

- **Compile-green and verified are different facts.** Every defect found in the Vantage build so far
  was found by a person using the product. Four of this build's were found by looking at screenshots.
- **Say what is not built, on its face.** A screen that reports work it did not do is the worst defect
  class in this codebase.
- **Never quote a figure you cannot stand behind.** The foot strip says it is a branch total, and the
  fiscal invoice is named rather than drawn.
- **Comment the reasoning, not the mechanics.** ⚠ marks a load-bearing decision; ⚠⚠ marks one that
  will hurt somebody.
- **Verify against the real thing, and say plainly what you have not verified.**
- **Read the record, not the proposal.** §6.1 is that rule with a fresh example: a comment in a
  shipped fixture asserted that a value existed nowhere in the material, and it was two folders away.
