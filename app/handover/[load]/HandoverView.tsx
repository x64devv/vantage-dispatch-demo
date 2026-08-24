'use client';

/* Step 3 — HAND OVER. The store half of beat 7.
 *
 * ⚠⚠ THIS SCREEN HAS NO SIGNATURE PAD ON IT, AND THAT IS THE ARGUMENT.
 * The driver does not sign on the store's tablet. He accepts custody on his own
 * phone, which is a separate commissioned terminal with his own name on it — two
 * people, two devices, one serial. A pad here would let one person scan the load
 * AND accept it, which is exactly the control that is missing today: the driver
 * currently verifies his own load.
 *
 * ⚠ The Seal procedure exists in exactly one SOP (Van Assistant, Appendix V):
 * driver, assistant, dispatch clerk and security witness the doors closed
 * together, and the Vehicle Seal Form is signed by driver and security. This is
 * that procedure with the paper removed — not a new control.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { load as loadById } from '@/lib/day';
import { loadReady, useDesk } from '@/lib/state';
import { ACC, BG, Btn, Card, DIV, Fact, INK, Label, Mono, Note, Steps, Tag } from '@/components/ui';

/* ⚠ Two reasons, chosen from a list rather than typed — the same rule as the
   fault field on an exception. A typed reason cannot be counted, and a reason
   nobody counts is a reason nobody fixes. */
const REFUSALS = ['The count is short', 'A unit is damaged'];

export default function HandoverView({ loadId }: { loadId: string }) {
  const router = useRouter();
  const { s, sealLoad, handOver } = useDesk();
  const [refused, setRefused] = useState<string | null>(null);
  const l = loadById(loadId);

  if (!l) return <div style={{ padding: 40 }}><Note>No load {loadId}.</Note></div>;

  const { cs, outstanding, blocked, ok } = loadReady(s, loadId);
  const sealed = !!s.sealed[loadId];
  const handed = !!s.handedOver[loadId];

  const missing = blocked.length
    ? `${blocked.length} line blocked, answer it first`
    : `${outstanding.length} still to scan out`;

  return (
    <>
      <Steps at={3} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* ── Left: the truck and its load ────────────────────────────── */}
        <div className="scr" style={{ flex: 1, minWidth: 0, padding: '22px 26px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap' }}>
            <Fact label="Vehicle" value={`${l.vehicle.reg} · ${l.vehicle.fleetNo}`} size={26} mono />
            <Fact label="Driver" value={l.driver.name} size={26} />
            <Fact label="Crew" value={l.crew.name} size={26} />
          </div>

          <div style={{ height: 2, background: DIV, margin: '20px 0' }} />

          <Label>What he is being given</Label>
          <div style={{ marginTop: 12 }}>
            {cs.map((c) => {
              const ready = !outstanding.includes(c);
              return (
                <div
                  key={c.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${DIV}` }}
                >
                  <Mono style={{ font: '700 20px Archivo, system-ui', flex: 'none', width: 46, opacity: 0.55 }}>
                    {c.loadUnit}
                  </Mono>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '700 20px Archivo, system-ui', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.customer.name}
                    </div>
                    <div style={{ fontSize: 16, opacity: 0.6, marginTop: 2 }}>{c.address.suburb}</div>
                  </div>
                  <Tag tone={ready ? 'ink' : 'outline'} style={{ flex: 'none' }}>
                    {s.blocked[c.id] ? 'Blocked' : ready ? 'Scanned out' : 'Waiting'}
                  </Tag>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: seals, then the other device ─────────────────────── */}
        <div className="scr" style={{ flex: 'none', width: 466, borderLeft: `2px solid ${DIV}`, padding: '22px 26px', overflowY: 'auto' }}>
          <Label>1 · Seals</Label>
          <div style={{ display: 'flex', gap: 12, margin: '12px 0 16px' }}>
            {l.seals.map((sl) => (
              <div key={sl} style={{ border: `2px solid ${sealed ? INK : DIV}`, padding: '14px 18px' }}>
                <Mono style={{ font: '700 22px Archivo, system-ui' }}>{sl}</Mono>
              </div>
            ))}
          </div>
          {/* ⚠ Disabled = dimmed AND a label naming what is missing. */}
          <Btn
            kind="primary"
            center
            testid="seal"
            style={{ width: '100%' }}
            dim={!ok || sealed}
            onClick={() => sealLoad(loadId)}
          >
            {sealed ? `Sealed at ${l.sealedAt}` : ok ? 'Close and seal the load' : `Cannot seal — ${missing}`}
          </Btn>

          <div style={{ height: 2, background: DIV, margin: '22px 0' }} />

          <div style={{ opacity: sealed ? 1 : 0.45 }}>
            <Label>2 · He accepts, on his own device</Label>
            {handed ? (
              <Card style={{ marginTop: 12, borderColor: INK }} padding={20}>
                <div style={{ font: '800 22px Archivo, system-ui' }}>Custody accepted</div>
                <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                  <Fact label="By" value={l.handover?.acceptedBy ?? '—'} size={19} />
                  <Fact label="On terminal" value={`${l.handover?.acceptedOn} · ${l.handover?.acceptedAt}`} size={19} mono />
                  <Fact label="Gate pass" value={l.gatePass ?? '—'} size={19} mono />
                </div>
              </Card>
            ) : (
              <>
                <div className="pretty" style={{ fontSize: 17, lineHeight: 1.5, margin: '12px 0 14px', opacity: 0.82 }}>
                  No signature pad on this screen. He signs on his own phone,{' '}
                  <Mono>{l.handover?.acceptedOn}</Mono> — a different terminal with his own name on it.
                </div>
                <Btn testid="accept" style={{ width: '100%' }} center dim={!sealed} onClick={() => handOver(loadId)}>
                  {sealed ? 'He accepts on D204' : 'Seal the load first'}
                </Btn>
              </>
            )}
          </div>

          <div style={{ height: 2, background: DIV, margin: '22px 0' }} />

          {refused ? (
            <Note style={{ borderLeft: `6px solid ${ACC}`, background: BG }}>
              <strong style={{ fontFamily: 'Archivo, system-ui' }}>Refused at the door.</strong> {refused} —
              recorded with both names on it. The goods stay in this building.
            </Note>
          ) : (
            <>
              {/* ⚠ The disagreement is an available action, not an obstruction.
                  Refused HERE, with both people standing there — not discovered
                  at a customer's house three hours later. */}
              <Label>If he will not take it</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {REFUSALS.map((r) => (
                  <Btn
                    key={r}
                    height={56}
                    fontSize={16}
                    testid={`refuse-${r.split(' ')[1].toLowerCase()}`}
                    onClick={() => setRefused(r)}
                  >
                    {r}
                  </Btn>
                ))}
              </div>
            </>
          )}

          {handed && (
            <Btn kind="primary" center style={{ width: '100%', marginTop: 22 }} onClick={() => router.push('/board')}>
              Back to the board
            </Btn>
          )}
        </div>
      </div>
    </>
  );
}
