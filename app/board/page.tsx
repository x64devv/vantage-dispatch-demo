'use client';

/* The goods-out board. Beat 4.
 *
 * ⚠⚠ TWO TABS — internal review, 21 August. It was three lanes side by side and
 * it read as a spreadsheet. One queue at a time, in cards big enough to work
 * from standing up.
 *
 * ⚠ Awaiting collection is the FIRST tab. Roughly a third of consignments never
 * see a truck, and a collection has no gate pass, no seals, no driver who signed
 * for the load and no debrief — so it is where shrinkage is easiest today and
 * nobody is looking. Putting it second would quietly say the opposite.
 *
 * ⚠ A card carries five things and no more: who, where, what, how many lines,
 * and where it has got to. Everything else is on the consignment itself, one tap
 * away. The earlier build put six tags on every row and nobody could read any of
 * them across a room.
 */

import { useRouter } from 'next/navigation';
import { DAY, consignmentsInLane, type Consignment, type ReturnIn } from '@/lib/day';
import { stageOf, useDesk, type BoardTab, type Stage } from '@/lib/state';
import { ACC, AC7, AC8, BG, DIV, INK, MONO, Mono, SURF, Tag } from '@/components/ui';

/* ⚠ Collection stays FIRST. Phase 2 (Gain demo, 25 Nov) adds the hired carrier
   and goods coming back as tabs — one queue on screen at a time, which is what
   the 21 Aug review was protecting. */
const TABS: { key: BoardTab; label: string }[] = [
  { key: 'collection', label: 'Awaiting collection' },
  { key: 'ourDriver', label: 'Awaiting our driver' },
  { key: 'carrier', label: 'Awaiting a carrier' },
  { key: 'returning', label: 'Coming back' },
];

const countFor = (t: BoardTab) => (t === 'returning' ? DAY.returns.length : consignmentsInLane(t).length);

export default function Board() {
  const router = useRouter();
  const { s, set } = useDesk();
  const rows = s.tab === 'returning' ? [] : consignmentsInLane(s.tab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Tabs — 76px, and the count is part of the label. */}
      <div style={{ flex: 'none', display: 'flex', borderBottom: `2px solid ${DIV}` }} data-testid="tabs">
        {TABS.map((t) => {
          const on = s.tab === t.key;
          const n = countFor(t.key);
          return (
            <button
              key={t.key}
              type="button"
              data-testid={`tab-${t.key}`}
              onClick={() => set({ tab: t.key })}
              className={on ? undefined : 'tap8'}
              style={{
                flex: 1,
                minHeight: 76,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                border: 0,
                borderBottom: on ? `5px solid ${ACC}` : '5px solid transparent',
                background: 'transparent',
                color: on ? INK : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
                font: `${on ? 800 : 600} 20px Archivo, system-ui`,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {t.label}
              <Mono style={{ font: '700 22px Archivo, system-ui', opacity: on ? 0.75 : 0.5 }}>{n}</Mono>
            </button>
          );
        })}
      </div>

      <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px 26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          {rows.map((c) => (
            <BoardCard key={c.id} c={c} stage={stageOf(s, c)} onOpen={() => router.push(`/consignment/${c.id}`)} />
          ))}
          {s.tab === 'returning' &&
            DAY.returns.map((r) => (
              <ReturnCard key={r.ref} r={r} done={!!s.returnDone[r.ref]} onOpen={() => router.push(`/return/${r.ref}`)} />
            ))}
        </div>
      </div>
    </div>
  );
}

const STAGE_TONE: Record<Stage, { tone: 'neutral' | 'accent' | 'ink' | 'outline'; label: string }> = {
  Waiting: { tone: 'outline', label: 'To verify' },
  Verified: { tone: 'neutral', label: 'Verified' },
  Scanned: { tone: 'ink', label: 'Scanned out' },
  Blocked: { tone: 'accent', label: 'Blocked' },
  Gone: { tone: 'neutral', label: 'Left the building' },
};

function BoardCard({ c, stage, onOpen }: { c: Consignment; stage: Stage; onOpen: () => void }) {
  const overdue = c.penaltyDue != null;
  const st = STAGE_TONE[stage];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="tappable"
      data-testid={`card-${c.id}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '20px 22px',
        border: `2px solid ${stage === 'Blocked' ? ACC : DIV}`,
        borderLeft: overdue ? `8px solid ${ACC}` : `2px solid ${stage === 'Blocked' ? ACC : DIV}`,
        background: stage === 'Gone' ? SURF : BG,
        cursor: 'pointer',
        color: 'inherit',
        borderRadius: 0,
        minHeight: 172,
        opacity: stage === 'Gone' ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              font: '800 27px/1.15 Archivo, system-ui',
              letterSpacing: '-.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {c.customer.name}
          </div>
          <div style={{ font: '600 18px Archivo, system-ui', opacity: 0.62, marginTop: 5 }}>
            {c.address.suburb === '—' ? 'Collecting at the counter' : c.address.suburb}
          </div>
        </div>
        <Tag tone={st.tone} style={{ flex: 'none' }}>{st.label}</Tag>
      </div>

      <div
        className="pretty"
        style={{
          fontSize: 17,
          lineHeight: 1.4,
          marginTop: 14,
          maxHeight: 48,
          overflow: 'hidden',
          color: 'color-mix(in srgb, var(--color-text) 78%, transparent)',
        }}
      >
        {c.lines.map((l) => l.desc).join(' · ')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
        <Mono style={{ fontSize: 16, opacity: 0.6 }}>
          {c.id} · {c.lines.length} line{c.lines.length === 1 ? '' : 's'}
        </Mono>
        {/* ⚠ The ageing figure is the only extra a collection card carries, and it
            is the reason this lane exists: nothing has ever watched that clock.
            ⚠ The 3% penalty at fourteen days is carried over from the TVSH build —
            an assumption to confirm with Gain. */}
        {c.transferRef && (
          <Mono style={{ fontSize: 16, marginLeft: 'auto', font: '700 16px Archivo, system-ui' }}>
            Transfer {c.transferRef} → {c.address.suburb}
          </Mono>
        )}
        {c.carrier && (
          <Mono style={{ fontSize: 16, marginLeft: 'auto', font: '700 16px Archivo, system-ui' }}>
            {c.carrier.name} · {c.carrier.vehicle}
          </Mono>
        )}
        {c.heldDays != null && (
          <Mono
            style={{
              fontSize: 16,
              marginLeft: 'auto',
              font: `${overdue ? 700 : 600} 16px Archivo, system-ui`,
              color: overdue ? AC8 : c.heldDays >= 10 ? AC7 : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
            }}
          >
            {overdue ? `${c.heldDays} days · 3% penalty due` : `held ${c.heldDays} day${c.heldDays === 1 ? '' : 's'}`}
          </Mono>
        )}
      </div>
    </button>
  );
}

/* ⚠ A return card carries the same five things as any other card: who, where,
   what, how many lines, and where it has got to — plus why it came back. */
function ReturnCard({ r, done, onOpen }: { r: ReturnIn; done: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tappable"
      data-testid={`return-${r.ref}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '20px 22px',
        border: `2px solid ${DIV}`,
        borderLeft: `8px solid ${done ? DIV : ACC}`,
        background: done ? SURF : BG,
        cursor: 'pointer',
        color: 'inherit',
        borderRadius: 0,
        minHeight: 172,
        opacity: done ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '800 27px/1.15 Archivo, system-ui', letterSpacing: '-.02em' }}>{r.customer.name}</div>
          <div style={{ font: '600 18px Archivo, system-ui', opacity: 0.62, marginTop: 5 }}>
            {r.customer.suburb} · {r.exception.title.replace('Delivery failed — ', '')}
          </div>
        </div>
        <Tag tone={done ? 'neutral' : 'accent'} style={{ flex: 'none' }}>{done ? 'Back in stock' : 'To receive'}</Tag>
      </div>
      <div className="pretty" style={{ fontSize: 17, lineHeight: 1.4, marginTop: 14, color: 'color-mix(in srgb, var(--color-text) 78%, transparent)' }}>
        {r.lines.map((l) => `${l.qty} × ${l.desc}`).join(' · ')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
        <Mono style={{ fontSize: 16, opacity: 0.6 }}>
          {r.ref} · seal {r.seal}
        </Mono>
        <Mono style={{ fontSize: 16, marginLeft: 'auto', font: '700 16px Archivo, system-ui' }}>
          {r.driver.name} · {r.vehicle.reg}
        </Mono>
      </div>
    </button>
  );
}
