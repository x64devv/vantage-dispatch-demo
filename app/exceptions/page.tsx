'use client';

/* D-12 — what is stuck at this branch, by age.
 *
 * ⚠ Failure is the common case, not the edge case. TRP-001 §5.4 lists fourteen
 * reason codes before anybody has run the module for a day. The screen sorts by
 * AGE because an exception nobody has answered is the one that costs money, and
 * the oldest one is always that.
 *
 * ⚠ Fault is TVSH | Customer | Shared | Neither. It is not a blame field, it is
 * a BILLING field, and it is chosen from a list rather than typed.
 *
 * ⚠⚠ The rows here are the branch's slice. The same exception is on the
 * planner's console at beat 11, with the same reference, ageing on the same
 * clock. One record, two audiences — never two queues that drift apart.
 */

import { useRouter } from 'next/navigation';
import { BRANCH, DAY } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { AC7, AC8, ACC, BG, Btn, Card, DIV, Fact, MONO, Mono, Note, SectionHead, Tag } from '@/components/ui';

export default function Exceptions() {
  const router = useRouter();
  const { s } = useDesk();

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div style={{ font: '800 17px Archivo, system-ui' }}>
          {BRANCH.code} {BRANCH.name}
        </div>
        <div className="pretty" style={{ fontSize: 12.5, opacity: 0.65 }}>
          Oldest first. Every row carries a fault and a name, and both were chosen from a list.
        </div>
      </div>

      {DAY.exceptions.map((ex) => {
        const live = s.blockedOn === ex.load;
        return (
          <Card key={ex.ref} padding={0} style={{ borderColor: live ? ACC : DIV }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DIV}`, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <Mono style={{ font: '600 12.5px Archivo, system-ui', opacity: 0.65 }}>{ex.ref}</Mono>
                <div style={{ font: '800 20px Archivo, system-ui', marginTop: 3 }}>{ex.title}</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{ex.detail}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 'none' }}>
                <Tag tone="accent">{ex.status}</Tag>
                <Tag tone="outline">Fault {ex.fault}</Tag>
                {!live && <Tag tone="neutral">Not yet raised in this session</Tag>}
              </div>
            </div>

            <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Fact label="Serial" value={ex.serial} size={14} mono />
              <Fact label="Raised" value={`${ex.raisedAt} · ${ex.raisedBy.name}`} size={14} />
              <Fact label="Consignment" value={ex.consignment} size={14} mono />
              <Fact label="Load · trip" value={`${ex.load} · ${ex.trip}`} size={14} mono />
            </div>

            <div style={{ padding: '0 18px 16px' }}>
              <div className="pretty" style={{ fontSize: 13, lineHeight: 1.55, padding: '12px 14px', background: 'var(--color-surface)' }}>
                {ex.expanded}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Btn onClick={() => router.push(`/scan/${ex.load}`)}>Back to the load</Btn>
                {/* ⚠⚠ Same rule as on the scan screen: the override exists, it is a
                    separate permission set, and the person on this desk does not
                    hold it. The control says which grant would open it. */}
                <Btn dim testid="override-here">
                  Override — you do not hold {ex.override.consoleName}
                </Btn>
                <div className="pretty" style={{ fontSize: 11.5, opacity: 0.65, flex: 1, minWidth: 220, lineHeight: 1.45 }}>
                  Held by the {ex.override.heldBy.toLowerCase()}. Using it writes a record with a name on
                  it — the same shape as <Mono style={{ fontSize: 11 }}>Vantage Statement Rollback</Mono>{' '}
                  in retail, and deliberately outside the umbrella permission set.
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      <Note style={{ borderLeft: `4px solid ${ACC}`, background: BG }}>
        <strong style={{ fontFamily: 'Archivo, system-ui' }}>
          Expect a lot of these in the first month, and say so in advance.
        </strong>{' '}
        It is the first time anybody has compared what left the building against what the ledger thought
        was there. ⚠ The Loading Clerk&rsquo;s own warehouse dispatch check omits serial numbers
        entirely — description, quantity and condition only — while the Fleet Manager SOP requires
        serials at that same point. The highest-volume path in the business has the weakest check
        written down, and that is where this will bite first. <strong>That is the system working.</strong>
      </Note>

      <div style={{ marginTop: 'auto' }}>
        <SectionHead>Not on this screen</SectionHead>
        <div className="pretty" style={{ fontSize: 12.5, opacity: 0.7, marginTop: 7, lineHeight: 1.5 }}>
          Rebooks (D-10) are owned by the branch that <em>sold</em> it, on a 09:00 next-day clock, and
          returns in (D-11) grades condition on receipt. Neither is built here. TRP-002 §3 lists
          fourteen dispatch screens; this demo is the six the running order needs, and the rest are
          named rather than stubbed.
        </div>
      </div>
    </div>
  );
}
