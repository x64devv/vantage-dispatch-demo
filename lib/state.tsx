'use client';

/* The desk, held on the tablet.
 *
 * No backend, no auth, no database — client state persisted to localStorage.
 * ⚠ A hard reload must not lose the desk. Someone will refresh the browser
 * mid-demo, or the projector will renegotiate and Chrome will reload the tab.
 *
 * ⚠⚠ The dispatch tablet is ONLINE and the driver's phone is not. That asymmetry
 * is real and is the point: the store is on the shop's wifi, the driver is in a
 * truck. So this app's records leave immediately and say "Sent"; the driver's
 * queue and say "Queued". One estate, two honest states, never one blanket
 * offline mode.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DAY, consignmentsOnLoad, exceptionFor, serialsFor, type CapturedBy } from './day';

export type TrailState = 'Sent' | 'Bound' | 'Blocked' | 'Held';

export type TrailEntry = {
  ref: string;
  /** what was captured, in plain words */
  detail: string;
  /** ⚠ where it went. Every record names its destination. */
  dest: string;
  state: TrailState;
};

/** One row of the scan sheet: a consignment line, and what has happened to it. */
export type ScanRow = {
  key: string;
  consignment: string;
  lineNo: number;
  desc: string;
  sku: string;
  qty: number;
  serialised: boolean;
  unit: number;
  /** serials bound so far on this line */
  serials: { serial: string; capturedBy: CapturedBy }[];
  /** unserialised lines: confirmed by quantity and condition instead */
  qtyConfirmed: boolean;
  condition: 'Good' | 'Damaged' | null;
  conditionPhoto: boolean;
  blocked: boolean;
};

export type CheckId = 'description' | 'quantity' | 'serial' | 'condition';

/** ⚠ TRP-001 §6.1: four SEPARATE recorded answers, not one "checked" tick. The
 *  Fleet Manager SOP asks for all four at the load; the Loading Clerk's own
 *  warehouse check omits the serial entirely, which is why the highest-volume
 *  path in the business has the weakest check written down. */
export const CHECKS: { id: CheckId; label: string; hint: string }[] = [
  { id: 'description', label: 'Description matches the line', hint: 'Read the model number off the box, not off the screen.' },
  { id: 'quantity', label: 'Quantity matches the line', hint: 'Count it. A short load found here costs nothing; found at a door it costs a day.' },
  { id: 'serial', label: 'Serial captured', hint: 'Scanned from the unit itself. Typed is recorded as typed.' },
  { id: 'condition', label: 'Condition recorded', hint: 'Anything other than Good makes the photograph mandatory.' },
];

export type DeskState = {
  signedIn: boolean;
  /** rows keyed by `${consignment}#${lineNo}` */
  rows: Record<string, ScanRow>;
  /** the four checks for the line currently in hand, on the scan screen */
  checks: Partial<Record<CheckId, 'yes' | 'no'>>;
  /** which line the scan screen has in hand */
  focus: string | null;
  blockedOn: string | null;
  sealed: Record<string, boolean>;
  handedOver: Record<string, boolean>;
  driverSigInk: boolean;
  collectionsDone: Record<string, boolean>;
  collectionSigInk: Record<string, boolean>;
  collectionIdPhoto: Record<string, boolean>;
  trail: TrailEntry[];
};

const LOAD = 'LD-000377';
const SECOND = 'LD-000381';

/** ⚠ The desk opens mid-scan, not empty. LD-000377 started at 07:04 and the
 *  demo picks it up at 07:12 with Nancy's television in hand — the first three
 *  units are already bound. An empty sheet at 07:12 would be the lie. */
function seedRows(): Record<string, ScanRow> {
  const rows: Record<string, ScanRow> = {};
  for (const loadId of [LOAD, SECOND]) {
    for (const c of consignmentsOnLoad(loadId)) {
      for (const l of c.lines) {
        rows[`${c.id}#${l.no}`] = {
          key: `${c.id}#${l.no}`,
          consignment: c.id,
          lineNo: l.no,
          desc: l.desc,
          sku: l.sku,
          qty: l.qty,
          serialised: l.serialised,
          unit: c.loadUnit ?? 0,
          serials: [],
          qtyConfirmed: false,
          condition: null,
          conditionPhoto: false,
          blocked: false,
        };
      }
    }
  }
  /* Units 1–3 of LD-000377 are done: stops 1, 2 and 3 were scanned 07:04–07:10. */
  for (const cid of ['CN-VE-000402', 'CN-VE-000407', 'CN-VE-000411']) {
    const c = consignmentsOnLoad(LOAD).find((x) => x.id === cid)!;
    for (const l of c.lines) {
      const r = rows[`${cid}#${l.no}`];
      r.serials = serialsFor(cid, l.no).map((s) => ({ serial: s.serial, capturedBy: s.capturedBy }));
      r.qtyConfirmed = true;
      r.condition = 'Good';
      r.conditionPhoto = serialsFor(cid, l.no).some((s) => s.conditionPhoto);
    }
  }
  return rows;
}

const seedTrail = (): TrailEntry[] => [
  {
    ref: 'SA-000091441',
    detail: 'Stop 1 · Defy 4-plate stove · #G-000004778112 scanned onto LD-000377 / 1, condition Good, photographed',
    dest: 'Consignment line · Vantage Trans. Sales Entry',
    state: 'Bound',
  },
  {
    ref: 'SA-000091442 … 44',
    detail: 'Stop 2 · Hisense 43" A4H × 3 · three serials scanned onto LD-000377 / 2',
    dest: 'Consignment line · one row per unit',
    state: 'Bound',
  },
];

export const initialState = (): DeskState => ({
  signedIn: false,
  rows: seedRows(),
  checks: {},
  focus: null,
  blockedOn: null,
  sealed: {},
  handedOver: {},
  driverSigInk: false,
  collectionsDone: {},
  collectionSigInk: {},
  collectionIdPhoto: {},
  trail: seedTrail(),
});

const KEY = 'vantage-dispatch-desk-v1';

type Ctx = {
  s: DeskState;
  set: (patch: Partial<DeskState> | ((s: DeskState) => Partial<DeskState>)) => void;
  reset: () => void;
  ready: boolean;
  bindSerial: (rowKey: string, serial: string, capturedBy: CapturedBy) => void;
  confirmQty: (rowKey: string) => void;
  setCondition: (rowKey: string, condition: 'Good' | 'Damaged') => void;
  takeConditionPhoto: (rowKey: string) => void;
  blockLine: (loadId: string) => void;
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
      const rawState = localStorage.getItem(KEY);
      if (rawState) setS({ ...initialState(), ...(JSON.parse(rawState) as DeskState) });
    } catch {
      /* A corrupt or unavailable store is not an error worth showing a clerk;
         the desk simply starts from the top. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* Private mode, quota, or a locked-down tablet. The demo still runs; it
         just will not survive a reload. Nothing on screen claims otherwise. */
    }
  }, [s, ready]);

  const set: Ctx['set'] = (patch) =>
    setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));

  const push = (prev: DeskState, entry: TrailEntry) => [entry, ...prev.trail];

  /* ── The bind ─────────────────────────────────────────────────────────
     ⚠⚠ This is the act the whole module rests on: a physical unit becomes
     attached to a customer. It writes the consignment line always, and the HTB
     contract line only when there IS one — `Vantage HTB Contract Line."Serial
     No."`, declared in the codebase and never once populated by shipped code,
     because VantageContractBuilder.AddLine has no caller. A cash sale has no
     contract line and the trail row says so out loud instead of going quiet. */
  const bindSerial: Ctx['bindSerial'] = (rowKey, serial, capturedBy) =>
    setS((prev) => {
      const r = prev.rows[rowKey];
      if (!r || r.serials.some((x) => x.serial === serial)) return prev;
      const c = DAY.consignments.find((x) => x.id === r.consignment)!;
      const rows = {
        ...prev.rows,
        [rowKey]: {
          ...r,
          serials: [...r.serials, { serial, capturedBy }],
          condition: r.condition ?? 'Good',
        },
      };
      const dest = c.htb
        ? 'Consignment line + HTB contract line'
        : 'Consignment line · this sale is not on hire-to-buy';
      return {
        ...prev,
        rows,
        trail: push(prev, {
          ref: `SERIAL ${serial}`,
          detail:
            `${r.desc} · bound to ${r.consignment} line ${r.lineNo}, load unit ${c.load} / ${r.unit} · ` +
            `${capturedBy === 'Scanned' ? 'scanned' : 'typed'}, not ${capturedBy === 'Scanned' ? 'typed' : 'scanned'}`,
          dest,
          state: 'Bound',
        }),
      };
    });

  const confirmQty: Ctx['confirmQty'] = (rowKey) =>
    setS((prev) => {
      const r = prev.rows[rowKey];
      if (!r || r.qtyConfirmed) return prev;
      return {
        ...prev,
        rows: { ...prev.rows, [rowKey]: { ...r, qtyConfirmed: true, condition: r.condition ?? 'Good' } },
        trail: push(prev, {
          ref: `QTY ${r.consignment} / ${r.lineNo}`,
          /* ⚠ An unserialised line is confirmed by quantity and condition. The
             screen says which control it got, so nobody later reads a quantity
             confirmation as if a serial had been scanned. */
          detail: `${r.desc} · ${r.qty} confirmed by count · this line is not serialised, so no serial gate applies`,
          dest: 'Consignment line · quantity and condition',
          state: 'Sent',
        }),
      };
    });

  const setCondition: Ctx['setCondition'] = (rowKey, condition) =>
    setS((prev) => {
      const r = prev.rows[rowKey];
      if (!r) return prev;
      return { ...prev, rows: { ...prev.rows, [rowKey]: { ...r, condition } } };
    });

  const takeConditionPhoto: Ctx['takeConditionPhoto'] = (rowKey) =>
    setS((prev) => {
      const r = prev.rows[rowKey];
      if (!r) return prev;
      return {
        ...prev,
        rows: { ...prev.rows, [rowKey]: { ...r, conditionPhoto: true } },
        trail: push(prev, {
          ref: `LOAD-PHOTO ${r.consignment} / ${r.lineNo}`,
          /* ⚠⚠ TRP-001 §6.6.2: the photograph at the door proves the state the
             goods arrived in. Only a PAIR answers "was that dent ours?" — and the
             load photograph is the half nobody asks for. It is also the Scratched
             /Damaged Form digitised, which protects the crew, not just TVSH. */
          detail: `${r.desc} · condition ${r.condition ?? 'Good'}, photographed before loading`,
          dest: 'PROOF_MEDIA · evidence proxy sent, full resolution on wifi',
          state: 'Held',
        }),
      };
    });

  /* ⚠⚠ The block. Not a warning, not a confirm dialog with a "continue anyway".
     The line stops, an Exception is raised with a name on it, and it is on the
     console's queue ageing before the clerk has put the tablet down. */
  const blockLine: Ctx['blockLine'] = (loadId) =>
    setS((prev) => {
      const ex = exceptionFor(loadId);
      if (!ex || prev.blockedOn === loadId) return prev;
      const key = `${ex.consignment}#${ex.line}`;
      return {
        ...prev,
        blockedOn: loadId,
        rows: { ...prev.rows, [key]: { ...prev.rows[key], blocked: true } },
        trail: push(prev, {
          ref: ex.ref,
          detail: `${ex.title} · ${ex.serial} · ${ex.detail} · raised ${ex.raisedAt} by ${ex.raisedBy.name} · fault ${ex.fault}`,
          dest: 'Exceptions queue, ageing · fault TVSH',
          state: 'Blocked',
        }),
      };
    });

  const sealLoad: Ctx['sealLoad'] = (loadId) =>
    setS((prev) => {
      if (prev.sealed[loadId]) return prev;
      const l = DAY.loads.find((x) => x.id === loadId)!;
      return {
        ...prev,
        sealed: { ...prev.sealed, [loadId]: true },
        trail: push(prev, {
          ref: `SEALS ${l.seals.join(' · ')}`,
          detail: `${loadId} closed and sealed at ${l.sealedAt ?? '—'} · witnessed by ${l.handover?.sealFormSignedBy.join(' and ') ?? 'the clerk'}`,
          dest: 'Load · custody moves to the transit bin',
          state: 'Sent',
        }),
      };
    });

  /* ⚠⚠ Two people, two devices, one serial. The store issues on T118; the driver
     accepts on D204 and countersigns. Today the driver verifies his own load. */
  const handOver: Ctx['handOver'] = (loadId) =>
    setS((prev) => {
      if (prev.handedOver[loadId]) return prev;
      const l = DAY.loads.find((x) => x.id === loadId)!;
      return {
        ...prev,
        handedOver: { ...prev.handedOver, [loadId]: true },
        trail: push(prev, {
          ref: l.gatePass ?? `GP-${loadId}`,
          detail:
            `${loadId} handed to ${l.driver.name} on ${l.handover?.acceptedOn} at ${l.handover?.acceptedAt} · ` +
            `issued by ${l.handover?.issuedBy} on ${l.handover?.issuedOn} · two devices, one serial`,
          dest: 'Gate pass · custody accepted on the driver’s own device',
          state: 'Sent',
        }),
      };
    });

  const completeCollection: Ctx['completeCollection'] = (ref) =>
    setS((prev) => {
      if (prev.collectionsDone[ref]) return prev;
      const col = DAY.collections.find((c) => c.ref === ref)!;
      const c = DAY.consignments.find((x) => x.id === col.consignment)!;
      const entries: TrailEntry[] = [];
      for (const sc of col.serialScans) {
        entries.push({
          ref: `SERIAL ${sc.serial}`,
          detail: `${c.lines.find((l) => l.no === sc.line)?.desc} · bound to ${c.id} line ${sc.line} at the counter · scanned, not typed · no truck involved`,
          dest: c.htb ? 'Consignment line + HTB contract line' : 'Consignment line · this sale is not on hire-to-buy',
          state: 'Bound',
        });
      }
      entries.push({
        ref: col.ref,
        detail:
          `${c.customer.name} collected ${c.lines.length} line${c.lines.length === 1 ? '' : 's'} at ${col.at} · ` +
          `ID ${col.receiver.idNo} read and photographed · signed at the counter · ` +
          (col.serialScans.length
            ? `${col.serialScans.length} serial${col.serialScans.length === 1 ? '' : 's'} bound`
            : 'no serial — this consignment carries no serialised line'),
        dest: 'Collection note · same control, no vehicle',
        state: 'Sent',
      });
      return {
        ...prev,
        collectionsDone: { ...prev.collectionsDone, [ref]: true },
        trail: [...entries.reverse(), ...prev.trail],
      };
    });

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
      value={{ s, set, reset, ready, bindSerial, confirmQty, setCondition, takeConditionPhoto, blockLine, sealLoad, handOver, completeCollection }}
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

/* ── The gates ────────────────────────────────────────────────────────────
   ⚠ Disabled means opacity .45 AND a label naming what is missing. Never a dead
   control, never a tooltip. */

export const rowDone = (r: ScanRow) =>
  r.blocked ? false : r.serialised ? r.serials.length >= r.qty && r.condition !== null : r.qtyConfirmed && r.condition !== null;

/** ⚠ Condition anything other than Good makes the photograph mandatory. */
export const rowPhotoRequired = (r: ScanRow) => r.condition === 'Damaged';
export const rowOk = (r: ScanRow) => rowDone(r) && (!rowPhotoRequired(r) || r.conditionPhoto);

export function loadProgress(s: DeskState, loadId: string) {
  const rows = Object.values(s.rows).filter((r) => {
    const c = DAY.consignments.find((x) => x.id === r.consignment);
    return c?.load === loadId;
  });
  const done = rows.filter(rowOk).length;
  const serialsBound = rows.reduce((n, r) => n + r.serials.length, 0);
  const blocked = rows.filter((r) => r.blocked).length;
  return { rows, done, total: rows.length, serialsBound, blocked };
}

/** Seal → hand over: every line accounted for, and nothing blocked. */
export const canSeal = (s: DeskState, loadId: string) => {
  const p = loadProgress(s, loadId);
  return p.done === p.total && p.blocked === 0;
};

export const sealMissing = (s: DeskState, loadId: string) => {
  const p = loadProgress(s, loadId);
  if (p.blocked) return `${p.blocked} line blocked — the exception has to be answered first`;
  const left = p.total - p.done;
  return left ? `${left} line${left === 1 ? '' : 's'} not yet accounted for` : '';
};

export const sentCount = (s: DeskState) => s.trail.filter((t) => t.state === 'Held').length;
