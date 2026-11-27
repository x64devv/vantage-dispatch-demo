'use client';

/* Step 3, the third one — HAND TO A HIRED CARRIER. Phase 2, Gain demo (URD 10.12
 * "transporter management").
 *
 * ⚠⚠ A carrier was never on our app. Once his truck leaves the gate there is no
 * geofence, no driver phone and no proof at the door — so what is captured HERE
 * is the whole evidentiary basis for any claim against him: the load photograph,
 * the gate pass, and his signature against an ID number. The screen says that
 * plainly rather than implying we can follow him.
 *
 * ⚠ He signs on T118, the dispatch tablet, as our own driver does — one device,
 * two people at one counter, and the record says so.
 *
 * ⚠⚠ NO PHOTOGRAPH OF A REAL LOAD OR A REAL IDENTITY DOCUMENT. The slot is a
 * CAMERA → TAKEN placeholder and says so.
 */

import { useRouter } from 'next/navigation';
import { DESK, carrierHandoverFor, consignment } from '@/lib/day';
import { useDesk } from '@/lib/state';
import Signature from '@/components/Signature';
import { ACC, BG, Btn, DIV, Fact, Label, Mono, Note, Steps, SURF, Tag } from '@/components/ui';

export default function CarrierView({ id }: { id: string }) {
  const router = useRouter();
  const { s, set } = useDesk();
  const c = consignment(id);
  const ho = carrierHandoverFor(id);

  if (!c || !ho) return <div style={{ padding: 40 }}><Note>No carrier hand-over for {id}.</Note></div>;

  const verified = !!s.verified[c.id];
  const done = !!s.carrierDone[ho.ref];
  const photo = !!s.carrierPhoto[ho.ref];
  const ink = !!s.carrierSigInk[ho.ref];
  const canComplete = verified && photo && ink;
  const missing = !verified
    ? 'verification of the goods'
    : !photo && !ink
      ? 'the load photograph and his signature'
      : !photo
        ? 'the load photograph'
        : 'his signature';

  return (
    <>
      <Steps at={3} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* ── Left: what goes on his truck ─────────────────────────────── */}
        <div className="scr" style={{ flex: 1, minWidth: 0, padding: '22px 26px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <Tag tone="neutral">Hired carrier</Tag>
            <Tag tone="outline">Not tracked after the gate</Tag>
            <Tag tone="outline">To {c.address.suburb}</Tag>
          </div>

          <Label>What goes on his truck</Label>
          <div style={{ marginTop: 12 }}>
            {c.lines.map((line) => (
              <div key={line.no} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 0', borderBottom: `1px solid ${DIV}` }}>
                <Mono style={{ font: '700 24px Archivo, system-ui', flex: 'none', width: 42 }}>{line.qty}</Mono>
                <div style={{ font: '700 22px/1.25 Archivo, system-ui', flex: 1, minWidth: 0 }}>{line.desc}</div>
                <Tag tone="outline" style={{ flex: 'none' }}>Counted</Tag>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 40, marginTop: 22, flexWrap: 'wrap' }}>
            <Fact label="Carrier" value={ho.carrier.name} size={20} />
            <Fact label="Vehicle" value={ho.carrier.vehicle} size={20} mono />
            <Fact label="Gate pass" value={ho.gatePass} size={20} mono />
            <Fact label="Proof due back" value={ho.proofDue} size={20} mono />
          </div>

          <div style={{ marginTop: 22 }}>
            <Note style={{ borderLeft: `6px solid ${ACC}`, background: BG }}>
              After the gate there is no tracking and no proof at the door. What is captured on this
              screen is the whole record until his signed delivery note comes back.
            </Note>
          </div>
        </div>

        {/* ── Right: the evidence, and his signature ───────────────────── */}
        <div className="scr" style={{ flex: 'none', width: 466, borderLeft: `2px solid ${DIV}`, padding: '22px 26px', overflowY: 'auto' }}>
          <Label>Who is taking it</Label>
          <div style={{ margin: '10px 0 16px' }}>
            <div style={{ font: '800 30px/1.15 Archivo, system-ui', letterSpacing: '-.02em' }}>{ho.carrierDriver.name}</div>
            <div style={{ fontSize: 17, opacity: 0.65, marginTop: 4 }}>Driver for {ho.carrier.name}</div>
            <Fact label="ID number" value={ho.carrierDriver.idNo} size={22} mono style={{ marginTop: 14 }} />
          </div>

          <button
            type="button"
            onClick={() => set({ carrierPhoto: { ...s.carrierPhoto, [ho.ref]: true } })}
            data-testid="load-photo"
            style={{
              width: '100%',
              minHeight: 96,
              border: `2px solid ${photo ? DIV : ACC}`,
              background: photo ? SURF : 'transparent',
              cursor: 'pointer',
              borderRadius: 0,
              color: 'inherit',
              font: '700 16px Archivo, system-ui',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              padding: 14,
            }}
          >
            {photo ? 'Taken · 2.1 MB' : 'Camera · photograph the load on his truck'}
            <div style={{ font: '400 14px Archivo, system-ui', letterSpacing: 0, textTransform: 'none', opacity: 0.65, marginTop: 7 }}>
              A labelled placeholder. No real photograph appears in this build.
            </div>
          </button>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>His signature · on {DESK.terminal.terminalNo}</Label>
              {ink && <Tag tone="ink">Signed</Tag>}
            </div>
            <div style={{ marginTop: 10 }}>
              <Signature
                height={150}
                inked={ink}
                onInk={() => set({ carrierSigInk: { ...s.carrierSigInk, [ho.ref]: true } })}
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            {done ? (
              <div data-testid="carrier-done">
                <div style={{ font: '800 22px Archivo, system-ui' }}>Handed to {ho.carrier.name}</div>
                <Mono style={{ fontSize: 17, opacity: 0.75, display: 'block', marginTop: 6 }}>
                  {ho.ref}
                </Mono>
                <Mono style={{ fontSize: 17, opacity: 0.75, display: 'block', marginTop: 2 }}>{ho.gatePass}</Mono>
                <div style={{ fontSize: 16, opacity: 0.7, marginTop: 8, lineHeight: 1.45 }}>
                  Signed by {ho.carrierDriver.name} on {DESK.terminal.terminalNo}, witnessed by{' '}
                  {DESK.clerk.name}. Proof of delivery is due back by {ho.proofDue}.
                </div>
                <Btn kind="primary" center style={{ width: '100%', marginTop: 18 }} onClick={() => router.push('/board')}>
                  Back to the board
                </Btn>
              </div>
            ) : (
              /* ⚠ Disabled = dimmed AND a label naming what is missing. */
              <Btn
                kind="primary"
                center
                testid="carrier-complete"
                style={{ width: '100%' }}
                dim={!canComplete}
                onClick={() => set({ carrierDone: { ...s.carrierDone, [ho.ref]: true } })}
              >
                {canComplete ? 'Hand over and raise the gate pass' : `Missing ${missing}`}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
