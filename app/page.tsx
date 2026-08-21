'use client';

/* Sign in — and D-14 folded into it: who is on the desk, which tablet, what it
 * has sent and what it is still holding.
 *
 * ⚠ A dispatch tablet is a commissioned terminal, exactly as a till is. It has a
 * store number and a terminal number, and both are inside every number it mints
 * — which is why two devices at one branch can never collide, offline or not
 * (TRP-004 §6.2). The screen states them rather than hiding them in a settings
 * page, because the person on the desk is accountable for what leaves on them.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BRANCH, DAY, DESK } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { ACC, BG, Btn, DIV, Fact, INK, MONO, Note, SURF } from '@/components/ui';

export default function SignIn() {
  const router = useRouter();
  const { set } = useDesk();
  const [pin, setPin] = useState('');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'];

  const press = (k: string) => {
    if (k === 'clear') return setPin('');
    if (k === 'ok') {
      if (pin.length >= 4) {
        set({ signedIn: true });
        router.push('/board');
      }
      return;
    }
    if (pin.length < 6) setPin(pin + k);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left: identity */}
      <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ font: '600 11px/1 Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', color: ACC }}>
            Vantage Dispatch · {DAY.kicker}
          </div>
          <h1 style={{ font: '800 44px/1.02 Archivo, system-ui', letterSpacing: '-.025em', margin: '12px 0 0' }}>
            {BRANCH.code} {BRANCH.name}
          </h1>
          <p className="pretty" style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, maxWidth: 460, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}>
            Goods-out desk. Everything this branch has to get out of the building today — onto our
            trucks, onto a hired carrier, or into a customer&rsquo;s own car.
          </p>
        </div>

        <div style={{ height: 2, background: DIV }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 520 }}>
          <Fact label="On the desk" value={DESK.clerk.name} />
          <Fact label="Staff number" value={DESK.clerk.staffNo} mono />
          <Fact label="Terminal" value={`${DESK.terminal.storeNo} / ${DESK.terminal.terminalNo}`} mono />
          <Fact label="Class" value={`${DESK.terminal.class} · ${DESK.terminal.device}`} />
          <Fact label="Last sync" value={`${DESK.sync.state} · ${DESK.sync.lastSync}`} />
          <Fact label="Queued to send" value={`${DESK.sync.queued}`} mono />
        </div>

        <Note style={{ maxWidth: 520 }}>
          ⚠ This tablet is on the shop&rsquo;s wifi, so its records leave as they are made. The
          driver&rsquo;s phone is not, and says so on its own screen. Two devices, two honest states —
          never one blanket &ldquo;offline&rdquo; mode across a business.
        </Note>

        <div style={{ marginTop: 'auto' }}>
          <Note style={{ background: BG, borderLeft: `4px solid ${ACC}`, maxWidth: 520 }}>
            <strong style={{ fontFamily: 'Archivo, system-ui' }}>This is a demo build.</strong> No
            camera, no scanner, no Business Central, no gateway, no authentication. The day is seeded
            from{' '}
            <code style={{ ...MONO, fontSize: 11.5 }}>
              design_handoff_dispatch_app/data/dispatch-day.json
            </code>{' '}
            and nothing here posts anywhere.
          </Note>
        </div>
      </div>

      {/* Right: the PIN pad */}
      <div style={{ flex: 'none', width: 430, borderLeft: `2px solid ${DIV}`, padding: 40, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ font: '600 10px/1 Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.55 }}>
            Clerk PIN
          </div>
          <div
            data-testid="pin"
            style={{
              marginTop: 10,
              height: 64,
              border: `1px solid ${DIV}`,
              background: SURF,
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              font: '800 30px Archivo, system-ui',
              letterSpacing: '.32em',
              ...MONO,
            }}
          >
            {'•'.repeat(pin.length)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${DIV}` }}>
          {keys.map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className="keypad"
              style={{
                minHeight: 72,
                border: 0,
                borderLeft: i % 3 ? `1px solid ${DIV}` : undefined,
                borderTop: i > 2 ? `1px solid ${DIV}` : undefined,
                background: 'transparent',
                font: `${k === 'clear' || k === 'ok' ? '600 13px' : '800 24px'} Archivo, system-ui`,
                color: k === 'ok' ? ACC : INK,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {k === 'clear' ? 'Clear' : k === 'ok' ? 'Sign in' : k}
            </button>
          ))}
        </div>

        {/* ⚠ Disabled means opacity .45 AND a label naming what is missing. */}
        <Btn
          kind="primary"
          center
          dim={pin.length < 4}
          onClick={() => {
            set({ signedIn: true });
            router.push('/board');
          }}
          testid="signin"
        >
          {pin.length < 4 ? 'Enter your PIN — four digits or more' : `Open the goods-out board`}
        </Btn>
        <div className="pretty" style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.6 }}>
          Any four digits will do — there is no authentication in this build, and it says so rather
          than pretending to check.
        </div>
      </div>
    </div>
  );
}
