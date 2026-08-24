'use client';

/* Shared primitives.
 *
 * ⚠⚠ EVERY SIZE IN HERE WENT UP after the internal review on 21 August: the
 * screens were legible on a laptop and not from the back of a room. A tablet at
 * a goods-out desk is read standing up, at arm's length, in a hurry — and the
 * same screen on a projector is read from ten metres. Nothing here is below
 * 13px, and the things that matter are 20px and over.
 *
 * ⚠ Radius is 0 everywhere. The only exception in this app is the tablet bezel,
 *   which is hardware. Tokens, never literals.
 */

import type { CSSProperties, ReactNode } from 'react';

export const ACC = 'var(--color-accent)';
export const INK = 'var(--color-text)';
export const BG = 'var(--color-bg)';
export const SURF = 'var(--color-surface)';
export const DIV = 'var(--color-divider)';
export const MUT = 'color-mix(in srgb, var(--color-text) 45%, transparent)';
export const AC7 = 'var(--color-accent-700)';
export const AC8 = 'var(--color-accent-800)';

/** ⚠ Monospace with tabular figures for everything a hand or a scanner
 *  produced: serials, quantities, money, times, document numbers. */
export const MONO: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-.01em',
};

export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ ...MONO, ...style }}>{children}</span>;
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        font: '600 13px/1 Archivo, system-ui',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: 'color-mix(in srgb, var(--color-text) 58%, transparent)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A labelled fact. Label small and quiet, value large and plain. */
export function Fact({
  label,
  value,
  size = 22,
  mono = false,
  style,
}: {
  label: string;
  value: ReactNode;
  size?: number;
  mono?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={style}>
      <Label>{label}</Label>
      <div style={{ font: `600 ${size}px/1.2 Archivo, system-ui`, marginTop: 7, ...(mono ? MONO : {}) }}>
        {value}
      </div>
    </div>
  );
}

export function Rule({ weight = 2, margin = '20px 0' }: { weight?: number; margin?: string }) {
  return <div style={{ height: weight, background: DIV, margin }} />;
}

type BtnProps = {
  kind?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  onClick?: () => void;
  /** ⚠ Disabled = opacity .45 AND a label saying what is missing. The label is
   *  the caller's job; this only dims and inerts. Never a dead control. */
  dim?: boolean;
  height?: number;
  fontSize?: number;
  style?: CSSProperties;
  center?: boolean;
  testid?: string;
};

export function Btn({
  kind = 'secondary',
  children,
  onClick,
  dim = false,
  height = 68,
  fontSize = 19,
  center = false,
  style,
  testid,
}: BtnProps) {
  return (
    <button
      type="button"
      onClick={dim ? undefined : onClick}
      aria-disabled={dim || undefined}
      data-testid={testid}
      className={kind === 'secondary' ? 'tap8' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
        textAlign: 'left',
        gap: 10,
        minHeight: height, // ⚠ 68px. A gloved hand, standing up, in a stock room.
        padding: '0 24px',
        font: `700 ${fontSize}px Archivo, system-ui`,
        lineHeight: 1.2,
        cursor: dim ? 'default' : 'pointer',
        borderRadius: 0,
        opacity: dim ? 0.45 : 1,
        ...(kind === 'primary'
          ? { background: ACC, color: BG, border: '1px solid transparent' }
          : kind === 'secondary'
            ? { background: 'transparent', color: INK, border: `2px solid ${DIV}` }
            : { background: 'transparent', color: AC7, border: '1px solid transparent' }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  padding = 22,
  style,
}: {
  children: ReactNode;
  padding?: number;
  style?: CSSProperties;
}) {
  return <div style={{ border: `2px solid ${DIV}`, padding, background: BG, ...style }}>{children}</div>;
}

/** ⚠ The refusal panel. Used only where the app says something the person would
 *  rather not read — and it is the loudest thing on any screen it appears on. */
export function WarnPanel({
  head,
  children,
  style,
}: {
  head: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      data-testid="warn"
      style={{ border: `3px solid ${ACC}`, background: 'var(--color-accent-100)', padding: 22, ...style }}
    >
      <div className="pretty" style={{ font: '800 25px/1.25 Archivo, system-ui', color: AC8 }}>
        {head}
      </div>
      {children != null && (
        <div className="pretty" style={{ fontSize: 17, lineHeight: 1.45, marginTop: 11, color: 'var(--color-accent-900)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Note({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="pretty" style={{ padding: '16px 20px', background: SURF, fontSize: 16, lineHeight: 1.5, ...style }}>
      {children}
    </div>
  );
}

/** A square status chip. ⚠ Never a rounded pill — radius is 0. */
export function Tag({
  children,
  tone = 'neutral',
  style,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'ink' | 'outline';
  style?: CSSProperties;
}) {
  const tones: Record<string, CSSProperties> = {
    neutral: { background: SURF, color: 'color-mix(in srgb, var(--color-text) 78%, transparent)' },
    accent: { background: 'var(--color-accent-100)', color: AC8 },
    ink: { background: INK, color: BG },
    outline: { border: `2px solid ${DIV}`, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        font: '700 13px/1 Archivo, system-ui',
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        padding: '8px 12px',
        borderRadius: 0,
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** ⚠ Two grades of a fact are two visibly different things. Scanned is a filled
 *  mark; typed is outlined, in accent, and says the word. */
export function Grade({ capturedBy }: { capturedBy: 'Scanned' | 'Typed' }) {
  return capturedBy === 'Scanned' ? (
    <Tag tone="ink">Scanned</Tag>
  ) : (
    <Tag tone="outline" style={{ borderColor: ACC, color: AC7 }}>
      Typed
    </Tag>
  );
}

/** A yes / no pair, at 64px. ⚠ Selected state is a FILL, not a tick — accent for
 *  the affirmative, ink for the negative. A "no" in ink rather than red is
 *  deliberate: a refusal is not an error. */
export function YesNo({
  value,
  onPick,
  testid,
}: {
  value: 'yes' | 'no' | undefined;
  onPick: (v: 'yes' | 'no') => void;
  testid?: string;
}) {
  const cell = (v: 'yes' | 'no'): CSSProperties => ({
    minHeight: 64,
    minWidth: 100,
    padding: '0 22px',
    border: `2px solid ${DIV}`,
    background: value === v ? (v === 'yes' ? ACC : INK) : 'transparent',
    color: value === v ? BG : 'inherit',
    font: '700 17px Archivo, system-ui',
    cursor: 'pointer',
    borderRadius: 0,
  });
  return (
    <div style={{ display: 'flex' }} data-testid={testid}>
      <button type="button" style={cell('yes')} onClick={() => onPick('yes')} className={value === 'yes' ? undefined : 'tap8'}>
        Yes
      </button>
      <button
        type="button"
        style={{ ...cell('no'), borderLeft: 'none' }}
        onClick={() => onPick('no')}
        className={value === 'no' ? undefined : 'tap8'}
      >
        No
      </button>
    </div>
  );
}

/** The three steps, always visible, so nobody has to remember where they are. */
export function Steps({ at }: { at: 1 | 2 | 3 }) {
  const steps = ['Verify', 'Scan out', 'Hand over'];
  return (
    <div
      /* ⚠ Full width with one bottom rule. A row of three that stopped a third of
         the way across read as an unfinished underline in the first screenshot. */
      style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${DIV}`, flex: 'none' }}
      data-testid="steps"
    >
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < at;
        const now = n === at;
        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px 12px 18px',
              background: now ? INK : 'transparent',
              color: now ? BG : done ? INK : MUT,

            }}
          >
            <span style={{ font: '800 15px/1 Archivo, system-ui', ...MONO }}>{done ? '✓' : n}</span>
            <span style={{ font: '700 15px/1 Archivo, system-ui', letterSpacing: '.04em' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
