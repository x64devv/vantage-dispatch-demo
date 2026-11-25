'use client';

/* GOODS COMING BACK — goods-in for a failed delivery. Phase 2, Gain demo (URD
 * 10.12 "reverse logistics and returns handling").
 *
 * ⚠⚠ The other half of the driver's rule: "a no is an outcome with a fault and a
 * name on it, and the goods come back". Coming back is not the end of it. Until
 * somebody at the store checks the seal and counts every line back in, the goods
 * are in nobody's stock — and that gap is where returns go missing today.
 *
 * ⚠ Same shape as dispatch, run backwards: the seal, then each line counted by
 * looking, then condition. A "no" anywhere is not an error and is not styled as
 * one: the stock still comes in, and an exception is raised with the clerk's
 * name on it for the difference. Nothing is a skip.
 *
 * ⚠ The rebook belongs to the branch that sold it, never to transport.
 */

import { useRouter } from 'next/navigation';
import { DESK, returnByRef } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { ACC, BG, Btn, DIV, Fact, Label, Mono, Note, Tag, YesNo } from '@/components/ui';

export default function ReturnView({ refId }: { refId: string }) {
  const router = useRouter();
  const { s, set } = useDesk();
  const r = returnByRef(refId);

  if (!r) return <div style={{ padding: 40 }}><Note>No return {refId}.</Note></div>;

  const seal = s.returnSeal[r.ref];
  const lineAns = (no: number) => s.returnLines[`${r.ref}#${no}`];
  const answered = (seal ? 1 : 0) + r.lines.filter((l) => lineAns(l.no)).length;
  const needed = 1 + r.lines.length;
  const anyNo = seal === 'no' || r.lines.some((l) => lineAns(l.no) === 'no');
  /* ⚠ Once received, the answers are the record — they no longer change. */
  const done = !!s.returnDone[r.ref];
  const left = needed - answered;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      {/* ── Left: what went out, and why it came back ───────────────────── */}
      <div className="scr" style={{ flex: 1, minWidth: 0, padding: '22px 26px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <Tag tone="accent">Failed delivery</Tag>
          <Tag tone="outline">Fault: {r.exception.fault}</Tag>
          <Tag tone="outline">In custody since {r.heldSince.slice(11)}, {r.heldSince.slice(0, 10)}</Tag>
        </div>

        <div style={{ font: '800 26px/1.2 Archivo, system-ui', letterSpacing: '-.02em' }}>{r.exception.title}</div>
        <Mono style={{ fontSize: 16, opacity: 0.65, display: 'block', marginTop: 6 }}>
          {r.exception.ref} · raised {r.exception.raisedAt} by {r.driver.name}
        </Mono>

        <div style={{ display: 'flex', gap: 36, marginTop: 20, flexWrap: 'wrap' }}>
          <Fact label="Customer" value={`${r.customer.name} · ${r.customer.suburb}`} size={19} />
          <Fact label="Invoice" value={r.invoice} size={19} mono />
          <Fact label="Trip" value={r.trip} size={19} mono />
          <Fact label="Vehicle" value={`${r.vehicle.reg} · ${r.vehicle.fleetNo}`} size={19} mono />
        </div>

        <div style={{ height: 2, background: DIV, margin: '20px 0' }} />

        <Label>Count every line back in</Label>
        <div style={{ marginTop: 10 }}>
          {r.lines.map((l) => (
            <div key={l.no} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 0', borderBottom: `1px solid ${DIV}` }}>
              <Mono style={{ font: '700 22px Archivo, system-ui', flex: 'none', width: 40 }}>{l.qty}</Mono>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 21px/1.25 Archivo, system-ui' }}>{l.desc}</div>
                <Mono style={{ fontSize: 15, opacity: 0.55 }}>{l.sku} · all {l.qty} back, undamaged?</Mono>
              </div>
              <YesNo
                testid={`return-line-${l.no}`}
                value={lineAns(l.no)}
                onPick={(v) => !done && set({ returnLines: { ...s.returnLines, [`${r.ref}#${l.no}`]: v } })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: the seal, and the way in ─────────────────────────────── */}
      <div style={{ flex: 'none', width: 466, borderLeft: `2px solid ${DIV}`, display: 'flex', flexDirection: 'column' }}>
        <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 26px' }}>
          <Label>The seal it came back under</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${DIV}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Mono style={{ font: '700 24px Archivo, system-ui' }}>{r.seal}</Mono>
              <div style={{ fontSize: 15, opacity: 0.6, marginTop: 3 }}>Intact, and the number matches?</div>
            </div>
            <YesNo
              testid="return-seal"
              value={seal}
              onPick={(v) => !done && set({ returnSeal: { ...s.returnSeal, [r.ref]: v } })}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <Fact label="Rebook owned by" value={`${r.rebookOwner} — the branch that sold it`} size={18} />
          </div>

          {anyNo && !done && (
            <Note style={{ marginTop: 18, borderLeft: `6px solid ${ACC}`, background: BG }}>
              <strong style={{ fontFamily: 'Archivo, system-ui' }}>Not everything came back as it left.</strong>{' '}
              The stock that is here still comes in. The difference becomes an exception with your name
              on it, against {r.driver.name}&rsquo;s trip.
            </Note>
          )}

          {done && (
            <div data-testid="return-done" style={{ marginTop: 18 }}>
              <div style={{ font: '800 22px Archivo, system-ui' }}>Back in stock at Willowvale</div>
              <Mono style={{ fontSize: 16, opacity: 0.75, display: 'block', marginTop: 6 }}>
                {r.ref} · received by {DESK.clerk.name} on {DESK.terminal.terminalNo}
              </Mono>
              <div style={{ fontSize: 16, opacity: 0.72, marginTop: 8, lineHeight: 1.45 }}>
                {anyNo
                  ? 'Received with a difference — an exception is raised for it, in your name.'
                  : 'Seal intact, every line counted back. The custody gap is closed.'}{' '}
                The rebook goes to {r.rebookOwner}.
              </div>
            </div>
          )}
        </div>

        {/* ⚠ Disabled = dimmed AND a label naming what is missing. */}
        <div style={{ flex: 'none', padding: '18px 26px', borderTop: `2px solid ${DIV}` }}>
          {done ? (
            <Btn kind="primary" center style={{ width: '100%' }} onClick={() => router.push('/board')}>
              Back to the board
            </Btn>
          ) : (
            <Btn
              kind="primary"
              center
              testid="return-receive"
              style={{ width: '100%' }}
              dim={left > 0}
              onClick={() => set({ returnDone: { ...s.returnDone, [r.ref]: true } })}
            >
              {left > 0
                ? `${left} check${left === 1 ? '' : 's'} left`
                : anyNo
                  ? 'Receive what is here and raise the difference'
                  : 'Receive into stock'}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
