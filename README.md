# Vantage Dispatch — demo build

> ⚠⚠ **This is a temporary demo, not the product.** No camera, no scanner, no Business Central, no
> gateway, no authentication, no offline outbox. The day is seeded and nothing here posts anywhere.
> The real `:dispatchApp` is Kotlin Multiplatform in `vantage-lane`, after 26 August — see
> `Transport-Material/design_handoff_dispatch_app/KOTLIN.md`.

The **store goods-out tablet** for TVSH Transport: beats 4, 5 and 6 of the thirteen-beat running
order for the presentation on Wednesday 26 August 2026.

One linear flow, one job at a time:

```
/board  →  tap a card  →  /consignment/[id]   verify
                       →  /scan/[id]          a Scan button on every serialised line
                       →  /handover/[load]    or /collection/[ref]
``` Its siblings are
`../vantage-transport-console/` (the planner's desktop) and `../vantage-driver-app/` (the driver's
phone).

---

## Run it

```sh
npm install
npm run build      # syncs the day from the handoff, then next build --output export
npm start          # http://localhost:4174/   (zero-dependency static server, no network)
```

⚠ **`out/` does not open from `file://`.** Next writes absolute `/_next/…` paths, so the stylesheet
and the JavaScript never load. `npm start` runs `serve.mjs`, which is Node's own `http` module and
nothing else — it works on a demo laptop with no network and no `npx`.

⚠ There are no demo rails any more — the internal review took them out on 21 August, along with the
live record trail. The tablet fills the window and scales up to 1.5× its design pixels, which is
where most of the legibility came from.

### Deploy it

This repo is pushed to GitHub on its own, so **the handoff is not beside it on a build server.**
`lib/dispatch-day.json` is committed together with `lib/dispatch-day.sha256`, which is written only
ever from the real handoff — so a standalone build verifies the copy against its pin and says so:

```
dispatch-day.json — the handoff is not in this checkout (standalone build).
  The pinned copy matches its recorded checksum 1096486c03d4…, so it is the
  same bytes that were checked against vantage-driver-app/lib/run.ts. Building.
```

⚠⚠ **Edit `lib/dispatch-day.json` directly and the next build refuses**, because the pin can only be
rewritten when the real handoff is on disk. That is the point: an edit that has never been checked
against the driver app must not reach a deployment.

Vercel needs no configuration — it detects Next.js and runs `npm run build`. No environment
variables, no root-directory setting, no `vercel.json`. Nothing here calls the network at runtime.

### Check it

```sh
npm run derive     # rebuild the driver app's run from the dispatch day, and refuse if they disagree
npm run verify     # drive the exported app in a real browser and assert (needs npm start running)
```

`npm run verify` needs Playwright and a Chromium; set `CHROME=/path/to/chrome` if it cannot find one.

---

## What is in here

| | |
|---|---|
| `lib/dispatch-day.json` | ⚠ a **copy**. The one that counts is `../Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json`, and `npm run build` overwrites this from it |
| `lib/dispatch-day.sha256` | ⚠⚠ the copy's pin, written only from the real handoff. It is what makes a standalone build honest rather than merely possible |
| `lib/day.ts` | that file, typed, with the lookups the screens use |
| `lib/state.tsx` | the desk, in `localStorage`. A hard reload must not lose it |
| `app/globals.css` | the Modernist sheet, as shipped by the console and the driver app |
| `app/fonts/` | Archivo, vendored. ⚠ A laptop with no network otherwise falls back to `system-ui` and the whole thing changes character |
| `scripts/derive-run.mjs` | ⭐ the derivation, and the check that refuses |
| `scripts/verify.mjs` | 108 browser assertions, including reading ink back out of the signature canvas and measuring that the tablet renders larger than its design width |
| `shots/` | screenshots from the last verify run |

**Five screens:** `/` sign in · `/board` two tabs of cards · `/consignment/[id]` verify ·
`/scan/[id]` the scan and the block · `/handover/[load]` and `/collection/[ref]`.

`Transport-Material/design_handoff_dispatch_app/SCREENS.md` specifies each one. `CLAUDE.md` in this
directory records what was actually run and what was not.

---

## The one thing to know before changing anything

**This app produces the driver demo's input.** Every stop, consignment, seal and serial in
`../vantage-driver-app/lib/run.ts` originates in `dispatch-day.json`, and `npm run derive` fails if
somebody edits one end only. If it fails, something upstream moved — fix it, or put the disagreement
on `scripts/known-divergences.json` with a reason and a name. **Do not silence it.**
