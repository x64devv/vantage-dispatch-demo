'use client';

/* D-02 / SD-4 — one consignment, opened from the board, with the fiscal invoice
 * attached and viewable in place.
 *
 * ⚠⚠ THE PIN GRADE IS THE DETAIL TO GET RIGHT. Nancy's address was typed by a
 * salesperson standing in a shop, so it shows as the lowest of three grades and
 * says what that means. TRP-001 §8.1: two grades of a fact are two visibly
 * different things. A driver reading "Salesperson" knows to phone before he
 * turns off the main road; a driver reading nothing does not.
 *
 * ⚠⚠ AND THE INVOICE IS ATTACHED, NEVER RE-RENDERED. It carries a ZIMRA fiscal
 * signature and a QR code. A rebuilt invoice that differs from the fiscal one by
 * a cent is a dispute with a regulator in it. This build has no document store,
 * so the panel says exactly that instead of drawing a convincing forgery of one.
 */

import { useRouter } from 'next/navigation';
import {
  PIN_GRADE, consignment, load as loadById, qtyConfirmFor, serialsFor,
} from '@/lib/day';
import { ACC, AC7, Btn, Card, DIV, Fact, Grade, MONO, Mono, Note, SURF, SectionHead, Tag } from '@/components/ui';

export default function ConsignmentView({ id }: { id: string }) {
  const router = useRouter();
  const c = consignment(id);

  if (!c) {
    return (
      <div style={{ padding: 40 }}>
        <Note>No consignment {id} on this branch&rsquo;s board.</Note>
      </div>
    );
  }

  const pin = PIN_GRADE[c.address.pinGrade];
  const l = c.load ? loadById(c.load) : null;
  const total = c.lines.reduce((n, x) => n + (x.unitPrice ? Number(x.unitPrice) * x.qty : 0), 0);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ── Left: the consignment ─────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }} className="scr">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Mono style={{ font: '600 13px Archivo, system-ui', opacity: 0.6 }}>{c.id}</Mono>
            <div style={{ font: '800 30px/1.05 Archivo, system-ui', letterSpacing: '-.02em', marginTop: 4 }}>
              {c.customer.name}
            </div>
            <Mono style={{ fontSize: 13, opacity: 0.7 }}>{c.customer.phone}</Mono>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* ⚠ CustomerDelivery is a code, not a label. Printing the enum
                gave "CUSTOMERDELIVERY" on a boardroom screen. */}
            <Tag tone="neutral">{c.movementType.replace(/([a-z])([A-Z])/g, '$1 $2')}</Tag>
            <Tag tone={c.tender === 'HTB' ? 'accent' : 'neutral'}>{c.tender === 'None' ? 'Transfer' : c.tender}</Tag>
            {c.sellingBranch !== c.sourceBranch && <Tag tone="accent">Sold at {c.sellingBranch}</Tag>}
          </div>
        </div>

        {/* Address and the pin grade */}
        <Card padding={14}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <Fact label="Address" value={c.address.full} size={15} />
              <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.65 }}>
                Zone {c.address.zone} · promised {c.promisedDate}
                {c.window && c.window !== '—' ? ` · ${c.window}` : ''}
              </div>
            </div>
            <div style={{ flex: 'none', textAlign: 'right' }} data-testid="pin-grade">
              <div style={{ font: '600 10px Archivo, system-ui', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.5 }}>
                Address pin
              </div>
              {/* ⚠ Three grades, distinguishable at a glance without a legend: one
                  bar filled, two, or three. The word is there as well, because a
                  glance is not evidence. */}
              <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', margin: '7px 0 5px' }}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    style={{
                      display: 'block',
                      width: 18,
                      height: 8,
                      background: n <= pin.rank ? (pin.rank === 1 ? AC7 : 'var(--color-text)') : 'transparent',
                      border: `1px solid ${DIV}`,
                    }}
                  />
                ))}
              </div>
              <div style={{ font: '600 13px Archivo, system-ui' }}>{pin.label}</div>
              <div className="pretty" style={{ fontSize: 11.5, opacity: 0.65, maxWidth: 210, marginTop: 2 }}>
                {pin.note}
              </div>
            </div>
          </div>
        </Card>

        {/* Lines */}
        <div>
          <SectionHead right={<Mono style={{ fontSize: 12, opacity: 0.6 }}>{c.lines.length} lines</Mono>}>
            What was sold
          </SectionHead>
          <div style={{ marginTop: 8, borderTop: `2px solid ${DIV}` }}>
            {c.lines.map((line) => {
              const sas = serialsFor(c.id, line.no);
              const qty = qtyConfirmFor(c.id, line.no);
              return (
                <div key={line.no} style={{ padding: '12px 0', borderBottom: `1px solid ${DIV}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '600 15px Archivo, system-ui' }}>{line.desc}</div>
                      <Mono style={{ fontSize: 12, opacity: 0.6 }}>{line.sku}</Mono>
                    </div>
                    <Mono style={{ flex: 'none', font: '600 14px Archivo, system-ui' }}>
                      {line.qty}
                      {line.unitPrice ? ` @ ${Number(line.unitPrice).toFixed(2)}` : ''}
                    </Mono>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {line.serialised ? <Tag tone="neutral">Serialised</Tag> : <Tag tone="outline">Not serialised</Tag>}
                    {line.enclosedTruck && <Tag tone="outline">Enclosed truck</Tag>}
                    {line.crew ? <Tag tone="outline">{line.crew} crew</Tag> : null}
                  </div>
                  {/* ⚠ What is bound, said plainly. A line with nothing bound yet
                      says so; it does not go blank and let the eye fill it in. */}
                  <div style={{ marginTop: 8, fontSize: 12.5 }}>
                    {line.serialised ? (
                      sas.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {sas.map((sa) => (
                            <div key={sa.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <Mono style={{ font: '600 13px Archivo, system-ui' }}>{sa.serial}</Mono>
                              <Grade capturedBy={sa.capturedBy} />
                              <span style={{ opacity: 0.6, fontSize: 11.5 }}>
                                bound {sa.boundAt} at {sa.boundAtLocation} · {sa.loadUnit}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ opacity: 0.6 }}>No serial bound yet — it binds at the scan, not here.</span>
                      )
                    ) : qty ? (
                      <span style={{ opacity: 0.7 }}>
                        Confirmed by count at {qty.at} · condition {qty.condition} ·{' '}
                        <em>this line is not serialised, so no serial gate applies</em>
                      </span>
                    ) : (
                      <span style={{ opacity: 0.6 }}>
                        Confirms by quantity and condition — this line is not serialised.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
          {total > 0 && <Fact label="Goods" value={`USD ${total.toFixed(2)}`} mono />}
          {c.charge && <Fact label="Delivery charge" value={`${c.charge.currency} ${c.charge.amount}`} mono />}
          {c.cashAtDoor && <Fact label="To collect at the door" value={`${c.cashAtDoor.currency} ${c.cashAtDoor.amount}`} mono />}
          {c.htbContract && <Fact label="HTB contract" value={c.htbContract} mono />}
          <Fact label="Status" value={c.status} />
        </div>

        {c.cashAtDoor && (
          <Note>
            ⚠ <strong>{c.cashAtDoor.what}.</strong> This figure came down with the sale and it is not a
            balance. No screen in this estate subtracts one figure from another and shows the driver or
            the customer the answer.
          </Note>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
          <Btn onClick={() => router.push('/board')}>← Back to the board</Btn>
          {l && (
            <Btn kind="primary" onClick={() => router.push(`/scan/${l.id}`)}>
              Scan out on {l.id} →
            </Btn>
          )}
          {c.lane === 'collection' && (
            <Btn kind="primary" onClick={() => router.push('/collection/COL-VE-2026-08-20-0007')}>
              Hand to the customer →
            </Btn>
          )}
        </div>
      </div>

      {/* ── Right: the fiscal document ────────────────────────────────── */}
      <div style={{ flex: 'none', width: 400, borderLeft: `2px solid ${DIV}`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }} className="scr">
        <SectionHead>Attached document</SectionHead>

        {c.invoice ? (
          <>
            <Card padding={0} style={{ background: SURF }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DIV}` }}>
                <div style={{ font: '800 15px Archivo, system-ui' }}>Fiscal tax invoice</div>
                <Mono style={{ fontSize: 12.5, opacity: 0.7 }}>
                  {c.invoice.no} · {c.invoice.customerRef}
                </Mono>
              </div>
              <div style={{ padding: '14px 16px', display: 'grid', gap: 12 }}>
                <Fact label="Fiscal signature" value={c.invoice.fiscalSignature} size={14} mono />
                <Fact label="Fiscalisation device" value={c.invoice.device} size={14} mono />
                <Fact label="Selling branch" value={c.sellingBranch} size={14} />
              </div>
              {/* ⚠⚠ A LABELLED ABSENCE, NOT A DRAWING. The rule is: attach the
                  fiscal invoice, never re-render it. A demo that draws a
                  convincing invoice — QR block and all — is doing the exact thing
                  the rule forbids, and it would be the one screen in this build a
                  ZIMRA-literate person could call fake. */}
              <div
                data-testid="doc-placeholder"
                style={{
                  margin: '0 16px 16px',
                  border: `1px dashed ${DIV}`,
                  minHeight: 150,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 18,
                  textAlign: 'center',
                }}
              >
                <div className="pretty" style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.75, maxWidth: 280 }}>
                  <strong style={{ fontFamily: 'Archivo, system-ui' }}>The PDF as ZIMRA signed it</strong>
                  <br />
                  opens here, with its QR block. This build has no document store, so nothing is drawn
                  — a re-rendered invoice is precisely what the rule forbids.
                </div>
              </div>
            </Card>

            <Note>
              ⚠ The <strong>driver carries it too</strong>. One mechanism — the document travels with the
              job — covers customer deliveries, supplier collections and transfers, and it removes the
              case the workshop named: a driver using a supplier&rsquo;s own invoice because nothing was
              pre-loaded onto his device.
            </Note>
          </>
        ) : (
          <Note>
            {c.transferRef ? (
              <>
                An inter-branch transfer, not a sale. Its document is{' '}
                <Mono>{c.transferRef}</Mono> — an Issue Distribution Order, and the receiving branch
                scans against it.
              </>
            ) : (
              'No fiscal document on this consignment.'
            )}
          </Note>
        )}

        {c.receiptScanAtFarEnd && (
          <Note style={{ borderLeft: `4px solid ${ACC}`, background: 'var(--color-bg)' }}>
            <strong style={{ fontFamily: 'Archivo, system-ui' }}>Two scans, two ends.</strong> This one
            is scanned out here and scanned in at Borrowdale. They agree, or there is an exception with a
            person&rsquo;s name on it. Warehouse to branch is the highest-volume path in the business and
            the one whose written check is weakest.
          </Note>
        )}

        {c.heldDays != null && (
          <Note>
            Held <Mono>{c.heldDays}</Mono> days. TVSH prints on every invoice that goods not collected
            within two weeks attract a <strong>3% penalty</strong>. Nothing has ever watched that clock.
          </Note>
        )}
      </div>
    </div>
  );
}
