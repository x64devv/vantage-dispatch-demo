'use client';

/* Step 2 — SCAN OUT. Beat 5, and the screen the whole module rests on.
 *
 * ⚠⚠ THIS IS WHERE A PHYSICAL UNIT BINDS TO A CUSTOMER, AND WHERE A WRONG UNIT
 * IS STOPPED. Everything else in Vantage Transport is a better version of
 * something TVSH already does. This is the control that does not exist.
 *
 * ⚠⚠ THE SCAN BUTTON IS ON THE LINE — internal review, 21 August. It used to be
 * one button at the foot acting on whichever line the app had decided was "in
 * hand", which is a queue the clerk cannot see and cannot argue with. Now every
 * line in the basket carries its own control: you scan the thing you are
 * holding, and the row it belongs to lights up.
 *
 * ⚠ A line that carries no serial confirms by count instead, and says so. The
 * gate is per line, never a global mode — the catalogue is bed sets as well as
 * televisions, and a half-serialised catalogue has to be a supported state or
 * the control gets switched off in week two.
 */

import { useRouter } from 'next/navigation';
import { collectionFor, consignment, DAY, serialsFor } from '@/lib/day';
import { scanComplete, scanTally, useDesk } from '@/lib/state';
import { ACC, AC8, BG, Btn, DIV, Grade, INK, Label, MONO, Mono, Note, Steps, SURF, Tag, WarnPanel } from '@/components/ui';

export default function ScanView({ id }: { id: string }) {
  const router = useRouter();
  const { s, scanLine } = useDesk();
  const c = consignment(id);

  if (!c) return <div style={{ padding: 40 }}><Note>No consignment {id}.</Note></div>;

  const blockedRef = s.blocked[c.id];
  const ex = blockedRef ? DAY.exceptions.find((e) => e.ref === blockedRef) : undefined;
  const { bound, units } = scanTally(s, c);
  const done = scanComplete(s, c);
  const collection = collectionFor(c.id);

  const onward = () => {
    if (collection) return router.push(`/collection/${collection.ref}`);
    if (c.load) return router.push(`/handover/${c.load}`);
    return router.push('/board');
  };

  return (
    <>
      <Steps at={2} />

      {/* The running count, pinned. ⚠ It never scrolls: it is the one thing that
          has to stay legible while the tablet is moving. */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          padding: '18px 26px',
          borderBottom: `2px solid ${DIV}`,
        }}
      >
        <div data-testid="count" style={{ font: '800 54px/1 Archivo, system-ui', letterSpacing: '-.03em', ...MONO }}>
          {bound} of {units}
        </div>
        <div style={{ font: '600 20px/1.3 Archivo, system-ui', opacity: 0.7 }}>
          serials bound
          <br />
          <span style={{ fontSize: 16, opacity: 0.8 }}>{c.id}</span>
        </div>
        <div className="cam" style={{ marginLeft: 'auto', width: 240, height: 96, flex: 'none' }}>
          <div style={{ position: 'absolute', left: 12, top: 10, font: '700 13px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(243,242,242,.7)' }}>
            Camera · simulated
          </div>
        </div>
      </div>

      {/* ⚠ Bottom padding, or the typed-entry fallback sits half under the footer
          — and a fallback nobody can see is a fallback nobody uses. */}
      <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px 30px' }}>
        {/* ── The block ───────────────────────────────────────────────── */}
        {ex && (
          <div data-testid="block" style={{ marginBottom: 22 }}>
            <WarnPanel head={ex.screenText}>
              <Mono style={{ font: '800 22px Archivo, system-ui' }}>{ex.serial}</Mono> — Business Central
              holds this unit as <strong>{ex.found.status}</strong> on invoice{' '}
              <Mono>{ex.found.invoice}</Mono>, {ex.found.soldOn}, at <Mono>{ex.found.location}</Mono>.
              <div style={{ marginTop: 12 }}>
                It is the right model, and it passed every check a person can make by looking. Only the
                scan could catch it.
              </div>
            </WarnPanel>
            <div style={{ display: 'flex', gap: 14, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* ⚠⚠ THE OVERRIDE IS NOT A SKIP. It exists, it is a separate
                  permission set deliberately excluded from the umbrella, and
                  using it writes a record with a name on it. The clerk does not
                  hold it — so the control is dimmed AND names the grant. */}
              <Btn dim testid="override">
                Override — you do not hold {ex.override.consoleName}
              </Btn>
              <div className="pretty" style={{ fontSize: 16, lineHeight: 1.45, opacity: 0.75, flex: 1, minWidth: 280 }}>
                Raised <Mono>{ex.ref}</Mono> at <Mono>{ex.raisedAt}</Mono>, fault {ex.fault}. The rest of
                the truck still goes — one blocked line does not ground it.
              </div>
            </div>
          </div>
        )}

        {/* ── The basket ──────────────────────────────────────────────── */}
        <Label>The basket</Label>
        <div style={{ marginTop: 12 }}>
          {c.lines.map((line) => {
            const row = s.rows[`${c.id}#${line.no}`];
            const got = row?.serials.length ?? 0;
            const full = got >= line.qty;
            const isBlocked = !!row?.blocked;

            return (
              <div
                key={line.no}
                data-testid={`line-${line.no}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: '18px 18px 18px 20px',
                  marginBottom: 12,
                  border: `2px solid ${isBlocked ? ACC : full ? INK : DIV}`,
                  background: full && !isBlocked ? SURF : BG,
                }}
              >
                <Mono style={{ font: '700 24px Archivo, system-ui', flex: 'none', width: 42 }}>{line.qty}</Mono>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '700 22px/1.25 Archivo, system-ui' }}>{line.desc}</div>
                  <div style={{ marginTop: 7, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {isBlocked ? (
                      <span style={{ font: '700 17px Archivo, system-ui', color: AC8 }}>Blocked — wrong unit</span>
                    ) : line.serialised ? (
                      got ? (
                        row!.serials.map((x) => (
                          <span key={x.serial} style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                            <Mono style={{ font: '700 18px Archivo, system-ui' }}>{x.serial}</Mono>
                            <Grade capturedBy={x.capturedBy} />
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 17, opacity: 0.6 }}>No serial bound yet</span>
                      )
                    ) : (
                      /* ⚠ Said out loud rather than left blank, so nobody later
                         reads a quantity confirmation as if a serial was scanned. */
                      <span style={{ fontSize: 17, opacity: 0.7 }}>
                        Not serialised — confirmed by count at verification
                      </span>
                    )}
                  </div>
                </div>

                {/* ⚠⚠ The control, ON THE LINE. 68px, unambiguous, and it names
                    which unit of how many when a line carries several. */}
                <div style={{ flex: 'none', width: 250, display: 'flex', justifyContent: 'flex-end' }}>
                  {!line.serialised ? (
                    <Tag tone="outline">Nothing to scan</Tag>
                  ) : isBlocked ? (
                    <Tag tone="accent">Stopped</Tag>
                  ) : full ? (
                    <Tag tone="ink">Bound</Tag>
                  ) : (
                    <Btn
                      kind="primary"
                      center
                      testid={`scan-${line.no}`}
                      style={{ width: '100%' }}
                      onClick={() => scanLine(c.id, line.no, 'Scanned')}
                    >
                      {line.qty > 1 ? `Scan  ${got + 1} of ${line.qty}` : 'Scan'}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ⚠ Typed entry is offered, small, and is a different grade of fact. A
            barcode that will not read in a dim stock room is an ordinary
            Thursday, and a fallback nobody can find is a fallback nobody uses —
            which produces a skipped scan, the thing this screen exists to stop. */}
        {!done && !ex && c.lines.some((l) => l.serialised) && (
          <Btn
            kind="ghost"
            height={56}
            fontSize={16}
            testid="type"
            onClick={() => {
              const next = c.lines.find(
                (l) => l.serialised && (s.rows[`${c.id}#${l.no}`]?.serials.length ?? 0) < l.qty,
              );
              if (next) scanLine(c.id, next.no, 'Typed');
            }}
          >
            Barcode will not read — type the serial instead, recorded as typed
          </Btn>
        )}
      </div>

      {/* ── The way on ─────────────────────────────────────────────────── */}
      <div style={{ flex: 'none', padding: '18px 26px', borderTop: `2px solid ${DIV}` }}>
        {/* ⚠⚠ A BLOCKED LINE IS NOT A DEAD END FOR THE CLERK.

            The onward control below is dim and stays dim — this line does not go,
            and no second control may look like a way around that. But the clerk is
            still standing at a desk with a truck outside, and the rest of that
            truck still goes. With nothing here the only exit was the browser's
            Back, and the load became unreachable: exactly the "stuck at the driver"
            Wyne hit. ⚠ The wording is the sentence from COPY-RULES §8, not an
            escape hatch. */}
        {ex && c.load && (
          <Btn
            height={56}
            fontSize={16}
            center
            testid="to-load"
            style={{ width: '100%', marginBottom: 10 }}
            onClick={() => router.push(`/handover/${c.load}`)}
          >
            The rest of the load still goes — back to the load sheet
          </Btn>
        )}
        <Btn
          kind="primary"
          center
          testid="onward"
          style={{ width: '100%' }}
          dim={!done}
          onClick={onward}
        >
          {ex
            ? 'Blocked — fetch the loading clerk'
            : done
              ? collection
                ? 'Hand to the customer'
                : c.load
                  ? 'Hand to the driver'
                  : 'Staged — back to the board'
              : `${units - bound} serial${units - bound === 1 ? '' : 's'} still to scan`}
        </Btn>
      </div>
    </>
  );
}
