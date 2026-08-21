'use client';

/* Shared primitives, kept deliberately thin — the Modernist sheet is the design
 * system and the screens use inline styles reading its var(--…) tokens.
 * ⚠ Never a literal colour in a screen; every one comes from a token.
 * ⚠ Radius is 0 everywhere. The only exception in this app is the tablet bezel,
 *   which is hardware, not UI.
 *
 * These are the driver app's primitives with the touch targets raised: TRP-002
 * §4 sets 56px for a device used standing up, and this one is used standing up
 * in a stock room.
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

/** ⚠ Monospace with tabular figures for everything a hand or a scanner produced:
 *  serials, quantities, money, times, document numbers, registrations. Columns of
 *  figures must not jitter. */
export const MONO: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-.01em',
};

export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ ...MONO, ...style }}>{children}</span>;
}

export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        font: '600 11px/1 Archivo, system-ui',
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

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ opacity: 0.55, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

export function Fact({
  label,
  value,
  size = 15,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  size?: number;
  mono?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ font: `600 ${size}px Archivo, system-ui`, marginTop: 2, ...(mono ? MONO : {}) }}>
        {value}
      </div>
    </div>
  );
}

export function Rule({ weight = 2, margin = '16px 0' }: { weight?: number; margin?: string }) {
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
  title?: string;
  testid?: string;
};

export function Btn({
  kind = 'secondary',
  children,
  onClick,
  dim = false,
  height = 56,
  fontSize = 14,
  center = false,
  style,
  title,
  testid,
}: BtnProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: center ? 'center' : 'flex-start',
    textAlign: 'left',
    gap: 8,
    minHeight: height, // ⚠ 56px, TRP-002 §4 — a gloved hand in a stock room
    padding: '0 16px',
    font: `600 ${fontSize}px Archivo, system-ui`,
    lineHeight: 1.2,
    cursor: dim ? 'default' : 'pointer',
    borderRadius: 0,
    opacity: dim ? 0.45 : 1,
    textDecoration: 'none',
    ...(kind === 'primary'
      ? { background: ACC, color: BG, border: '1px solid transparent' }
      : kind === 'secondary'
        ? { background: 'transparent', color: INK, border: `1px solid ${DIV}` }
        : { background: 'transparent', color: AC7, border: '1px solid transparent' }),
    ...style,
  };
  return (
    <button
      type="button"
      onClick={dim ? undefined : onClick}
      aria-disabled={dim || undefined}
      data-testid={testid}
      className={kind === 'secondary' ? 'tap8' : undefined}
      style={base}
      title={title}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  padding = 16,
  style,
}: {
  children: ReactNode;
  padding?: number;
  style?: CSSProperties;
}) {
  return <div style={{ border: `1px solid ${DIV}`, padding, ...style }}>{children}</div>;
}

/** ⚠ The refusal panel: accent fill, accent border, 800 heading. Used only where
 *  the app says something the person would rather not read — the block, and the
 *  override they do not hold. */
export function WarnPanel({
  head,
  children,
  style,
}: {
  head: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      data-testid="warn"
      style={{ border: `1px solid ${ACC}`, background: 'var(--color-accent-100)', padding: 16, ...style }}
    >
      <div style={{ font: '800 17px Archivo, system-ui', color: AC8 }}>{head}</div>
      <div className="pretty" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 7, color: 'var(--color-accent-900)' }}>
        {children}
      </div>
    </div>
  );
}

export function Note({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="pretty" style={{ padding: '12px 14px', background: SURF, fontSize: 13, lineHeight: 1.5, ...style }}>
      {children}
    </div>
  );
}

export function SectionHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ font: '600 11px Archivo, system-ui', letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.55 }}>
        {children}
      </div>
      {right}
    </div>
  );
}

/** A small square tag. ⚠ Never a rounded pill — radius is 0. */
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
    neutral: { background: SURF, color: 'color-mix(in srgb, var(--color-text) 75%, transparent)' },
    accent: { background: 'var(--color-accent-100)', color: AC8 },
    ink: { background: INK, color: BG },
    outline: { border: `1px solid ${DIV}`, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        font: '600 10px/1 Archivo, system-ui',
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        padding: '5px 8px',
        borderRadius: 0,
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Two grades of a fact are two visibly different things — TRP-002 §2.3.
 *  Scanned is a filled mark; typed is an outlined one, and it says the word. */
export function Grade({ capturedBy }: { capturedBy: 'Scanned' | 'Typed' }) {
  return capturedBy === 'Scanned' ? (
    <Tag tone="ink">Scanned</Tag>
  ) : (
    <Tag tone="outline" style={{ borderColor: ACC, color: AC7 }}>
      Typed
    </Tag>
  );
}

/** One row of the record trail. ⚠ Every row names where the record went. */
export function TrailRow({
  entry,
  showDest = true,
}: {
  entry: { ref: string; detail: string; dest: string; state: string };
  showDest?: boolean;
}) {
  const stateColour =
    entry.state === 'Bound' ? ACC : entry.state === 'Blocked' ? AC8 : MUT;
  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${DIV}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ font: '600 13px Archivo, system-ui', ...MONO }}>{entry.ref}</span>
        <span
          style={{
            flex: 'none',
            font: '600 9px Archivo, system-ui',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: stateColour,
          }}
        >
          {entry.state}
        </span>
      </div>
      <div className="pretty" style={{ fontSize: 11.5, opacity: 0.72, marginTop: 4, lineHeight: 1.45 }}>
        {entry.detail}
        {showDest ? ` → ${entry.dest}` : ''}
      </div>
      {!showDest && (
        <div
          style={{
            font: '600 9px Archivo, system-ui',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            opacity: 0.5,
            marginTop: 6,
          }}
        >
          {entry.dest}
        </div>
      )}
    </div>
  );
}

/** A yes / no pair. ⚠ Selected state is a FILL, not a tick — accent for the
 *  affirmative, ink for the negative. A "no" being ink rather than red is
 *  deliberate: a refusal is not an error. */
export function YesNo({
  value,
  onPick,
  yesLabel = 'Yes',
  noLabel = 'No',
  testid,
}: {
  value: 'yes' | 'no' | undefined;
  onPick: (v: 'yes' | 'no') => void;
  yesLabel?: string;
  noLabel?: string;
  testid?: string;
}) {
  const cell = (v: 'yes' | 'no', label: string): CSSProperties => ({
    minHeight: 48,
    minWidth: 74,
    padding: '0 14px',
    border: `1px solid ${DIV}`,
    background: value === v ? (v === 'yes' ? ACC : INK) : 'transparent',
    color: value === v ? BG : 'inherit',
    font: '600 13px Archivo, system-ui',
    cursor: 'pointer',
    borderRadius: 0,
  });
  return (
    <div style={{ display: 'flex', gap: 0 }} data-testid={testid}>
      <button type="button" style={cell('yes', yesLabel)} onClick={() => onPick('yes')} className={value === 'yes' ? undefined : 'tap8'}>
        {yesLabel}
      </button>
      <button
        type="button"
        style={{ ...cell('no', noLabel), borderLeft: 'none' }}
        onClick={() => onPick('no')}
        className={value === 'no' ? undefined : 'tap8'}
      >
        {noLabel}
      </button>
    </div>
  );
}
