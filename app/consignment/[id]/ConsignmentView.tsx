'use client';

/* Step 1 — VERIFY. What was sold, and is this it?
 *
 * ⚠ Three checks, and they are the three a person can make by LOOKING:
 * the right goods, the right count, undamaged. The fourth check — the serial —
 * cannot be answered by looking, so it is the next screen rather than a fourth
 * tick on this one. Splitting them that way is what makes the block on the next
 * screen land: the goods can pass every check a human eye can make and still be
 * the wrong physical unit.
 *
 * ⚠ The address pin carries its grade. Nancy's was typed by a salesperson
 * standing in a shop, so it shows as the lowest of three and says what that is
 * worth. A driver reading "Salesperson" phones before he turns off the main road.
 */

import { useRouter } from 'next/navigation';
import { PIN_GRADE, collectionFor, consignment } from '@/lib/day';
import {
  CHECKS, anyCheckNo, checksAnswered, hasSerialisedLine, scanComplete, useDesk,
} from '@/lib/state';
import { ACC, AC7, BG, Btn, DIV, Fact, Label, MONO, Mono, Note, Steps, SURF, Tag, YesNo } from '@/components/ui';

export default function ConsignmentView({ id }: { id: string }) {
  const router = useRouter();
  const { s, answer, verify } = useDesk();
  const c = consignment(id);

  if (!c) return <div style={{ padding: 40 }}><Note>No consignment {id} on this branch&rsquo;s board.</Note></div>;

  const pin = PIN_GRADE[c.address.pinGrade];
  const answered = checksAnswered(s, c.id);
  const refused = anyCheckNo(s, c.id);
  const serialised = hasSerialisedLine(c);
  const done = scanComplete(s, c);
  const collection = collectionFor(c.id);

  /* Where "verified" goes next: the serial scan if anything on it is serialised,
     otherwise straight to whoever is taking it. */
  const onward = () => {
    verify(c.id);
    if (serialised) return router.push(`/scan/${c.id}`);
    if (collection) return router.push(`/collection/${collection.ref}`);
    if (c.load) return router.push(`/handover/${c.load}`);
    return router.push('/board');
  };

  const onwardLabel = serialised
    ? 'Verified — scan the serials'
    : collection
      ? 'Verified — hand to the customer'
      : c.load
        ? 'Verified — hand to the driver'
        /* ⚠ Verified and staged, with nobody here yet to take it. That is the
           ordinary state of the collection lane, not a dead end. */
        : c.lane === 'collection'
          ? 'Verified — waiting for the customer'
          : 'Verified — stage it for a trip';

  return (
    <>
      <Steps at={1} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* ── Left: what was sold ─────────────────────────────────────── */}
        <div className="scr" style={{ flex: 1, minWidth: 0, padding: '22px 26px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <Fact label="Address" value={c.address.full} size={20} style={{ flex: 1, minWidth: 300 }} />
            <div>
              <Label>Address pin</Label>
              <div style={{ display: 'flex', gap: 4, margin: '9px 0 6px' }}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    style={{
                      display: 'block',
                      width: 26,
                      height: 11,
                      background: n <= pin.rank ? (pin.rank === 1 ? AC7 : 'var(--color-text)') : 'transparent',
                      border: `2px solid ${DIV}`,
                    }}
                  />
                ))}
              </div>
              <div data-testid="pin-grade" style={{ font: '700 18px Archivo, system-ui' }}>{pin.label}</div>
            </div>
          </div>

          <div style={{ height: 2, background: DIV, margin: '20px 0' }} />

          <Label>What was sold</Label>
          <div style={{ marginTop: 12 }}>
            {c.lines.map((line) => (
              <div
                key={line.no}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '16px 0',
                  borderBottom: `1px solid ${DIV}`,
                }}
              >
                <Mono style={{ font: '700 22px Archivo, system-ui', flex: 'none', width: 40 }}>{line.qty}</Mono>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 21px/1.25 Archivo, system-ui' }}>{line.desc}</div>
                  <Mono style={{ fontSize: 15, opacity: 0.55 }}>{line.sku}</Mono>
                </div>
                {/* ⚠ Serialised or not, on the line, before anything is scanned.
                    Serialisation is a per-item property, never a global mode —
                    the catalogue is bed sets as well as televisions. */}
                <Tag tone={line.serialised ? 'neutral' : 'outline'} style={{ flex: 'none' }}>
                  {line.serialised ? 'Serialised' : 'No serial'}
                </Tag>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 40, marginTop: 22, flexWrap: 'wrap' }}>
            <Fact label="Promised" value={`${c.promisedDate}${c.window && c.window !== '—' ? ` · ${c.window}` : ''}`} size={19} mono />
            <Fact label="Tender" value={c.tender === 'None' ? 'Branch transfer' : c.tender} size={19} />
            {c.invoice && <Fact label="Invoice" value={c.invoice.no} size={19} mono />}
            {c.cashAtDoor && (
              <Fact label="To collect at the door" value={`${c.cashAtDoor.currency} ${c.cashAtDoor.amount}`} size={19} mono />
            )}
          </div>
        </div>

        {/* ── Right: the three checks, and the way on ─────────────────── */}
        <div style={{ flex: 'none', width: 466, borderLeft: `2px solid ${DIV}`, display: 'flex', flexDirection: 'column' }}>
          <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 26px' }}>
            <Label>Check it against the trolley</Label>
            <div style={{ marginTop: 14 }}>
              {CHECKS.map((chk) => (
                <div
                  key={chk.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${DIV}` }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '700 20px Archivo, system-ui' }}>{chk.label}</div>
                    <div className="pretty" style={{ fontSize: 15, opacity: 0.6, marginTop: 3 }}>{chk.hint}</div>
                  </div>
                  <YesNo
                    testid={`check-${chk.id}`}
                    value={s.checks[c.id]?.[chk.id]}
                    onPick={(v) => answer(c.id, chk.id, v)}
                  />
                </div>
              ))}
            </div>

            {/* ⚠ A single "no" is not an error and is not styled as one. It is an
                outcome: the goods do not leave, and somebody is told. */}
            {refused && (
              <Note style={{ marginTop: 18, borderLeft: `6px solid ${ACC}`, background: BG }}>
                <strong style={{ fontFamily: 'Archivo, system-ui' }}>It does not go out.</strong> Send the
                trolley back and tell the branch manager. Nothing here is a skip.
              </Note>
            )}

            {c.invoice && (
              <div style={{ marginTop: 22 }}>
                <Label>Attached</Label>
                {/* ⚠⚠ Attach the fiscal invoice; never re-render it. It carries a
                    ZIMRA signature and a QR code, and a rebuilt invoice that
                    differs by a cent is a dispute with a regulator in it. This
                    build has no document store, so it names the absence. */}
                <div
                  data-testid="doc-placeholder"
                  style={{ marginTop: 10, border: `2px dashed ${DIV}`, padding: 18, background: SURF }}
                >
                  <div style={{ font: '700 19px Archivo, system-ui' }}>Fiscal tax invoice {c.invoice.no}</div>
                  <Mono style={{ fontSize: 15, opacity: 0.7, display: 'block', marginTop: 5 }}>
                    {c.invoice.fiscalSignature}
                  </Mono>
                  <div className="pretty" style={{ fontSize: 14, opacity: 0.65, marginTop: 9, lineHeight: 1.45 }}>
                    The PDF as ZIMRA signed it opens here. Nothing is drawn — a re-rendered invoice is
                    what the rule forbids.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ⚠ Disabled = dimmed AND a label naming what is missing. */}
          <div style={{ flex: 'none', padding: '18px 26px', borderTop: `2px solid ${DIV}` }}>
            <Btn
              kind="primary"
              center
              testid="verify"
              style={{ width: '100%' }}
              dim={answered < CHECKS.length || refused}
              onClick={onward}
            >
              {refused
                ? 'One check says no — it does not go out'
                : answered < CHECKS.length
                  ? `${CHECKS.length - answered} check${CHECKS.length - answered === 1 ? '' : 's'} left`
                  : done
                    ? 'Already scanned — continue'
                    : onwardLabel}
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}
