'use client';

/* D-01 / SD-1 — the goods-out board. Beat 4.
 *
 * Three lanes: awaiting collection · awaiting our driver · awaiting a carrier.
 *
 * ⚠⚠ The collection lane is FIRST and is the same width as the others. Roughly a
 * third of consignments never see a truck, and a collection has no gate pass, no
 * seals, no driver who signed for the load and no debrief — so it is where
 * shrinkage is easiest today and nobody is looking. Making it the narrow column
 * on the right would quietly say the opposite of what the screen is for.
 *
 * ⚠ The awaiting-collection lane AGES. TVSH already prints on every invoice
 * "all goods not collected within 2 weeks will attract a 3% of invoice penalty",
 * and no system watches that clock. One row at twelve days, one at fifteen and
 * past it. Visible without hunting, and not shouting.
 */

import { useRouter } from 'next/navigation';
import { BRANCH, DAY, LANES, consignmentsInLane, type Consignment } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { ACC, AC7, AC8, DIV, MONO, Mono, Note, SURF, Tag } from '@/components/ui';

export default function Board() {
  const router = useRouter();
  const { s } = useDesk();

  /* ⚠ height, not minHeight: the foot strip carries SD-1's own figures
     (waiting · out today · collected · failed) and it was sitting below the
     fold, where a strip that reports the day is worth nothing. The lanes scroll
     inside themselves instead. Found by looking at a screenshot. */
  return (
    <div style={{ padding: '18px 24px 20px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div style={{ font: '800 17px Archivo, system-ui' }}>
          {BRANCH.code} {BRANCH.name} · {DAY.boardClock}
        </div>
        <div className="pretty" style={{ fontSize: 12.5, opacity: 0.65, lineHeight: 1.4 }}>
          Nancy Muhoni&rsquo;s sale cleared at the till at 12:19 yesterday and was on this board seconds
          later, with the fiscal invoice attached. Nobody emailed anybody.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, flex: 1, minHeight: 0 }}>
        {LANES.map((lane) => {
          const rows = consignmentsInLane(lane.key);
          return (
            <div key={lane.key} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ borderBottom: `2px solid ${DIV}`, paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ font: '800 15px Archivo, system-ui' }}>{lane.title}</div>
                  <Mono style={{ font: '600 13px Archivo, system-ui', opacity: 0.6 }}>{rows.length}</Mono>
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 3 }}>{lane.sub}</div>
              </div>
              <div className="scr" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {rows.map((c) => (
                  <Row key={c.id} c={c} onOpen={() => router.push(`/consignment/${c.id}`)} scanned={!!s.sealed[c.load ?? '']} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Foot strip — small, factual, mono figures. */}
      <div style={{ borderTop: `2px solid ${DIV}`, paddingTop: 10, display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ display: 'flex', gap: 18, ...MONO, fontSize: 12.5 }} data-testid="counters">
          <span>waiting {DAY.counters.waiting}</span>
          <span>out today {DAY.counters.outToday}</span>
          <span>collected {DAY.counters.collected}</span>
          <span>failed {DAY.counters.failed}</span>
        </div>
        <div className="pretty" style={{ fontSize: 11.5, opacity: 0.6, lineHeight: 1.4, flex: 1 }}>
          Branch totals, not a count of the rows above — this branch has more of each than fit on one
          screen, and a foot strip that silently counted only what is visible would be worse than one
          that says what it is.
        </div>
      </div>

      <Note style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ font: '800 11px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', color: AC7, flex: 'none', paddingTop: 2 }}>
          On this board
        </span>
        <span className="pretty">
          <strong>CN-AV-000120</strong> was sold at Avondale and the goods are here, so it is on both
          branches&rsquo; boards — a promise on theirs, a job to pick on ours. Today that hand-off is a
          telephone call. And <strong>CN-WK-000041</strong> has been waiting fifteen days, which is past
          the fourteen the invoice already prints.
        </span>
      </Note>
    </div>
  );
}

function Row({ c, onOpen, scanned }: { c: Consignment; onOpen: () => void; scanned: boolean }) {
  const overdue = c.penaltyDue != null;
  const ageing = c.heldDays != null && c.heldDays >= 10;
  const crossStore = c.sellingBranch !== BRANCH.code;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="tappable"
      data-testid={`row-${c.id}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '11px 10px 12px',
        border: 0,
        borderBottom: `1px solid ${DIV}`,
        borderLeft: overdue ? `3px solid ${ACC}` : '3px solid transparent',
        background: 'transparent',
        cursor: 'pointer',
        color: 'inherit',
        borderRadius: 0,
        minHeight: 56,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <Mono style={{ font: '600 12.5px Archivo, system-ui' }}>{c.id}</Mono>
        <span style={{ font: '600 10px Archivo, system-ui', letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.5 }}>
          {c.tender === 'None' ? 'Transfer' : c.tender}
        </span>
      </div>
      <div style={{ font: '600 14px Archivo, system-ui', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {c.customer.name}
      </div>
      <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {c.address.suburb === '—' ? 'Collecting at the counter' : c.address.suburb} ·{' '}
        {c.lines.map((l) => l.desc).join(', ')}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Mono style={{ fontSize: 11, opacity: 0.6 }}>
          {c.lines.length} line{c.lines.length === 1 ? '' : 's'}
        </Mono>
        {/* ⚠ Small marks, not badges: an enclosed truck and two people to carry are
            facts a picker needs at a glance, and they are the two the planner's
            capacity check cannot compute because TVSH holds no dimensions. */}
        {c.needs.enclosedTruck && <Tag tone="outline">Enclosed</Tag>}
        {c.needs.twoPerson && <Tag tone="outline">2 crew</Tag>}
        {c.lines.some((l) => l.serialised) && <Tag tone="neutral">Serialised</Tag>}
        {crossStore && <Tag tone="accent">Sold at {c.sellingBranch}</Tag>}
        {c.carrier && <Tag tone="neutral">{c.carrier.name}</Tag>}
        {scanned && c.load && <Tag tone="ink">Sealed</Tag>}
      </div>
      {c.heldDays != null && (
        <div
          style={{
            marginTop: 7,
            fontSize: 11.5,
            ...MONO,
            color: overdue ? AC8 : ageing ? AC7 : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
          }}
        >
          held {c.heldDays} day{c.heldDays === 1 ? '' : 's'}
          {overdue ? ` · ${c.penaltyDue!.pct}% penalty due` : c.collectionDueBy ? ` · due by ${c.collectionDueBy}` : ''}
        </div>
      )}
      {c.window && c.window !== '—' && (
        <div style={{ marginTop: 7, fontSize: 11.5, ...MONO, opacity: 0.55 }}>
          promised {c.promisedDate} · {c.window}
        </div>
      )}
    </button>
  );
}
