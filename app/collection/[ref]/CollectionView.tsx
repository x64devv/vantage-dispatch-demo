'use client';

/* Step 3, the other one — HAND TO THE CUSTOMER. Beat 6.
 *
 * ⚠⚠ THE SCREEN THAT DOES NOT EXIST AT TVSH TODAY. No driver, no truck, same
 * control: the same verification, the same scan, the same identity, the same
 * signature, the same binding. It is the driver hand-over with the truck fields
 * simply absent — and that similarity IS the argument. One control, two
 * recipients.
 *
 * ⚠ The truck fields are ABSENT, not blanked. Nothing here says "Vehicle: —".
 * A field that admits a vehicle and leaves it empty is the paper Confirmation
 * Note's own mistake: its printed fields are "Name of Driver" and "Truck Reg
 * Number", which is why a collection is documented on a form that does not fit.
 *
 * ⚠⚠ NO PHOTOGRAPH OF AN IDENTITY DOCUMENT, REAL OR STOCK, ANYWHERE IN THIS
 * BUILD. The slot is a CAMERA → TAKEN placeholder and says so.
 */

import { useRouter } from 'next/navigation';
import { collectionByRef, consignment } from '@/lib/day';
import { useDesk } from '@/lib/state';
import Signature from '@/components/Signature';
import { ACC, BG, Btn, DIV, Fact, Grade, INK, Label, Mono, Note, Steps, SURF, Tag } from '@/components/ui';

export default function CollectionView({ refId }: { refId: string }) {
  const router = useRouter();
  const { s, set, completeCollection } = useDesk();
  const col = collectionByRef(refId);
  const c = col ? consignment(col.consignment) : undefined;

  if (!col || !c) return <div style={{ padding: 40 }}><Note>No collection {refId}.</Note></div>;

  const done = !!s.collectionsDone[refId];
  const idPhoto = !!s.collectionIdPhoto[refId];
  const ink = !!s.collectionSigInk[refId];
  const canComplete = idPhoto && ink;
  const missing = !idPhoto && !ink ? 'the ID photograph and a signature' : !idPhoto ? 'the ID photograph' : 'a signature';

  return (
    <>
      <Steps at={3} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* ── Left: what is leaving the building ──────────────────────── */}
        <div className="scr" style={{ flex: 1, minWidth: 0, padding: '22px 26px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <Tag tone="neutral">No vehicle</Tag>
            <Tag tone="outline">Sold at {c.sellingBranch}</Tag>
            <Tag tone="outline">Held {c.heldDays} days</Tag>
          </div>

          <Label>What is leaving the building</Label>
          <div style={{ marginTop: 12 }}>
            {c.lines.map((line) => {
              const scan = col.serialScans.find((x) => x.line === line.no);
              return (
                <div key={line.no} style={{ padding: '16px 0', borderBottom: `1px solid ${DIV}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <Mono style={{ font: '700 24px Archivo, system-ui', flex: 'none', width: 42 }}>{line.qty}</Mono>
                    <div style={{ font: '700 22px/1.25 Archivo, system-ui', flex: 1, minWidth: 0 }}>{line.desc}</div>
                  </div>
                  <div style={{ marginLeft: 60, marginTop: 8 }}>
                    {line.serialised && scan ? (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} data-testid="collection-serial">
                        <Mono style={{ font: '700 20px Archivo, system-ui' }}>{scan.serial}</Mono>
                        <Grade capturedBy={scan.capturedBy} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 17, opacity: 0.68 }}>
                        Not serialised — confirmed by count at verification
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 22 }}>
            <Note style={{ borderLeft: `6px solid ${ACC}`, background: BG }}>
              Today this is a person walking out of a shop with a{' '}
              <strong>{c.lines[0].desc}</strong>, recorded — if at all — on a Confirmation Note whose
              printed fields are <em>Name of Driver</em> and <em>Truck Reg Number</em>.
            </Note>
          </div>
        </div>

        {/* ── Right: who is taking it ─────────────────────────────────── */}
        <div className="scr" style={{ flex: 'none', width: 466, borderLeft: `2px solid ${DIV}`, padding: '22px 26px', overflowY: 'auto' }}>
          <Label>Who is taking it</Label>
          <div style={{ margin: '10px 0 16px' }}>
            <div style={{ font: '800 30px/1.15 Archivo, system-ui', letterSpacing: '-.02em' }}>
              {col.receiver.name}
            </div>
            {/* ⚠ The ID number is the only field that proves WHO took the goods
                when the signature is a scrawl and the name is not the account
                holder. The paper Confirmation Note has the field and the sample
                had it blank. */}
            <Fact label="ID number" value={col.receiver.idNo} size={22} mono style={{ marginTop: 14 }} />
          </div>

          <button
            type="button"
            onClick={() => set({ collectionIdPhoto: { ...s.collectionIdPhoto, [refId]: true } })}
            data-testid="id-photo"
            style={{
              width: '100%',
              minHeight: 96,
              border: `2px solid ${idPhoto ? DIV : ACC}`,
              background: idPhoto ? SURF : 'transparent',
              cursor: 'pointer',
              borderRadius: 0,
              color: 'inherit',
              font: '700 16px Archivo, system-ui',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              padding: 14,
            }}
          >
            {idPhoto ? 'Taken · 1.2 MB' : 'Camera · photograph the ID'}
            <div style={{ font: '400 14px Archivo, system-ui', letterSpacing: 0, textTransform: 'none', opacity: 0.65, marginTop: 7 }}>
              A labelled placeholder. No photograph of an identity document appears in this build.
            </div>
          </button>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>Signature</Label>
              {ink && <Tag tone="ink">Signed</Tag>}
            </div>
            <div style={{ marginTop: 10 }}>
              <Signature
                height={160}
                inked={ink}
                onInk={() => set({ collectionSigInk: { ...s.collectionSigInk, [refId]: true } })}
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            {done ? (
              <>
                <div style={{ font: '800 22px Archivo, system-ui' }}>Collection note raised</div>
                <Mono style={{ fontSize: 18, opacity: 0.75, display: 'block', marginTop: 6 }}>{col.ref}</Mono>
                <Btn kind="primary" center style={{ width: '100%', marginTop: 18 }} onClick={() => router.push('/board')}>
                  Back to the board
                </Btn>
              </>
            ) : (
              /* ⚠ Disabled = dimmed AND a label naming what is missing. */
              <Btn
                kind="primary"
                center
                testid="complete"
                style={{ width: '100%' }}
                dim={!canComplete}
                onClick={() => completeCollection(refId)}
              >
                {canComplete ? 'Hand over and raise the note' : `Missing ${missing}`}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
