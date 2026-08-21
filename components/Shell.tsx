'use client';

/* The demo framing: left rail, the tablet, right rail.
 *
 * ⚠ The rails are NOT part of the tablet and are labelled as such. They exist so
 * a room can see the record trail while the clerk's screen stays a clerk's
 * screen. `?bare=1` drops both so the tablet can go full-screen on a projector.
 *
 * ⚠⚠ The tablet is 1280 × 800 — a 10-inch Android, per TRANSPORT-DEMO-MOCKUP-
 * PROMPTS.md §1. That does not fit beside two rails on most laptops, so the
 * frame is SCALED to whatever is left, and the scale is measured rather than
 * guessed. Everything inside is laid out at true tablet pixels; nothing is
 * re-sized per breakpoint, because a design that changes shape on the projector
 * is a different design from the one that was reviewed.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { BRANCH, DAY, DESK } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { ACC, AC7, BG, DIV, INK, MONO, SURF, TrailRow } from './ui';

const T = { bezelW: 1332, bezelH: 852, screenW: 1280, screenH: 800 };
const RAIL_L = 320;
const RAIL_R = 320;
const GAP = 32;
const PAD = 32;

type ScreenKey = 'signin' | 'board' | 'consignment' | 'scan' | 'handover' | 'collection' | 'exceptions';

function screenOf(pathname: string): ScreenKey {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return 'signin';
  if (p.startsWith('/board')) return 'board';
  if (p.startsWith('/consignment')) return 'consignment';
  if (p.startsWith('/scan')) return 'scan';
  if (p.startsWith('/handover')) return 'handover';
  if (p.startsWith('/collection')) return 'collection';
  if (p.startsWith('/exceptions')) return 'exceptions';
  return 'board';
}

const TITLES: Record<ScreenKey, [string, string]> = {
  signin: ['', ''],
  board: ['D-01 · GOODS OUT', 'Leaving this building today'],
  consignment: ['D-02 · CONSIGNMENT', 'What was sold, and to whom'],
  scan: ['D-04 · SCAN OUT', 'Bind the unit to the customer'],
  handover: ['D-05 · HAND TO DRIVER', 'Seals, gate pass, countersignature'],
  collection: ['D-06 · CUSTOMER COLLECTION', 'Same control, no truck'],
  exceptions: ['D-12 · EXCEPTIONS HERE', 'Stuck at this branch, by age'],
};

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const bare = params.get('bare') === '1';
  const { s, reset, ready } = useDesk();
  const key = screenOf(pathname);
  const go = (href: string) => router.push(href);

  /* ⚠ The scale is measured from the window, not assumed. A projector at
     1024 × 768 and a 27-inch monitor both have to show the same layout, only
     smaller or larger — never re-flowed. */
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const rails = bare ? 0 : RAIL_L + RAIL_R + GAP * 2;
      const availW = window.innerWidth - rails - PAD * 2;
      const availH = window.innerHeight - PAD * 2;
      setScale(Math.min(1, availW / T.bezelW, availH / T.bezelH));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [bare]);

  const [kicker, title] = TITLES[key];
  const chromeOn = key !== 'signin';

  const tablet = (
    <div
      style={{
        flex: 'none',
        width: T.bezelW * scale,
        height: T.bezelH * scale,
      }}
    >
      <div
        style={{
          width: T.bezelW,
          height: T.bezelH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: '#141312',
          padding: 26,
          borderRadius: 22, // ⚠ hardware, not UI. Every other radius here is 0.
          boxShadow: '0 24px 60px rgba(32,30,29,.34)',
        }}
      >
        <div
          /* ⚠ Marks the boundary of the tablet. The rails quote sentences the app
             must never say, so a copy check that reads the whole page would find
             them there and be wrong. scripts/verify.mjs asserts inside this
             element only — the same trap the driver app hit. */
          data-tablet="screen"
          style={{
            position: 'relative',
            width: T.screenW,
            height: T.screenH,
            background: BG,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: INK,
          }}
        >
          {chromeOn && <AppBar kicker={kicker} title={title} go={go} pathname={pathname} />}
          <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {ready ? children : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (bare) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: PAD }}>
        {tablet}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: GAP, padding: PAD, color: INK }}>
      <LeftRail go={go} reset={reset} current={key} />
      {tablet}
      <RightRail trail={s.trail} />
    </div>
  );
}

function AppBar({
  kicker,
  title,
  go,
  pathname,
}: {
  kicker: string;
  title: string;
  go: (href: string) => void;
  pathname: string;
}) {
  const { s } = useDesk();
  const held = s.trail.filter((t) => t.state === 'Held').length;
  const nav: [string, string][] = [
    ['Board', '/board'],
    ['Scan out', '/scan/LD-000377'],
    ['Hand over', '/handover/LD-000377'],
    ['Collections', '/collection/COL-VE-2026-08-20-0007'],
    ['Exceptions', '/exceptions'],
  ];
  const active = (href: string) => pathname.replace(/\/+$/, '').startsWith(href.split('/').slice(0, 2).join('/'));

  return (
    <div style={{ flex: 'none', borderBottom: `2px solid ${DIV}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px 12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 10px/1 Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', color: ACC }}>
            {kicker}
          </div>
          <div style={{ font: '800 24px/1.1 Archivo, system-ui', letterSpacing: '-.015em', marginTop: 5 }}>{title}</div>
        </div>

        {/* ⚠⚠ TRP-002 §2.5: every list that could be incomplete says when it last
            synced. This tablet is on the shop's wifi and is live — and it says
            "live" rather than saying nothing, because silence is what a device
            that has quietly fallen behind also does. */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1px solid ${DIV}` }}>
          <span style={{ width: 8, height: 8, background: INK, display: 'block' }} />
          <span style={{ font: '600 11px/1 Archivo, system-ui', letterSpacing: '.06em' }}>
            {DESK.sync.state} · {DESK.sync.lastSync}
          </span>
        </div>
        <div style={{ flex: 'none', textAlign: 'right', font: '600 11px/1.4 Archivo, system-ui', ...MONO }}>
          <div>{BRANCH.code} {BRANCH.name}</div>
          <div style={{ opacity: 0.55, marginTop: 3 }}>
            {DESK.terminal.storeNo} / {DESK.terminal.terminalNo} · {DESK.clerk.name}
          </div>
        </div>
        {held > 0 && (
          <div
            style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', border: `1px solid ${DIV}` }}
            title="Full-resolution photographs waiting for wifi. The evidence proxy has already gone."
          >
            <span style={{ width: 7, height: 7, background: ACC, display: 'block' }} />
            <span style={{ font: '600 10px/1 Archivo, system-ui', letterSpacing: '.06em' }}>{held} held</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderTop: `1px solid ${DIV}` }}>
        {nav.map(([label, href]) => (
          <button
            key={href}
            type="button"
            onClick={() => go(href)}
            className={active(href) ? undefined : 'tap8'}
            style={{
              minHeight: 44,
              padding: '0 16px',
              border: 0,
              borderBottom: active(href) ? `3px solid ${ACC}` : '3px solid transparent',
              background: 'transparent',
              font: '600 13px Archivo, system-ui',
              color: 'inherit',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeftRail({
  go,
  reset,
  current,
}: {
  go: (href: string) => void;
  reset: () => void;
  current: ScreenKey;
}) {
  const jumps: [string, string][] = [
    ['Sign in', '/'],
    ['Goods-out board', '/board'],
    ['Consignment', '/consignment/CN-VE-000418'],
    ['Scan out', '/scan/LD-000377'],
    ['The block', '/scan/LD-000381'],
    ['Hand to driver', '/handover/LD-000377'],
    ['Collection · serialised', '/collection/COL-VE-2026-08-20-0007'],
    ['Collection · bedset', '/collection/COL-VE-2026-08-20-0006'],
    ['Exceptions', '/exceptions'],
  ];
  return (
    <div style={{ width: RAIL_L, flex: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ font: '600 10px/1 Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', color: ACC }}>
          TVSH Transport · Phase 0 · Dispatch tablet
        </div>
        <h1 style={{ font: '800 38px/1.02 Archivo, system-ui', letterSpacing: '-.02em', margin: 0 }}>Vantage Dispatch</h1>
        <p className="pretty" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}>
          The store&rsquo;s own screen at the goods-out desk. These goods are leaving this building — to
          whom, on whose truck or in whose car, and did anybody check?
        </p>
      </div>
      <div style={{ height: 2, background: DIV }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RailLabel>What this design assumes</RailLabel>
        <div style={{ display: 'grid', gap: 10, fontSize: 12.5, lineHeight: 1.45 }}>
          {ASSUMPTIONS.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: ACC, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="pretty">{a}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 2, background: DIV }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <RailLabel>Jump to a screen</RailLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {jumps.map(([label, href]) => (
            <button
              key={href + label}
              type="button"
              onClick={() => go(href)}
              className="tap8"
              style={{
                minHeight: 36,
                padding: '0 12px',
                border: `1px solid ${DIV}`,
                background: 'transparent',
                font: '600 12.5px Archivo, system-ui',
                cursor: 'pointer',
                color: 'inherit',
                borderRadius: 0,
              }}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              reset();
              go('/');
            }}
            style={{ minHeight: 36, padding: '0 8px', border: 0, background: 'transparent', font: '600 12.5px Archivo, system-ui', cursor: 'pointer', color: AC7 }}
          >
            Reset the desk
          </button>
        </div>
        <RailNote>
          The rails are not part of the tablet. <strong>?bare=1</strong> drops both so the screen can go
          full width on a projector.
        </RailNote>
      </div>
      <div style={{ height: 2, background: DIV }} />
      <RailNote>
        Beats <strong>4, 5 and 6</strong> of the running order. Beat 7 — the driver accepting custody on
        his own phone — is <strong>still not built at his end</strong>; the store half of it is
        &ldquo;Hand to driver&rdquo; here.
      </RailNote>
      <div style={{ opacity: current === 'signin' ? 0.6 : 0 }} />
    </div>
  );
}

function RightRail({ trail }: { trail: { ref: string; detail: string; dest: string; state: string }[] }) {
  return (
    <div style={{ width: RAIL_R, flex: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ font: '600 10px Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', color: ACC }}>
          Live record trail
        </div>
        <h2 style={{ font: '800 23px/1.05 Archivo, system-ui', letterSpacing: '-.02em', margin: '8px 0 0' }}>
          Every unit that left, and what it is now attached to
        </h2>
        <p className="pretty" style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}>
          Not part of the tablet. It is here so the room can see that nothing on these screens is a
          claim without a record behind it.
        </p>
      </div>
      <div style={{ height: 2, background: DIV }} />
      <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${DIV}`, maxHeight: 460, overflowY: 'auto' }} className="scr">
        {trail.map((t, i) => (
          <TrailRow key={t.ref + i} entry={t} showDest={false} />
        ))}
      </div>
      <div style={{ padding: 12, background: SURF, fontSize: 12, lineHeight: 1.5 }} className="pretty">
        <strong style={{ fontFamily: 'Archivo, system-ui' }}>Where this goes next.</strong> Every{' '}
        <strong>Bound</strong> row above becomes the serial the driver reads at the door and the console
        finds at beat 13. <code style={{ ...MONO, fontSize: 11 }}>{DAY.exceptions[0].ref}</code> is the
        one that did not.
      </div>
      <div className="pretty" style={{ padding: 12, borderLeft: `4px solid ${ACC}`, background: BG, fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ fontFamily: 'Archivo, system-ui' }}>Not built here.</strong> The pick-and-stage
        sheet, awaiting-collection ageing as its own screen, returns in, goods I owe, and the desk and
        device register. TRP-002 §3 lists fourteen dispatch screens; this demo is the six the running
        order needs.
      </div>
    </div>
  );
}

const ASSUMPTIONS: ReactNode[] = [
  <>
    The consignment arrived <strong>seconds after the sale cleared</strong>, with the fiscal invoice
    attached. Nobody emailed anybody.
  </>,
  <>
    A serial binds <strong>here, at the door</strong> — never at the till. Pre-entering is what makes
    serials untrustworthy.
  </>,
  <>
    A unit Business Central does not hold at this location <strong>blocks the line</strong>. There is no
    skip button, and the override is a separate grant.
  </>,
  <>
    <strong>The issuing side scans; the receiving side accepts.</strong> Two people, two devices, one
    serial. Today the driver verifies his own load.
  </>,
  <>
    A collection gets the <strong>same control with no truck in it</strong> — roughly a third of
    consignments never see one.
  </>,
];

function RailLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        font: '600 10px/1 Archivo, system-ui',
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'color-mix(in srgb, var(--color-text) 55%, transparent)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function RailNote({ children }: { children: ReactNode }) {
  return (
    <div className="pretty" style={{ fontSize: 12, lineHeight: 1.45, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}>
      {children}
    </div>
  );
}
