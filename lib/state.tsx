'use client';

/* The desk, held on the tablet.
 *
 * No backend, no auth, no database — client state persisted to localStorage.
 * ⚠ A hard reload must not lose the desk. Someone will refresh the browser
 * mid-demo, or the projector will renegotiate and Chrome will reload the tab.
 *
 * ⚠⚠ THE FLOW IS ONE CONSIGNMENT AT A TIME, and it is linear:
 *
 *     board  →  verify  →  scan out (only if a line is serialised)  →  hand over
 *
 * That is how a goods-out desk actually works: somebody wheels one job to the
 * counter, you check it, you scan what carries a serial, and you give it to
 * whoever is taking it. The earlier build scanned a whole truck's worth of lines
 * on one screen, which is a spreadsheet, not a desk.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DAY, consignment, exceptionFor, unitsFor, type CapturedBy, type Consignment } from './day';

/** ⚠ Three checks a person can make by looking, before anything is scanned:
 *  description, quantity, condition. The fourth — the serial — is the scan
 *  itself, and it cannot be answered by looking, so it is the next screen
 *  rather than a fourth tick on this one. */
export type CheckId = 'description' | 'quantity' | 'condition';

export const CHECKS: { id: CheckId; label: string; hint: string }[] = [
  { id: 'description', label: 'The right goods', hint: 'Model number off the box, not off the screen.' },
  { id: 'quantity', label: 'The right count', hint: 'A short load found here costs nothing.' },
  { id: 'condition', label: 'Undamaged', hint: 'Screen, glass, panels and feet.' },
];

export type ScanRow = {
  key: string;
  consignment: string;
  lineNo: number;
  serials: { serial: string; capturedBy: CapturedBy }[];
  blocked: boolean;
};

/** ⚠ The board shows two of the three lanes. `carrier` is in the data and has no
 *  tab — named as not built rather than deleted. */
export type BoardTab = 'collection' | 'ourDriver';

export type DeskState = {
  signedIn: boolean;
  /** which board tab is showing */
  tab: BoardTab;
  /** the three looking-checks, per consignment */
  checks: Record<string, Partial<Record<CheckId, 'yes' | 'no'>>>;
  /** consignments whose verification is complete */
  verified: Record<string, boolean>;
  /** scan rows, keyed `${consignment}#${lineNo}` */
  rows: Record<string, ScanRow>;
  /** consignments where a scan was blocked, and the exception ref raised */
  blocked: Record<string, string>;
  sealed: Record<string, boolean>;
  /** ⚠ The driver's signature, captured HERE. See the note on handOver below. */
  handoverSigInk: Record<string, boolean>;
  handedOver: Record<string, boolean>;
  collectionsDone: Record<string, boolean>;
  collectionSigInk: Record<string, boolean>;
  collectionIdPhoto: Record<string, boolean>;
};

/* ⚠ The desk opens part-way through the morning, not empty. Stops 1–3 of
 * LD-000377 were scanned out between 07:04 and 07:10 — an empty board at 07:12
 * would be the lie. Those three are verified and bound; everything else waits. */
const ALREADY_DONE = ['CN-VE-000402', 'CN-VE-000407', 'CN-VE-000411'];

function seed(): Pick<DeskState, 'rows' | 'verified' | 'checks'> {
  const rows: Record<string, ScanRow> = {};
  const verified: Record<string, boolean> = {};
  const checks: DeskState['checks'] = {};

  for (const c of DAY.consignments) {
    for (const l of c.lines) {
      rows[`${c.id}#${l.no}`] = {
        key: `${c.id}#${l.no}`,
        consignment: c.id,
        lineNo: l.no,
        serials: [],
        blocked: false,
      };
    }
  }
  for (const cid of ALREADY_DONE) {
    verified[cid] = true;
    checks[cid] = { description: 'yes', quantity: 'yes', condition: 'yes' };
    const c = consignment(cid)!;
    for (const l of c.lines) {
      rows[`${cid}#${l.no}`].serials = unitsFor(cid, l.no).map((s) => ({
        serial: s.serial,
        capturedBy: s.capturedBy,
      }));
    }
  }
  return { rows, verified, checks };
}

export const initialState = (): DeskState => ({
  signedIn: false,
  tab: 'ourDriver',
  blocked: {},
  sealed: {},
  handoverSigInk: {},
  handedOver: {},
  collectionsDone: {},
  collectionSigInk: {},
  collectionIdPhoto: {},
  ...seed(),
});

const KEY = 'vantage-dispatch-desk-v2';

type Ctx = {
  s: DeskState;
  set: (patch: Partial<DeskState>) => void;
  reset: () => void;
  ready: boolean;
  answer: (cid: string, id: CheckId, v: 'yes' | 'no') => void;
  verify: (cid: string) => void;
  scanLine: (cid: string, lineNo: number, capturedBy: CapturedBy) => void;
  sealLoad: (loadId: string) => void;
  handOver: (loadId: string) => void;
  completeCollection: (ref: string) => void;
};

const DeskCtx = createContext<Ctx | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<DeskState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initialState(), ...(JSON.parse(raw) as DeskState) });
    } catch {
      /* A corrupt or unavailable store is not an error worth showing a clerk. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* Private mode or a locked-down tablet. Nothing on screen claims otherwise. */
    }
  }, [s, ready]);

  const set: Ctx['set'] = (patch) => setS((prev) => ({ ...prev, ...patch }));

  const answer: Ctx['answer'] = (cid, id, v) =>
    setS((prev) => ({ ...prev, checks: { ...prev.checks, [cid]: { ...prev.checks[cid], [id]: v } } }));

  const verify: Ctx['verify'] = (cid) => setS((prev) => ({ ...prev, verified: { ...prev.verified, [cid]: true } }));

  /* ⚠⚠ The bind. A physical unit becomes attached to a customer, here, at the
     door — never at the till, because a cashier picking from a list of what the
     system thinks is on the shelf is what makes serials untrustworthy.
     ⚠ On CN-MW-000121 the picker has brought a unit Business Central holds as
     sold. It stops. */
  const scanLine: Ctx['scanLine'] = (cid, lineNo, capturedBy) =>
    setS((prev) => {
      const ex = DAY.exceptions.find((e) => e.consignment === cid && e.line === lineNo);
      const key = `${cid}#${lineNo}`;
      const row = prev.rows[key];
      if (!row || row.blocked) return prev;

      if (ex) {
        return {
          ...prev,
          blocked: { ...prev.blocked, [cid]: ex.ref },
          rows: { ...prev.rows, [key]: { ...row, blocked: true } },
        };
      }
      const next = unitsFor(cid, lineNo)[row.serials.length];
      if (!next) return prev;
      return {
        ...prev,
        rows: { ...prev.rows, [key]: { ...row, serials: [...row.serials, { serial: next.serial, capturedBy }] } },
      };
    });

  const sealLoad: Ctx['sealLoad'] = (loadId) =>
    setS((prev) => ({ ...prev, sealed: { ...prev.sealed, [loadId]: true } }));

  /* ⚠⚠ THE DRIVER SIGNS ON THIS TABLET. Wyne's call, 24 Aug. TRP-002 §1.3 wants
     the receiving side to accept on his OWN device — but the driver app has nine
     screens and none of them is `V-05 Accept custody`, so that device does not
     exist yet. A screen claiming he signed on D204 would be reporting a control
     nobody has built, which is the worst defect class in this codebase. One
     tablet, two signatures, one demo that is true end to end. The two-device
     split is the target in KOTLIN.md, not a fact on a screen. */
  const handOver: Ctx['handOver'] = (loadId) =>
    setS((prev) => ({ ...prev, handedOver: { ...prev.handedOver, [loadId]: true } }));

  const completeCollection: Ctx['completeCollection'] = (ref) =>
    setS((prev) => ({ ...prev, collectionsDone: { ...prev.collectionsDone, [ref]: true } }));

  const reset = () => {
    setS(initialState());
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  };

  return (
    <DeskCtx.Provider
      value={{ s, set, reset, ready, answer, verify, scanLine, sealLoad, handOver, completeCollection }}
    >
      {children}
    </DeskCtx.Provider>
  );
}

export function useDesk() {
  const c = useContext(DeskCtx);
  if (!c) throw new Error('useDesk outside DeskProvider');
  return c;
}

/* ── Where a consignment is, in one word ──────────────────────────────────
   ⚠ Four states and no more. A board that carries a dozen shades of progress
   is a board nobody reads across a room. */
export type Stage = 'Waiting' | 'Verified' | 'Scanned' | 'Blocked' | 'Gone';

export function stageOf(s: DeskState, c: Consignment): Stage {
  if (s.blocked[c.id]) return 'Blocked';
  if (c.load && s.handedOver[c.load]) return 'Gone';
  const col = DAY.collections.find((x) => x.consignment === c.id);
  if (col && s.collectionsDone[col.ref]) return 'Gone';
  if (scanComplete(s, c)) return 'Scanned';
  if (s.verified[c.id]) return 'Verified';
  return 'Waiting';
}

export const checksAnswered = (s: DeskState, cid: string) =>
  CHECKS.filter((c) => s.checks[cid]?.[c.id]).length;

export const anyCheckNo = (s: DeskState, cid: string) =>
  CHECKS.some((c) => s.checks[cid]?.[c.id] === 'no');

/** Every serialised line has as many serials bound as it has units. */
export function scanComplete(s: DeskState, c: Consignment) {
  if (!s.verified[c.id]) return false;
  return c.lines
    .filter((l) => l.serialised)
    .every((l) => (s.rows[`${c.id}#${l.no}`]?.serials.length ?? 0) >= l.qty);
}

export const hasSerialisedLine = (c: Consignment) => c.lines.some((l) => l.serialised);

export function scanTally(s: DeskState, c: Consignment) {
  const units = c.lines.filter((l) => l.serialised).reduce((n, l) => n + l.qty, 0);
  const bound = c.lines.reduce((n, l) => n + (s.rows[`${c.id}#${l.no}`]?.serials.length ?? 0), 0);
  return { bound, units };
}

/** ⚠ The load can be sealed when every consignment on it has been scanned out
 *  and nothing on it is blocked. Dimmed controls say which of the two it is. */
export function loadReady(s: DeskState, loadId: string) {
  /* ⚠ In load-unit order. Unsorted, the sheet listed unit 4 above unit 1, which
     is the one thing a load sheet may not do. */
  const cs = DAY.consignments
    .filter((c) => c.load === loadId)
    .sort((a, b) => (a.loadUnit ?? 0) - (b.loadUnit ?? 0));
  const outstanding = cs.filter((c) => !scanComplete(s, c));
  const blocked = cs.filter((c) => s.blocked[c.id]);
  return { cs, outstanding, blocked, ok: outstanding.length === 0 && blocked.length === 0 };
}
