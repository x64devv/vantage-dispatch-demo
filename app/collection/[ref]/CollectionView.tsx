'use client';

/* D-06 / SD-3 — a customer collects. Beat 6.
 *
 * ⚠⚠ THE SCREEN THAT DOES NOT EXIST AT TVSH TODAY. No driver, no truck, same
 * control: the same scan, the same four checks, the same condition photograph,
 * the same identity, the same signature, the same serial binding. It is the same
 * handover component the driver hand-over uses with the truck fields simply
 * absent — and that similarity IS the argument. One control, three recipients.
 *
 * ⚠ Roughly a third of consignments never see a truck. A delivery has a gate
 * pass, seals, a driver who signed for the load and a debrief. A collection has a
 * person walking out of a shop with a fridge, documented — if at all — on a
 * Confirmation Note whose printed fields are "Name of Driver" and "Truck Reg
 * Number". That is where shrinkage is easiest today and nobody is looking.
 *
 * ⚠⚠ NO PHOTOGRAPH OF AN IDENTITY DOCUMENT, REAL OR STOCK, ANYWHERE IN THIS
 * BUILD. The slot is a CAMERA → TAKEN placeholder. The console and the driver app
 * make the same call. A photograph of somebody's ID is personal data and its
 * access should be narrower than a photograph of a fridge, not casually browsable
 * in a boardroom.
 */

import { useRouter } from 'next/navigation';
import { collectionByRef, consignment, DAY } from '@/lib/day';
import { useDesk } from '@/lib/state';
import Signature from '@/components/Signature';
import {
  ACC, AC7, BG, Btn, Card, DIV, Fact, Grade, MONO, Mono, Note, SURF, SectionHead, Tag,
} from '@/components/ui';

export default function CollectionView({ refId }: { refId: string }) {
  const router = useRouter();
  const { s, set, completeCollection } = useDesk();
  const col = collectionByRef(refId);
  const c = col ? consignment(col.consignment) : undefined;

  if (!col || !c) return <div style={{ padding: 40 }}><Note>No collection {refId}.</Note></div>;

  const done = !!s.collectionsDone[refId];
  const idPhoto = !!s.collectionIdPhoto[refId];
  const ink = !!s.collectionSigInk[refId];
  const serialised = c.lines.filter((l) => l.serialised);
  const otherRef =
    refId === 'COL-VE-2026-08-20-0007' ? 'COL-VE-2026-08-20-0006' : 'COL-VE-2026-08-20-0007';

  /* ⚠ The gate: identity photographed AND ink on the canvas. Every serialised
     line has already been bound by the same scan a truck-load gets — the day's
     record holds those binds, so the screen shows them rather than asking the
     clerk to do it twice. */
  const canComplete = idPhoto && ink;
  const missing = !idPhoto && !ink
    ? 'the ID photograph and a signature'
    : !idPhoto
      ? 'the ID photograph'
      : 'a signature';

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ── Left: what is being handed over ───────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }} className="scr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <Mono style={{ font: '600 12px Archivo, system-ui', opacity: 0.6 }}>
              {col.ref} · {c.id}
            </Mono>
            <div style={{ font: '800 30px/1.05 Archivo, system-ui', letterSpacing: '-.02em', marginTop: 4 }}>
              {c.customer.name}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
              {col.dispatchPoint} · {col.at} · held {c.heldDays} days
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Tag tone="neutral">No vehicle</Tag>
            <Tag tone={c.tender === 'HTB' ? 'accent' : 'neutral'}>{c.tender}</Tag>
            <Tag tone="outline">Sold at {c.sellingBranch}</Tag>
          </div>
        </div>

        {/* ⚠ The truck fields are ABSENT, not blanked out. Nothing on this screen
            says "Vehicle: —". A collection has no vehicle; a field that admits one
            and leaves it empty is the paper Confirmation Note's mistake. */}
        <div style={{ height: 2, background: DIV }} />

        <SectionHead right={<Mono style={{ fontSize: 12, opacity: 0.6 }}>{c.lines.length} lines</Mono>}>
          What is leaving the building
        </SectionHead>
        <div style={{ borderTop: `1px solid ${DIV}` }}>
          {c.lines.map((line) => {
            const scan = col.serialScans.find((x) => x.line === line.no);
            return (
              <div key={line.no} style={{ padding: '12px 0', borderBottom: `1px solid ${DIV}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <div style={{ font: '600 15px Archivo, system-ui' }}>{line.desc}</div>
                  <Mono style={{ fontSize: 13, opacity: 0.7 }}>qty {line.qty}</Mono>
                </div>
                <Mono style={{ fontSize: 12, opacity: 0.55 }}>{line.sku}</Mono>
                <div style={{ marginTop: 8 }}>
                  {line.serialised && scan ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }} data-testid="collection-serial">
                      <Mono style={{ font: '800 16px Archivo, system-ui' }}>{scan.serial}</Mono>
                      <Grade capturedBy={scan.capturedBy} />
                      <Tag tone="neutral">Condition {scan.condition}</Tag>
                      {scan.conditionPhoto && <Tag tone="outline">Photographed</Tag>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, opacity: 0.72 }}>
                      Confirmed by quantity and condition — <em>this line is not serialised, so no
                      serial gate applies</em>.
                    </div>
                  )}
                </div>
                {line.serialised && scan?.writes && (
                  <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {scan.writes.map((w) => (
                      <Mono key={w} style={{ fontSize: 11, opacity: 0.6 }}>
                        → {w}
                      </Mono>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {serialised.length === 0 && (
          <Note>
            ⚠ Nothing on this consignment is serialised — bed sets and lounge suites are not, and never
            will be. So this collection shows the control <strong>without</strong> a serial, which is
            the ordinary case for furniture and has to be a supported state. The fridge on{' '}
            <strong>CN-BR-000028</strong> is the serialised one.
          </Note>
        )}

        <div style={{ marginTop: 'auto' }}>
          <Note style={{ borderLeft: `4px solid ${ACC}`, background: BG }}>
            <strong style={{ fontFamily: 'Archivo, system-ui' }}>The contrast, said out loud.</strong>{' '}
            Today this is a person walking out of a shop with a{' '}
            {/* ⚠ The description is a catalogue string and keeps its own case —
                lower-casing it produced "fridge hisense 222l", which reads as a
                typo in the one sentence on this screen meant to be read aloud. */}
            <strong>{c.lines[0].desc}</strong>, recorded — if at all — on a Confirmation Note whose printed
            fields are <em>Name of Driver</em> and <em>Truck Reg Number</em>. The slip&rsquo;s only
            identity is a red serial in its corner, and the sample&rsquo;s{' '}
            <em>I.D Number</em> field was blank.
          </Note>
        </div>
      </div>

      {/* ── Right: identity, signature, note ──────────────────────────── */}
      <div style={{ flex: 'none', width: 430, borderLeft: `2px solid ${DIV}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }} className="scr">
        <div>
          <SectionHead>Who is taking it</SectionHead>
          <div style={{ display: 'grid', gap: 11, marginTop: 9 }}>
            <Fact label="Name" value={col.receiver.name} />
            <Fact label="ID number" value={col.receiver.idNo} mono />
            <Fact label="Relationship to the account" value={col.receiver.relationship} size={14} />
          </div>
          <button
            type="button"
            onClick={() => set({ collectionIdPhoto: { ...s.collectionIdPhoto, [refId]: true } })}
            data-testid="id-photo"
            style={{
              marginTop: 12,
              width: '100%',
              height: 108,
              border: `1px solid ${idPhoto ? DIV : ACC}`,
              background: idPhoto ? SURF : 'transparent',
              cursor: 'pointer',
              borderRadius: 0,
              color: 'inherit',
              font: '600 11px Archivo, system-ui',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            {idPhoto ? 'Taken · 1.2 MB' : 'Camera · photograph the ID'}
            <div className="pretty" style={{ font: '400 10.5px Archivo, system-ui', letterSpacing: 0, textTransform: 'none', opacity: 0.65, marginTop: 7, padding: '0 14px', lineHeight: 1.4 }}>
              A labelled placeholder. No photograph of an identity document, real or stock, appears
              anywhere in this build.
            </div>
          </button>
        </div>

        <div style={{ height: 1, background: DIV }} />

        <div>
          <SectionHead right={ink ? <Tag tone="ink">Signed</Tag> : undefined}>Signature, at the counter</SectionHead>
          <div style={{ marginTop: 9 }}>
            <Signature
              height={150}
              inked={ink}
              onInk={() => set({ collectionSigInk: { ...s.collectionSigInk, [refId]: true } })}
            />
          </div>
          <div className="pretty" style={{ fontSize: 11.5, opacity: 0.65, marginTop: 7, lineHeight: 1.45 }}>
            ⚠ The line set locks the moment it is signed — the digital equivalent of the big Z struck
            through the unused rows of the paper Confirmation Note.
          </div>
        </div>

        <div style={{ height: 1, background: DIV }} />

        <div>
          {done ? (
            <Card padding={14} style={{ borderColor: 'var(--color-text)' }}>
              <div style={{ font: '800 15px Archivo, system-ui' }}>Collection note {col.ref}</div>
              <div className="pretty" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 8, opacity: 0.78 }}>
                {col.serialScans.length
                  ? `${col.serialScans.length} serial bound to ${c.id} at a counter, with no truck involved at any point.`
                  : `${c.lines.length} line confirmed by count. Nothing here is serialised, and the record says so.`}{' '}
                Identity read and photographed, signed at {col.at}.
              </div>
            </Card>
          ) : (
            <Btn
              kind="primary"
              center
              fontSize={15}
              testid="complete"
              dim={!canComplete}
              onClick={() => completeCollection(refId)}
            >
              {canComplete ? 'Hand over and raise the collection note' : `Missing ${missing}`}
            </Btn>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={() => router.push('/board')}>← The board</Btn>
          <Btn onClick={() => router.push(`/collection/${otherRef}`)}>
            The other collection →
          </Btn>
        </div>

        <Note>
          ⚠ TVSH prints on every invoice that goods not collected within two weeks attract a{' '}
          <strong>3% penalty</strong>. This one has been held <Mono>{c.heldDays}</Mono> days
          {c.collectionDueBy ? <> · due by <Mono>{c.collectionDueBy}</Mono></> : null}. There are{' '}
          <Mono>{DAY.consignments.filter((x) => x.lane === 'collection').length}</Mono> waiting on this
          branch&rsquo;s board this morning.
        </Note>
      </div>
    </div>
  );
}
