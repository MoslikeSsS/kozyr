import type { ReactNode } from 'react';
import { IconX } from './Icons';

export function Btn({
  tone = 'gold', size = 'md', className = '', disabled, onClick, children, title,
}: {
  tone?: 'gold' | 'red' | 'green' | 'dark' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
}) {
  const tones: Record<string, string> = {
    gold: 'bg-gradient-to-b from-gold-300 to-gold-600 text-felt-950 shadow-[0_4px_16px_rgba(227,169,60,0.35)] hover:brightness-110',
    red: 'bg-gradient-to-b from-[#ff7069] to-deepred text-white shadow-[0_4px_16px_rgba(179,36,44,0.4)] hover:brightness-110',
    green: 'bg-gradient-to-b from-felt-400 to-felt-700 text-white shadow-[0_4px_16px_rgba(46,138,91,0.35)] hover:brightness-110',
    dark: 'bg-black/40 border border-white/15 text-cream hover:bg-black/55',
    ghost: 'bg-transparent border border-white/10 text-cream/70 hover:text-cream hover:border-white/25',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2.5 text-[13px]',
    lg: 'px-6 py-3.5 text-[15px]',
  };
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        'font-display font-bold uppercase tracking-wider rounded-lg no-select inline-flex items-center justify-center gap-2',
        'transition-all duration-150 active:translate-y-[2px] disabled:opacity-35 disabled:pointer-events-none',
        tones[tone], sizes[size], className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function Panel({ title, children, className = '', right }: { title?: ReactNode; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <div className={`bg-felt-900/85 border border-gold-500/15 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm ${className}`}>
      {title !== undefined && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5">
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-gold-400">{title}</div>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Seg<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string }[];
}) {
  return (
    <div className="inline-flex bg-black/40 rounded-lg p-1 gap-1 border border-white/10">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={[
            'px-3 py-1.5 rounded-md text-[12px] font-bold transition-all duration-150',
            value === o.v
              ? 'bg-gradient-to-b from-gold-300 to-gold-600 text-felt-950 shadow'
              : 'text-cream/60 hover:text-cream',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type Toast = { id: number; text: string; tone: 'info' | 'err' | 'ok' };

export function Toasts({ items, onClose }: { items: Toast[]; onClose: (id: number) => void }) {
  const toneCls: Record<string, string> = {
    info: 'border-gold-500/40 text-gold-200',
    err: 'border-hotred/60 text-[#ffb3b0]',
    ok: 'border-felt-400/60 text-[#b8f0d2]',
  };
  return (
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 w-[280px] pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto anim-rise flex items-start gap-2 bg-felt-900/95 border rounded-lg px-3 py-2.5 text-[13px] shadow-xl backdrop-blur ${toneCls[t.tone]}`}
        >
          <span className="flex-1 leading-snug">{t.text}</span>
          <button onClick={() => onClose(t.id)} className="opacity-50 hover:opacity-100 mt-0.5">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Banner({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'red' | 'green' }) {
  const tones = {
    gold: 'border-gold-400/70 text-gold-200 shadow-[0_0_60px_rgba(227,169,60,0.35)]',
    red: 'border-hotred/70 text-[#ffc9c6] shadow-[0_0_60px_rgba(229,72,77,0.35)]',
    green: 'border-felt-400/70 text-[#c9f5de] shadow-[0_0_60px_rgba(46,138,91,0.35)]',
  };
  return (
    <div className="absolute inset-0 z-40 grid place-items-center pointer-events-none">
      <div className={`anim-banner bg-felt-950/92 border-2 rounded-2xl px-10 py-6 text-center backdrop-blur-sm ${tones[tone]}`}>
        {children}
      </div>
    </div>
  );
}

export function AmountPill({ value, className = '' }: { value: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 bg-black/50 border border-gold-500/40 text-gold-200 rounded-full px-2.5 py-0.5 font-display text-[12px] font-bold ${className}`}>
      <span className="w-3 h-3 rounded-full border-2 border-dashed border-gold-400/80 bg-gold-600/40 inline-block" />
      {value}
    </span>
  );
}

export function CodeBig({ code }: { code: string }) {
  return (
    <div className="flex gap-2 justify-center">
      {code.split('').map((d, i) => (
        <span
          key={i}
          className="w-14 h-16 grid place-items-center bg-felt-950/80 border-2 border-gold-500/50 rounded-xl font-display text-4xl font-black text-gold-300 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)]"
        >
          {d}
        </span>
      ))}
    </div>
  );
}
