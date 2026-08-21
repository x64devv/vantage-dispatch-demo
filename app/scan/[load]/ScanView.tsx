'use client';

/* D-04 / SD-2 — scan out. Beat 5, and the screen the whole module rests on.
 *
 * ⚠⚠ THIS IS WHERE A PHYSICAL UNIT BINDS TO A CUSTOMER, AND WHERE A WRONG UNIT
 * IS STOPPED. Everything else in Vantage Transport is a better version of
 * something TVSH already does. This is the control that does not exist.
 *
 * Two states, and both are the point:
 *   A · scanning, going well — a running count legible while the tablet moves,
 *       the last serial with its grade, the four checks, the condition photograph.
 *   B · the block — a serial Business Central does not hold here. The line stops.
 *       ⚠⚠ There is no skip button. The override is a separate permission set
 *       and the person on this desk does not hold it, and the control says so in
 *       its own label rather than going grey and silent.
 *
 * ⚠ Design it so B reads as the system doing its job, not as the system being
 * broken — because in the first month there will be a lot of these, and that is
 * the point. Say so in advance to the people who will be answering for them, or
 * the control gets switched off in week two.
 */

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  DAY, consignment, consignmentsOnLoad, exceptionFor, load as loadById, loadTally, serialsFor,
} from '@/lib/day';
import {
  CHECKS, canSeal, loadProgress, rowOk, rowPhotoRequired, sealMissing, useDesk, type ScanRow,
} from '@/lib/state';
import {
  ACC, AC7, AC8, BG, Btn, Card, DIV, Fact, Grade, INK, MONO, Mono, Note, SURF, SectionHead, Tag, WarnPanel, YesNo,
} from '@/components/ui';

export default function ScanView({ loadId }: { loadId: string }) {
  const router = useRouter();
  const { s, set, bindSerial, confirmQty, setCondition, takeConditionPhoto, blockLine } = useDesk();
  const l = loadById(loadId);
  const ex = exceptionFor(loadId);

  const rows = useMemo(
    () =>
      consignmentsOnLoad(loadId).flatMap((c) =>
        c.lines.map((line) => s.rows[`${c.id}#${line.no}`]).filter(Boolean),
      ),
    [loadId, s.rows],
  );

  if (!l) return <div style={{ padding: 40 }}><Note>No load {loadId}.</Note></div>;

  const tally = loadTally(loadId);
  const prog = loadProgress(s, loadId);
  const blocked = s.blockedOn === loadId;

  /* The line in hand: whatever the picker has brought that is not yet accounted
     for. ⚠ The clerk does not choose it from a menu — he scans what is on the
     trolley, and the sheet finds the line. */
  const current = rows.find((r) => !rowOk(r) && !r.blocked) ?? null;
  const currentC = current ? consignment(current.consignment) : null;

  /* What the scanner would read next for this line, from the day's own record. */
  const nextSerial = current
    ? serialsFor(current.consignment, current.lineNo)[current.serials.length]
    : undefined;

  const checksAnswered = CHECKS.filter((c) => s.checks[c.id]).length;
  const readyToBind = current ? checksAnswered === CHECKS.length : false;

  const doScan = (capturedBy: 'Scanned' | 'Typed') => {
    if (!current) return;
    /* ⚠ On LD-000381 the picker has brought the wrong unit. The tablet reads a
       serial the day's record says was sold in June — and the validation runs
       against BC's answer, not against what is convenient. */
    if (ex && current.consignment === ex.consignment && current.lineNo === ex.line) {
      blockLine(loadId);
      return;
    }
    if (!nextSerial) return;
    bindSerial(current.key, nextSerial.serial, capturedBy);
    set({ checks: {} });
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ── Left: the scan ────────────────────────────────────────────── */}
      {/* ⚠⚠ THE COUNT AND THE CAMERA DO NOT SCROLL. Found by looking at a
          screenshot rather than by a test: with the whole column in one scroll
          area, answering the four checks pushed the running count off the top —
          and the count is the one thing SD-2 asks to be "large and legible while
          the tablet moves". A number that can leave the screen is not that. */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 'none', padding: '18px 22px 14px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: `2px solid ${DIV}` }}>
        {/* The running count — large, and legible while the tablet moves. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18 }}>
          <div>
            <div style={{ font: '600 10px Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.55 }}>
              {loadId} · {l.trip} · {l.vehicle.reg}
            </div>
            <div data-testid="count" style={{ font: '800 46px/1 Archivo, system-ui', letterSpacing: '-.03em', marginTop: 6, ...MONO }}>
              {prog.done} of {tally.lines}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              lines accounted for ·{' '}
              <Mono>
                {prog.serialsBound} of {tally.serialUnits}
              </Mono>{' '}
              serials bound
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Fact label="Scanning since" value={l.scanStarted} mono size={16} />
            <div style={{ marginTop: 8 }}>
              <Fact label="On the desk" value={DAY.desk.clerk.name} size={14} />
            </div>
          </div>
        </div>

        {/* Camera. ⚠ Simulated, and it says so — no camera exists in this build. */}
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="cam" style={{ flex: 'none', width: 260, height: 148 }}>
            <div style={{ position: 'absolute', left: 10, top: 8, font: '600 10px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(243,242,242,.65)' }}>
              Camera · simulated
            </div>
            <div style={{ position: 'absolute', left: 10, bottom: 8, font: '600 10px Archivo, system-ui', letterSpacing: '.08em', color: 'rgba(243,242,242,.55)' }}>
              torch on
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionHead>Last accepted</SectionHead>
            {(() => {
              const lastBound = [...rows].reverse().find((r) => r.serials.length);
              if (!lastBound) return <div style={{ fontSize: 13, opacity: 0.6 }}>Nothing bound on this load yet.</div>;
              const last = lastBound.serials[lastBound.serials.length - 1];
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mono style={{ font: '800 22px Archivo, system-ui' }}>{last.serial}</Mono>
                    <Grade capturedBy={last.capturedBy} />
                  </div>
                  <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 4 }}>{lastBound.desc}</div>
                  <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>
                    <Mono>
                      {lastBound.consignment} line {lastBound.lineNo} · {loadId} / {lastBound.unit}
                    </Mono>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        </div>

        {/* ── The block, or the line in hand ──────────────────────────── */}
        <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 22px 20px' }}>
        {blocked && ex ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="block">
            <WarnPanel head={ex.screenText}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <Mono style={{ font: '800 15px Archivo, system-ui' }}>{ex.serial}</Mono> — Business
                  Central holds this unit as <strong>{ex.found.status}</strong> on invoice{' '}
                  <Mono>{ex.found.invoice}</Mono>, {ex.found.soldOn}, at location{' '}
                  <Mono>{ex.found.location}</Mono>.
                </div>
                <div>
                  Expected: {ex.expected}. Raised <Mono>{ex.ref}</Mono> at <Mono>{ex.raisedAt}</Mono> by{' '}
                  {ex.raisedBy.name} · fault {ex.fault}.
                </div>
              </div>
            </WarnPanel>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card padding={14}>
                <div style={{ font: '600 11px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.55 }}>
                  What happens now
                </div>
                <ul className="pretty" style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5 }}>
                  {ex.consequences.map((x, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{x}</li>
                  ))}
                </ul>
              </Card>
              <Card padding={14}>
                <div style={{ font: '600 11px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.55 }}>
                  What it just told the business
                </div>
                <ul className="pretty" style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5 }}>
                  {ex.tells.map((x, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{x}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn kind="primary" onClick={() => router.push('/exceptions')}>
                Fetch the loading clerk · {ex.ref} is on the queue
              </Btn>
              {/* ⚠⚠ THE OVERRIDE IS NOT A SKIP. It exists, it is a separate
                  permission set deliberately excluded from the umbrella, and using
                  it writes a record with a name on it. The clerk on this desk does
                  not hold it — so the control is dimmed AND names the grant. Never
                  a dead control, never a tooltip. */}
              <Btn dim testid="override" title={ex.override.grant}>
                Override the block — you do not hold {ex.override.consoleName}
              </Btn>
            </div>
            <Note>
              ⚠ The rest of this load carries on. One blocked line does not ground a truck — that turns a
              control into an outage, and an outage is what gets a control switched off.
            </Note>
          </div>
        ) : current && currentC ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div style={{ font: '800 20px Archivo, system-ui' }}>{current.desc}</div>
                <Mono style={{ fontSize: 12.5, opacity: 0.65 }}>
                  {current.sku} · {current.consignment} line {current.lineNo} · {currentC.customer.name}
                </Mono>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Tag tone="ink">Unit {current.unit}</Tag>
                {current.serialised ? <Tag tone="neutral">Serialised</Tag> : <Tag tone="outline">Not serialised</Tag>}
                {currentC.htb && <Tag tone="accent">Hire to buy</Tag>}
              </div>
            </div>

            {/* The four checks — four separate answers, never one tick. */}
            <div>
              <SectionHead right={<Mono style={{ fontSize: 12, opacity: 0.6 }}>{checksAnswered} of 4</Mono>}>
                The four checks
              </SectionHead>
              <div style={{ marginTop: 8, borderTop: `1px solid ${DIV}` }}>
                {CHECKS.map((chk) => {
                  /* ⚠ The serial check is not applicable to an unserialised line,
                     and it says "not applicable" rather than sitting there unticked
                     as though somebody forgot. */
                  const na = chk.id === 'serial' && !current.serialised;
                  return (
                    <div
                      key={chk.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: `1px solid ${DIV}` }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: '600 14px Archivo, system-ui' }}>{chk.label}</div>
                        <div className="pretty" style={{ fontSize: 11.5, opacity: 0.6, marginTop: 2 }}>
                          {na ? 'This line is not serialised, so no serial gate applies.' : chk.hint}
                        </div>
                      </div>
                      {na ? (
                        <Tag tone="outline">Not applicable</Tag>
                      ) : (
                        <YesNo
                          testid={`check-${chk.id}`}
                          value={s.checks[chk.id]}
                          onPick={(v) => set({ checks: { ...s.checks, [chk.id]: v } })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Condition and its photograph */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <SectionHead>Condition, before it is loaded</SectionHead>
                <div style={{ display: 'flex', gap: 0, marginTop: 8 }}>
                  {(['Good', 'Damaged'] as const).map((v, i) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCondition(current.key, v)}
                      className={current.condition === v ? undefined : 'tap8'}
                      data-testid={`cond-${v}`}
                      style={{
                        minHeight: 48,
                        minWidth: 110,
                        border: `1px solid ${DIV}`,
                        borderLeft: i ? 'none' : undefined,
                        background: current.condition === v ? (v === 'Good' ? ACC : INK) : 'transparent',
                        color: current.condition === v ? BG : 'inherit',
                        font: '600 13px Archivo, system-ui',
                        cursor: 'pointer',
                        borderRadius: 0,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="pretty" style={{ fontSize: 11.5, opacity: 0.62, marginTop: 8, maxWidth: 380 }}>
                  ⚠ The photograph at the door proves what state the goods arrived in. Only a pair
                  answers <em>&ldquo;was that dent ours?&rdquo;</em> — and this is the half nobody asks
                  for. Anything other than Good makes it mandatory.
                </div>
              </div>
              <button
                type="button"
                onClick={() => takeConditionPhoto(current.key)}
                data-testid="cond-photo"
                style={{
                  flex: 'none',
                  width: 150,
                  height: 112,
                  border: `1px solid ${rowPhotoRequired(current) && !current.conditionPhoto ? ACC : DIV}`,
                  background: current.conditionPhoto ? SURF : 'transparent',
                  cursor: 'pointer',
                  borderRadius: 0,
                  color: 'inherit',
                  font: '600 11px Archivo, system-ui',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                {current.conditionPhoto ? 'Taken · 1.4 MB' : 'Camera'}
                <div style={{ font: '400 10px Archivo, system-ui', letterSpacing: 0, textTransform: 'none', opacity: 0.6, marginTop: 6 }}>
                  {rowPhotoRequired(current) && !current.conditionPhoto ? 'Required — condition is not Good' : 'One tap, on a line that already needed a scan'}
                </div>
              </button>
            </div>

            {/* The action */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {current.serialised ? (
                <>
                  <Btn
                    kind="primary"
                    testid="scan"
                    dim={!readyToBind}
                    onClick={() => doScan('Scanned')}
                    fontSize={15}
                  >
                    {readyToBind
                      ? `Scan the unit${current.qty > 1 ? ` · ${current.serials.length + 1} of ${current.qty}` : ''}`
                      : `Answer all four checks — ${4 - checksAnswered} left`}
                  </Btn>
                  {/* ⚠ Typed entry is a SECONDARY action and a different grade of
                      fact. It is offered, small, at the foot — not hidden, because
                      a barcode that will not read in a dim warehouse is a real
                      Thursday, and a hidden fallback is a fallback nobody uses. */}
                  <Btn kind="ghost" dim={!readyToBind} onClick={() => doScan('Typed')} testid="type" fontSize={13}>
                    Type the serial instead — recorded as typed
                  </Btn>
                </>
              ) : (
                <Btn
                  kind="primary"
                  testid="confirm-qty"
                  dim={!readyToBind}
                  onClick={() => {
                    confirmQty(current.key);
                    set({ checks: {} });
                  }}
                  fontSize={15}
                >
                  {readyToBind ? `Confirm ${current.qty} by count` : `Answer all four checks — ${4 - checksAnswered} left`}
                </Btn>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="all-done">
            <Card padding={16}>
              <div style={{ font: '800 20px Archivo, system-ui' }}>
                Every line on {loadId} is accounted for.
              </div>
              <div className="pretty" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8, opacity: 0.75 }}>
                <Mono>{prog.serialsBound}</Mono> serials bound to their consignment lines, each with
                where, when, by whom and by what means. Nothing on this load is now anonymous.
              </div>
            </Card>
            <Btn kind="primary" fontSize={15} onClick={() => router.push(`/handover/${loadId}`)} testid="to-handover">
              Close and seal the load →
            </Btn>
          </div>
        )}
        </div>
      </div>

      {/* ── Right: the sheet ──────────────────────────────────────────── */}
      <div style={{ flex: 'none', width: 392, borderLeft: `2px solid ${DIV}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }} className="scr">
        <SectionHead right={<Mono style={{ fontSize: 12, opacity: 0.6 }}>{tally.consignments} consignments</Mono>}>
          The sheet
        </SectionHead>
        <div style={{ borderTop: `1px solid ${DIV}` }}>
          {rows.map((r) => (
            <SheetRow key={r.key} r={r} isCurrent={current?.key === r.key} />
          ))}
        </div>

        {!canSeal(s, loadId) && (
          <Note style={{ marginTop: 'auto' }}>
            <strong style={{ fontFamily: 'Archivo, system-ui' }}>Not ready to seal.</strong>{' '}
            {sealMissing(s, loadId)}.
          </Note>
        )}
        {loadId === 'LD-000377' && (
          <Note style={{ borderLeft: `4px solid ${ACC}`, background: BG }}>
            ⭐ <strong>{'CN-VE-000427'}</strong> is the only line here that is serialised{' '}
            <em>and</em> on hire-to-buy. Its scan is the one that writes{' '}
            <Mono style={{ fontSize: 11 }}>Vantage HTB Contract Line.&ldquo;Serial No.&rdquo;</Mono> — a
            field declared in the codebase that no shipped path has ever populated, which is why a
            repossession today cannot say which fridge.
          </Note>
        )}
      </div>
    </div>
  );
}

function SheetRow({ r, isCurrent }: { r: ScanRow; isCurrent: boolean }) {
  const done = rowOk(r);
  const state = r.blocked ? 'Blocked' : done ? 'Accounted' : isCurrent ? 'In hand' : 'Waiting';
  const colour = r.blocked ? AC8 : done ? INK : isCurrent ? ACC : 'color-mix(in srgb, var(--color-text) 45%, transparent)';
  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: `1px solid ${DIV}`,
        borderLeft: isCurrent ? `3px solid ${ACC}` : '3px solid transparent',
        paddingLeft: 9,
        opacity: done || isCurrent || r.blocked ? 1 : 0.72,
      }}
      data-testid={`sheet-${r.key}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div style={{ font: '600 13px Archivo, system-ui', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.desc}
        </div>
        <span style={{ flex: 'none', font: '600 9px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', color: colour }}>
          {state}
        </span>
      </div>
      <Mono style={{ fontSize: 11, opacity: 0.55 }}>
        {r.consignment} / {r.lineNo} · unit {r.unit} · qty {r.qty}
      </Mono>
      {r.serials.length > 0 && (
        <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {r.serials.map((x) => (
            <div key={x.serial} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Mono style={{ fontSize: 11.5, font: '600 11.5px Archivo, system-ui' }}>{x.serial}</Mono>
              <span style={{ font: '600 9px Archivo, system-ui', letterSpacing: '.08em', textTransform: 'uppercase', opacity: x.capturedBy === 'Typed' ? 1 : 0.5, color: x.capturedBy === 'Typed' ? AC7 : 'inherit' }}>
                {x.capturedBy}
              </span>
            </div>
          ))}
        </div>
      )}
      {!r.serialised && r.qtyConfirmed && (
        <div style={{ marginTop: 5, fontSize: 11, opacity: 0.6 }}>
          Confirmed by count · not serialised
        </div>
      )}
    </div>
  );
}
