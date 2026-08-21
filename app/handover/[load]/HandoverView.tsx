'use client';

/* D-05 — hand the load to the driver. The store half of beat 7.
 *
 * ⚠⚠ THIS SCREEN HAS NO SIGNATURE PAD ON IT, AND THAT IS THE ARGUMENT.
 * The driver does not sign on the store's tablet. He accepts custody on his own
 * phone, which is a separate commissioned terminal with his name on it — two
 * people, two devices, one serial (TRP-002 §1.3). A signature pad here would let
 * one person do both halves, which is exactly the control that is missing today:
 * the driver currently verifies his own load.
 *
 * So the tablet does what it can do — attaches the seals, raises the gate pass,
 * and then waits. The waiting state is not a gap in the demo. It is the point.
 *
 * ⚠ The Seal procedure exists in exactly one SOP (Van Assistant, Appendix V) and
 * is TVSH's nearest thing to a gate pass: driver, assistant, dispatch clerk and
 * security witness the doors closed together, and the Vehicle Seal Form is signed
 * by driver and security. This is that procedure with the paper removed — not a
 * new control. ⚠ The Loading Clerk's own SOP never mentions sealing at all.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { consignmentsOnLoad, load as loadById, loadTally } from '@/lib/day';
import { canSeal, loadProgress, sealMissing, useDesk } from '@/lib/state';
import { ACC, AC7, BG, Btn, Card, DIV, Fact, MONO, Mono, Note, SURF, SectionHead, Tag } from '@/components/ui';

/* ⚠ Two reasons, chosen from a list rather than typed — the same rule as the
   fault field on an exception. A typed reason cannot be counted, and a reason
   nobody counts is a reason nobody fixes. */
const REFUSALS = [
  'The count is short — a line is not on the truck',
  'A unit is damaged and he will not carry it',
];

export default function HandoverView({ loadId }: { loadId: string }) {
  const router = useRouter();
  const [refused, setRefused] = useState<string | null>(null);
  const { s, sealLoad, handOver } = useDesk();
  const l = loadById(loadId);

  if (!l) return <div style={{ padding: 40 }}><Note>No load {loadId}.</Note></div>;

  const tally = loadTally(loadId);
  const prog = loadProgress(s, loadId);
  const sealed = !!s.sealed[loadId];
  const handed = !!s.handedOver[loadId];
  const ready = canSeal(s, loadId);
  const cs = consignmentsOnLoad(loadId);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ── Left: the load sheet being handed over ────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }} className="scr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <Mono style={{ font: '600 12px Archivo, system-ui', opacity: 0.6 }}>{loadId} · {l.trip}</Mono>
            <div style={{ font: '800 30px/1.05 Archivo, system-ui', letterSpacing: '-.02em', marginTop: 4 }}>
              {l.vehicle.reg} · {l.vehicle.fleetNo}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
              {l.vehicle.make} · {l.zone}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'grid', gap: 10 }}>
            <Fact label="Driver" value={l.driver.name} />
            <Fact label="Crew" value={l.crew.name} />
          </div>
        </div>

        <div style={{ height: 2, background: DIV }} />

        <SectionHead right={<Mono style={{ fontSize: 12, opacity: 0.6 }}>{prog.serialsBound} of {tally.serialUnits} serials</Mono>}>
          What he is being given
        </SectionHead>
        <div style={{ borderTop: `1px solid ${DIV}` }}>
          {cs.map((c) => (
            <div key={c.id} style={{ padding: '11px 0', borderBottom: `1px solid ${DIV}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <div style={{ font: '600 14px Archivo, system-ui' }}>
                  {c.customer.name} <span style={{ opacity: 0.55, fontWeight: 400 }}>· {c.address.suburb}</span>
                </div>
                <Mono style={{ fontSize: 12, opacity: 0.6 }}>
                  {c.id} · unit {c.loadUnit}
                </Mono>
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 3 }}>
                {c.lines.map((x) => x.desc).join(' · ')}
              </div>
            </div>
          ))}
        </div>

        {refused && (
          <Note style={{ borderLeft: `4px solid ${ACC}`, background: BG }}>
            <strong style={{ fontFamily: 'Archivo, system-ui' }}>Refused at the door.</strong>{' '}
            {refused} · recorded against {loadId} with both names on it, at the warehouse, with both
            people standing there — not discovered at a customer&rsquo;s house three hours later. The
            goods stay in this building.
          </Note>
        )}
      </div>

      {/* ── Right: seals, gate pass, and the wait ─────────────────────── */}
      <div style={{ flex: 'none', width: 430, borderLeft: `2px solid ${DIV}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }} className="scr">
        {/* 1. Seals */}
        <div>
          <SectionHead>1 · Seals</SectionHead>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {l.seals.length ? (
              l.seals.map((sl) => (
                <div key={sl} style={{ border: `1px solid ${sealed ? 'var(--color-text)' : DIV}`, padding: '10px 14px', background: sealed ? SURF : 'transparent' }}>
                  <Mono style={{ font: '600 15px Archivo, system-ui' }}>{sl}</Mono>
                </div>
              ))
            ) : (
              <Note>
                No seals on this load. It is held while <Mono>EX-000029114</Mono> is open — a load with a
                blocked line does not get sealed, and the truck leaves without that line.
              </Note>
            )}
          </div>
          {l.seals.length > 0 && (
            <div className="pretty" style={{ fontSize: 11.5, opacity: 0.65, marginTop: 8, lineHeight: 1.45 }}>
              Attached in the presence of the driver and security, doors witnessed closed by all four.
              The Vehicle Seal Form is signed by{' '}
              <strong>{(l.handover?.sealFormSignedBy ?? []).join(' and ')}</strong>.
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <Btn
              kind="primary"
              testid="seal"
              dim={!ready || sealed}
              onClick={() => sealLoad(loadId)}
              fontSize={14}
            >
              {sealed
                ? `Sealed at ${l.sealedAt} · custody in the transit bin`
                : ready
                  ? 'Close and seal the load'
                  : `Cannot seal — ${sealMissing(s, loadId)}`}
            </Btn>
          </div>
        </div>

        <div style={{ height: 1, background: DIV }} />

        {/* 2. Gate pass */}
        <div style={{ opacity: sealed ? 1 : 0.45 }}>
          <SectionHead>2 · Gate pass</SectionHead>
          <div style={{ marginTop: 8 }}>
            {sealed && l.gatePass ? (
              <Card padding={14}>
                <Fact label="Raised" value={l.gatePass} mono />
                <div style={{ marginTop: 10, display: 'flex', gap: 20 }}>
                  <Fact label="Issued by" value={l.handover?.issuedBy ?? '—'} size={13} />
                  <Fact label="On" value={l.handover?.issuedOn ?? '—'} size={13} mono />
                </div>
              </Card>
            ) : (
              <div style={{ fontSize: 12.5, opacity: 0.7 }}>Raised when the load is sealed.</div>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: DIV }} />

        {/* 3. The other device */}
        <div style={{ opacity: sealed ? 1 : 0.45 }}>
          <SectionHead>3 · He accepts, on his own device</SectionHead>
          <div style={{ marginTop: 8 }}>
            {handed ? (
              <Card padding={14} style={{ borderColor: 'var(--color-text)' }} >
                <div style={{ font: '800 15px Archivo, system-ui' }}>Custody accepted</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 9 }}>
                  <Fact label="Accepted by" value={l.handover?.acceptedBy ?? '—'} size={13} />
                  <Fact label="On terminal" value={l.handover?.acceptedOn ?? '—'} size={13} mono />
                  <Fact label="At" value={l.handover?.acceptedAt ?? '—'} size={13} mono />
                </div>
                <div className="pretty" style={{ fontSize: 11.5, opacity: 0.7, marginTop: 10, lineHeight: 1.45 }}>
                  Issued on <Mono>{l.handover?.issuedOn}</Mono>, accepted on{' '}
                  <Mono>{l.handover?.acceptedOn}</Mono>. Two people, two devices, one serial.
                </div>
              </Card>
            ) : (
              <>
                {/* ⚠⚠ NO SIGNATURE PAD ON THIS SCREEN. See the header comment. */}
                <div
                  data-testid="waiting"
                  style={{ border: `1px dashed ${DIV}`, padding: 16, textAlign: 'center' }}
                >
                  <div style={{ font: '600 14px Archivo, system-ui' }}>
                    {sealed ? `Waiting for ${l.driver.name} on ${l.handover?.acceptedOn}` : 'Seal the load first'}
                  </div>
                  <div className="pretty" style={{ fontSize: 11.5, opacity: 0.7, marginTop: 7, lineHeight: 1.5 }}>
                    There is no signature pad on this screen and there should not be. He signs on his own
                    phone, which is a different terminal with his own name on it. A pad here would let one
                    person scan the load and accept it — which is the control that is missing today.
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn
                    testid="accept"
                    dim={!sealed}
                    onClick={() => handOver(loadId)}
                    fontSize={13}
                  >
                    {sealed ? 'Simulate his acceptance — his phone is not in this room' : 'Seal the load first'}
                  </Btn>
                </div>
                <div className="pretty" style={{ fontSize: 11, opacity: 0.6, marginTop: 8, lineHeight: 1.45 }}>
                  ⚠ That button is demo scaffolding and is labelled as such. On the day it is a driver
                  pressing <em>Accept</em> on <Mono>D204</Mono>. ⚠⚠ <strong>His half is not built</strong> —
                  the driver app has nine screens and none of them is &ldquo;accept custody&rdquo;. Beat 7
                  still has no screen at his end.
                </div>
              </>
            )}
          </div>
        </div>

        {/* ⚠ THE DISAGREEMENT IS AN AVAILABLE ACTION, NOT AN OBSTRUCTION. If the
            count is short or a unit is damaged and he will not take it, it is
            refused HERE, at the warehouse door, with both people standing there.
            A secondary action, plainly worded, no drama — and never a dead end:
            a driver who cannot say no signs for whatever is on the truck, which
            is the state of affairs today. */}
        {!refused && (
          <div style={{ borderTop: `1px solid ${DIV}`, paddingTop: 12 }}>
            <SectionHead>If he will not take it</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {REFUSALS.map((r) => (
                <Btn
                  key={r}
                  height={44}
                  fontSize={12.5}
                  testid={`refuse-${r.split(' ')[0].toLowerCase()}`}
                  onClick={() => setRefused(r)}
                >
                  {r}
                </Btn>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={() => router.push(`/scan/${loadId}`)}>← Back to the scan</Btn>
          {handed && (
            <Btn kind="primary" onClick={() => router.push('/collection/COL-VE-2026-08-20-0007')}>
              Next: a customer collects →
            </Btn>
          )}
        </div>
        {handed && (
          <Note style={{ borderLeft: `4px solid ${ACC}`, background: BG }}>
            Departure from the depot gate was recorded at <Mono>{l.departedDepot.at}</Mono>{' '}
            <strong>by {l.departedDepot.source.toLowerCase()}</strong> — not by a driver pressing a
            button, and the record says which. ⚠ That is the first time Departure Compliance has ever
            been measured rather than asserted.
          </Note>
        )}
      </div>
    </div>
  );
}
