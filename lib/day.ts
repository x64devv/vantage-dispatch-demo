/* The dispatch day, typed.
 *
 * ⚠⚠ lib/dispatch-day.json is a COPY. The one that counts is
 * Transport-Material/design_handoff_dispatch_app/data/dispatch-day.json, and
 * `npm run build` runs scripts/sync-data.mjs first to keep them identical. Edit
 * the handoff's copy, never this one — an edit here is silently reverted by the
 * next build, which is the least useful place to lose an afternoon.
 *
 * ⚠ The `_why` / `_open` keys in the JSON are load-bearing prose, not clutter.
 * They are the reasoning behind each identity, and several of them are open
 * questions with Wyne's name on them. Read them before changing a value.
 */

import raw from './dispatch-day.json';

export type Lane = 'collection' | 'ourDriver' | 'carrier';
export type PinGrade = 'Salesperson' | 'CustomerConfirmed' | 'DriverConfirmed' | 'NotRequired';
export type CapturedBy = 'Scanned' | 'Typed';

export type Line = {
  no: number;
  sku: string;
  desc: string;
  qty: number;
  unitPrice?: string;
  serialised: boolean;
  enclosedTruck?: boolean;
  crew?: number;
};

export type Consignment = {
  id: string;
  lane: Lane;
  movementType: string;
  fulfilment: 'Deliver' | 'CollectAtSource' | 'TakeWith';
  sellingBranch: string;
  sourceBranch: string;
  invoiceRefs: string[];
  invoice?: { no: string; customerRef: string; fiscalSignature: string; device: string };
  transferRef?: string;
  customer: { name: string; phone: string; idNo?: string };
  address: {
    line: string; full: string; suburb: string; zone: string;
    latlng: [number, number] | null; pinGrade: PinGrade;
  };
  tender: 'Cash' | 'HTB' | 'None';
  htb: boolean;
  htbContract?: string;
  promisedDate: string;
  window?: string;
  collectionDueBy?: string;
  heldDays?: number;
  penaltyDue?: { pct: number; of: string };
  charge?: { currency: string; amount: string };
  cashAtDoor?: { currency: string; amount: string; what: string };
  status: string;
  carrier?: { name: string; vehicle: string };
  needs: { enclosedTruck: boolean; twoPerson: boolean };
  trip: string | null;
  load: string | null;
  loadUnit?: number;
  stopSeq?: number;
  receiptScanAtFarEnd?: boolean;
  lines: Line[];
};

export type SerialAssignment = {
  id: string; serial: string; consignment: string; line: number; unit: number;
  boundAt: string; boundAtLocation: string; boundBy: string;
  capturedBy: CapturedBy; loadUnit: string; condition: string; conditionPhoto: boolean;
  state: string; writes?: string[]; awaitingReceiptScanAt?: string;
};

export type QtyConfirmation = {
  consignment: string; line: number; qty: number; at: string; by: string;
  condition: string; loadUnit: string;
};

export type Load = {
  id: string; trip: string; zone: string;
  vehicle: { reg: string; fleetNo: string; make: string };
  driver: { name: string; staffNo: string };
  crew: { name: string; staffNo: string };
  depot: { code: string; name: string };
  departedDepot: { at: string; source: string };
  scanStarted: string;
  sealedAt: string | null;
  seals: string[];
  gatePass: string | null;
  handover: {
    acceptedAt: string; acceptedBy: string; acceptedOn: string;
    issuedBy: string; issuedOn: string; sealFormSignedBy: string[];
  } | null;
  state: string;
};

export type DispatchException = {
  ref: string; kind: string; title: string; serial: string;
  consignment: string; line: number; load: string; trip: string;
  expected: string;
  found: { status: string; invoice: string; soldOn: string; location: string; leftKwekwe: string };
  raisedAt: string; raisedBy: { name: string; staffNo: string }; raisedAtLocation: string;
  capturedBy: CapturedBy; fault: string; status: string;
  detail: string; expanded: string; screenText: string;
  override: { grant: string; consoleName: string; heldBy: string; clerkHolds: boolean };
  tells: string[]; consequences: string[];
};

export type Collection = {
  ref: string; consignment: string; at: string; dispatchPoint: string; issuedBy: string;
  receiver: { name: string; idNo: string; relationship: string };
  idPhotograph: string; signature: string;
  serialScans: {
    id: string; serial: string; line: number; capturedBy: CapturedBy;
    condition: string; conditionPhoto: boolean; writes?: string[]; state: string;
  }[];
};

export type Day = {
  day: string;
  kicker: string;
  boardClock: string;
  branch: { code: string; name: string };
  desk: {
    clerk: { name: string; staffNo: string; role: string };
    terminal: { storeNo: string; terminalNo: string; class: string; device: string };
    sync: { state: string; lastSync: string; queued: number };
  };
  counters: { waiting: number; outToday: number; collected: number; failed: number };
  consignments: Consignment[];
  loads: Load[];
  serialAssignments: SerialAssignment[];
  quantityConfirmations: QtyConfirmation[];
  exceptions: DispatchException[];
  collections: Collection[];
};

export const DAY = raw as unknown as Day;

export const BRANCH = DAY.branch;
export const DESK = DAY.desk;

export const consignment = (id: string) => DAY.consignments.find((c) => c.id === id);
export const load = (id: string) => DAY.loads.find((l) => l.id === id);
export const collectionByRef = (ref: string) => DAY.collections.find((c) => c.ref === ref);
/** ⚠ Not every consignment in the collection lane has a collection record:
 *  two of them are still waiting for the customer to walk in, which is the
 *  ordinary state of that lane and not a gap in the fixture. */
export const collectionFor = (consignmentId: string) =>
  DAY.collections.find((c) => c.consignment === consignmentId);

export const consignmentsOnLoad = (loadId: string) =>
  DAY.consignments.filter((c) => c.load === loadId).sort((a, b) => (a.stopSeq ?? 0) - (b.stopSeq ?? 0));

export const consignmentsInLane = (lane: Lane) =>
  DAY.consignments.filter((c) => c.lane === lane);

export const serialsFor = (cid: string, lineNo?: number) =>
  DAY.serialAssignments.filter((s) => s.consignment === cid && (lineNo === undefined || s.line === lineNo));

export const qtyConfirmFor = (cid: string, lineNo: number) =>
  DAY.quantityConfirmations.find((q) => q.consignment === cid && q.line === lineNo);

export const exceptionFor = (loadId: string) => DAY.exceptions.find((e) => e.load === loadId);

/** ⚠ The scan gate counts LINES accounted for, not units. A line with three
 *  televisions on it is one line and three serials; the clerk needs both figures
 *  and the screen shows both, because "12 of 15" and "7 of 7 serials" answer two
 *  different questions and rolling them into one hides whichever is behind. */
export function loadTally(loadId: string) {
  const cs = consignmentsOnLoad(loadId);
  const lines = cs.reduce((n, c) => n + c.lines.length, 0);
  const serialUnits = cs.reduce(
    (n, c) => n + c.lines.filter((l) => l.serialised).reduce((m, l) => m + l.qty, 0),
    0,
  );
  return { lines, serialUnits, consignments: cs.length };
}

/** The three grades of an address pin, and what each one is worth.
 *  ⚠ TRP-001 §8.1: an address typed by a salesperson standing in a shop is not
 *  the same fact as one a driver stood on. Two grades of a fact are two visibly
 *  different things — never one field with a quiet asterisk. */
export const PIN_GRADE: Record<PinGrade, { label: string; note: string; rank: 0 | 1 | 2 | 3 }> = {
  Salesperson: { label: 'Salesperson', note: 'Typed in a shop. Nobody has stood on it.', rank: 1 },
  CustomerConfirmed: { label: 'Customer confirmed', note: 'The customer read it back.', rank: 2 },
  DriverConfirmed: { label: 'Driver confirmed', note: 'A driver has been to this door.', rank: 3 },
  NotRequired: { label: 'Not required', note: 'Collected at the counter — there is no delivery address.', rank: 0 },
};

/* ⚠⚠ TWO LANES ON THE BOARD — internal review, 21 August. `carrier` still exists
   in the day (CN-VE-000125 is a real hired-carrier job and TRP-002 §3 gives it
   D-07) but it has no tab in this build, because three columns of small rows was
   the thing that read as a spreadsheet. It is named in the handoff as not built
   rather than deleted from the data. */
export const LANES: { key: Lane; title: string; sub: string }[] = [
  {
    key: 'collection',
    title: 'Awaiting collection',
    /* ⚠⚠ Roughly a third of consignments never see a truck. This lane is first
       and it is the same width as the others, deliberately: a collection has no
       gate pass, no seals, no driver who signed for the load and no debrief, so
       it is where shrinkage is easiest today and nobody is looking. */
    sub: 'The customer is coming for these',
  },
  { key: 'ourDriver', title: 'Awaiting our driver', sub: 'On a trip, or waiting for one' },
  { key: 'carrier', title: 'Awaiting a carrier', sub: 'Hired transport — proof on return' },
];
