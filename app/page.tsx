'use client';

/* Sign in.
 *
 * ⚠ A dispatch tablet is a commissioned terminal, exactly as a till is — it has
 * a store number and a terminal number, and both are inside every number it
 * mints, which is why two devices at one branch can never collide. The screen
 * states them rather than burying them, because the person on the desk is
 * accountable for what leaves on them.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BRANCH, DAY, DESK } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { ACC, BG, Btn, DIV, INK, Label, MONO, SURF } from '@/components/ui';

export default function SignIn() {
  const router = useRouter();
  const { set } = useDesk();
  const [pin, setPin] = useState('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'];

  const go = () => {
    set({ signedIn: true });
    router.push('/board');
  };

  const press = (k: string) => {
    if (k === 'clear') return setPin('');
    if (k === 'ok') return pin.length >= 4 ? go() : undefined;
    if (pin.length < 6) setPin(pin + k);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 52, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
        <div>
          <div style={{ font: '700 16px/1 Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', color: ACC }}>
            Vantage Dispatch · {DAY.kicker}
          </div>
          <h1 style={{ font: '800 56px/1.02 Archivo, system-ui', letterSpacing: '-.025em', margin: '16px 0 0' }}>
            {BRANCH.code} {BRANCH.name}
          </h1>
          <p className="pretty" style={{ margin: '14px 0 0', fontSize: 21, lineHeight: 1.45, maxWidth: 520, opacity: 0.72 }}>
            Goods-out desk. Everything this branch has to get out of the building today.
          </p>
        </div>

        <div style={{ height: 2, background: DIV }} />

        <div style={{ display: 'flex', gap: 52, flexWrap: 'wrap' }}>
          <div>
            <Label>On the desk</Label>
            <div style={{ font: '700 26px Archivo, system-ui', marginTop: 8 }}>{DESK.clerk.name}</div>
          </div>
          <div>
            <Label>Terminal</Label>
            <div style={{ font: '700 26px Archivo, system-ui', marginTop: 8, ...MONO }}>
              {DESK.terminal.storeNo} / {DESK.terminal.terminalNo}
            </div>
          </div>
          <div>
            <Label>Sync</Label>
            <div style={{ font: '700 26px Archivo, system-ui', marginTop: 8 }}>
              {DESK.sync.state} · {DESK.sync.lastSync}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 'none', width: 470, borderLeft: `2px solid ${DIV}`, padding: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
        <div
          data-testid="pin"
          style={{
            height: 82,
            border: `2px solid ${DIV}`,
            background: SURF,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            font: '800 38px Archivo, system-ui',
            letterSpacing: '.34em',
            ...MONO,
          }}
        >
          {'•'.repeat(pin.length)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `2px solid ${DIV}` }}>
          {keys.map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className="keypad"
              style={{
                minHeight: 86,
                border: 0,
                borderLeft: i % 3 ? `1px solid ${DIV}` : undefined,
                borderTop: i > 2 ? `1px solid ${DIV}` : undefined,
                background: 'transparent',
                font: `${k === 'clear' || k === 'ok' ? '700 17px' : '800 30px'} Archivo, system-ui`,
                color: k === 'ok' ? ACC : INK,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {k === 'clear' ? 'Clear' : k === 'ok' ? 'Sign in' : k}
            </button>
          ))}
        </div>

        {/* ⚠ Disabled = dimmed AND a label naming what is missing. */}
        <Btn kind="primary" center testid="signin" dim={pin.length < 4} onClick={go} style={{ width: '100%' }}>
          {pin.length < 4 ? 'Enter your PIN' : 'Open the goods-out board'}
        </Btn>
      </div>
    </div>
  );
}
