'use client';

/* Step 3 — HAND OVER, to the driver.
 *
 * ⚠⚠ THE DRIVER SIGNS HERE, ON THIS TABLET. Wyne's call, 24 August.
 *
 * TRP-002 §1.3 wants the issuing side to scan and the receiving side to accept
 * on his OWN device — two people, two devices, one serial. That is the right
 * design and it is written down in `KOTLIN.md` as the target. It is **not
 * built**: the driver app has nine screens and none of them is `V-05 Accept
 * custody`. A screen here saying he signed on `D204` would be reporting a
 * control nobody has, which is the worst defect class in this codebase.
 *
 * So both signatures in this demo — the driver's here and the customer's at the
 * counter — are captured on `T118`, the same pad, and the demo is true end to
 * end. ⚠ The Van Assistant SOP Appendix V already has driver, assistant,
 * dispatch clerk and security witnessing the sealing together with one form
 * between them, so one tablet is exactly how the paper version works today.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DESK, load as loadById } from '@/lib/day';
import { loadReady, useDesk } from '@/lib/state';
import Signature from '@/components/Signature';
import { ACC, BG, Btn, Card, DIV, Fact, INK, Label, Mono, Note, Steps, Tag } from '@/components/ui';

/* ⚠ Two reasons, chosen from a list rather than typed — the same rule as the
   fault field on an exception. A typed reason cannot be counted, and a reason
   nobody counts is a reason nobody fixes. */
const REFUSALS = ['The count is short', 'A unit is damaged'];

export default function HandoverView({ loadId }: { loadId: string }) {
  const router = useRouter();
  const { s, set, sealLoad, handOver } = useDesk();
  const [refused, setRefused] = useState<string | null>(null);
  const l = loadById(loadId);

  if (!l) return <div style={{ padding: 40 }}><Note>No load {loadId}.</Note></div>;

  const { cs, outstanding, blocked, ok } = loadReady(s, loadId);
  const sealed = !!s.sealed[loadId];
  const ink = !!s.handoverSigInk[loadId];
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

        {/* ── Right: seals, then his signature ────────────────────────── */}
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
            {handed ? (
              <>
                <Label>2 · Accepted</Label>
                <Card style={{ marginTop: 12, borderColor: INK }} padding={20}>
                  <div style={{ font: '800 22px Archivo, system-ui' }}>Custody accepted</div>
                  <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                    <Fact label="Signed by" value={l.handover?.acceptedBy ?? '—'} size={19} />
                    <Fact label="On terminal" value={`${l.handover?.acceptedOn} · ${l.handover?.acceptedAt}`} size={19} mono />
                    <Fact label="Gate pass" value={l.gatePass ?? '—'} size={19} mono />
                  </div>
                </Card>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label>2 · {l.driver.name} signs for the load</Label>
                  {ink && <Tag tone="ink">Signed</Tag>}
                </div>
                <div style={{ marginTop: 10, pointerEvents: sealed ? 'auto' : 'none' }}>
                  <Signature
                    height={150}
                    inked={ink}
                    onInk={() => set({ handoverSigInk: { ...s.handoverSigInk, [loadId]: true } })}
                  />
                </div>
                <div style={{ fontSize: 15, opacity: 0.6, marginTop: 8 }}>
                  Witnessed by {DESK.clerk.name} on {DESK.terminal.terminalNo}
                </div>
                <div style={{ marginTop: 14 }}>
                  <Btn
                    kind="primary"
                    testid="accept"
                    style={{ width: '100%' }}
                    center
                    dim={!sealed || !ink}
                    onClick={() => handOver(loadId)}
                  >
                    {!sealed ? 'Seal the load first' : !ink ? 'He has not signed yet' : 'Hand the load over'}
                  </Btn>
                </div>
              </>
            )}
          </div>

          {/* ⚠ Once he has taken it, "if he will not take it" is not an option any
              more — a control that is no longer available must not sit there
              looking available. */}
          {!handed && <div style={{ height: 2, background: DIV, margin: '22px 0' }} />}

          {handed ? null : refused ? (
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
