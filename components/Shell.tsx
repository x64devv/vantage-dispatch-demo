'use client';

/* The tablet, and nothing else.
 *
 * ⚠⚠ THE DEMO RAILS ARE GONE — internal review, 21 August. There was a left rail
 * of design assumptions and a right rail carrying a live record trail, and the
 * verdict was that they overwhelm the room. Everything they said is said out
 * loud by whoever is presenting, which is where it belonged: a screen that
 * explains itself in prose is a screen nobody reads.
 *
 * ⚠ With the rails gone the tablet gets the whole window, so it now scales UP as
 * well as down — on a 1920 projector it renders about 40% larger than its design
 * pixels. That is the single biggest legibility change in this build and it cost
 * one removed `Math.min(1, …)`.
 *
 * The layout inside is still true 1280 × 800 and is never re-flowed: a design
 * that changes shape on the projector is a different design from the one that
 * was reviewed.
 */

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { BRANCH, DAY, DESK, consignment } from '@/lib/day';
import { useDesk } from '@/lib/state';
import { BG, DIV, INK, MONO } from './ui';

const T = { bezelW: 1332, bezelH: 852, screenW: 1280, screenH: 800 };
const PAD = 28;
const MAX_SCALE = 1.5;

type Screen = { title: string; back: string | null };

function screenOf(pathname: string): Screen {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return { title: '', back: null };
  if (p === '/board') return { title: 'Goods out', back: null };

  const verify = p.match(/^\/consignment\/([^/]+)$/);
  if (verify) return { title: name(verify[1]), back: '/board' };

  const scan = p.match(/^\/scan\/([^/]+)$/);
  if (scan) return { title: name(scan[1]), back: `/consignment/${scan[1]}` };

  if (p.startsWith('/handover')) return { title: 'Hand to the driver', back: '/board' };
  if (p.startsWith('/collection')) return { title: 'Hand to the customer', back: '/board' };
  return { title: 'Goods out', back: '/board' };
}

const name = (cid: string) => consignment(cid)?.customer.name ?? cid;

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready } = useDesk();
  const { title, back } = screenOf(pathname);
  const chromeOn = (pathname.replace(/\/+$/, '') || '/') !== '/';

  /* ⚠ The scale is measured, not assumed — a projector at 1024 × 768 and a
     27-inch monitor show the same layout, only smaller or larger. */
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const w = (window.innerWidth - PAD * 2) / T.bezelW;
      const h = (window.innerHeight - PAD * 2) / T.bezelH;
      setScale(Math.max(0.4, Math.min(MAX_SCALE, w, h)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: PAD }}>
      <div style={{ width: T.bezelW * scale, height: T.bezelH * scale, flex: 'none' }}>
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
            {chromeOn && (
              <div
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: '16px 26px',
                  borderBottom: `2px solid ${DIV}`,
                }}
              >
                {back ? (
                  <button
                    type="button"
                    aria-label="Back"
                    data-testid="back"
                    onClick={() => router.push(back)}
                    className="tap8"
                    style={{
                      width: 60,
                      height: 60,
                      flex: 'none',
                      border: `2px solid ${DIV}`,
                      background: 'transparent',
                      cursor: 'pointer',
                      font: '700 24px Archivo, system-ui',
                      color: 'inherit',
                      borderRadius: 0,
                    }}
                  >
                    ←
                  </button>
                ) : (
                  <div style={{ width: 60, height: 60, flex: 'none' }} />
                )}

                <div style={{ flex: 1, minWidth: 0, font: '800 30px/1.15 Archivo, system-ui', letterSpacing: '-.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </div>

                <div style={{ flex: 'none', textAlign: 'right', ...MONO }}>
                  <div style={{ font: '700 17px/1.3 Archivo, system-ui' }}>
                    {BRANCH.code} {BRANCH.name}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.6, marginTop: 3 }}>
                    {DAY.boardClock} · {DESK.terminal.terminalNo} · {DESK.clerk.name}
                  </div>
                </div>
              </div>
            )}

            <div className="scr" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {ready ? children : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
