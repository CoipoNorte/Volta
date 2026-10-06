/* ============================================================================
 * ui.tsx — COMPONENTES COMPARTIDOS (presentación pura, cero lógica de datos)
 * ==========================================================================*/
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleCheck, CircleAlert, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

/* ---------------------------------- LOGO ---------------------------------- */
export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <span className="grid size-9 place-items-center rounded-xl bg-volt">
        {/* "V" sobre fondo voltio — marca */}
        <svg viewBox="0 0 24 24" className="size-5 fill-ink"><path d="M4 4l8 16 8-16h-4.4L12 12.4 8.4 4z" /></svg>
      </span>
      {!compacto && (
        <span className="leading-none">
          <span className="block font-display text-lg font-black tracking-tight">VOLTA</span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-fog">Autoescuela</span>
        </span>
      )}
    </div>
  )
}

/* --------------------------------- BOTONES -------------------------------- */
type BtnTone = 'volt' | 'line' | 'ghost'
export function Btn({
  tone = 'volt', size = 'md', className, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone; size?: 'sm' | 'md' }) {
  const tones: Record<BtnTone, string> = {
    volt: 'bg-volt text-ink hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100',
    line: 'border border-edge bg-transparent text-paper hover:border-volt/60 hover:text-volt',
    ghost: 'text-fog hover:text-paper',
  }
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-mono font-semibold uppercase tracking-[0.16em] transition-all active:translate-y-px',
        size === 'sm' ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-[11px]',
        tones[tone], className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ----------------------------- ETIQUETAS / MONO --------------------------- */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-volt', className)}>
      <span className="inline-block h-px w-6 bg-volt" />
      {children}
    </p>
  )
}

type PillTone = 'ok' | 'warn' | 'err' | 'info' | 'muted'
const pillTones: Record<PillTone, { txt: string; dot: string }> = {
  ok:    { txt: 'text-volt border-volt/30 bg-volt/10',        dot: 'bg-volt' },
  warn:  { txt: 'text-ambers border-ambers/30 bg-ambers/10',  dot: 'bg-ambers' },
  err:   { txt: 'text-rose-400 border-rose-400/30 bg-rose-400/10', dot: 'bg-rose-400' },
  info:  { txt: 'text-sky-300 border-sky-300/30 bg-sky-300/10', dot: 'bg-sky-300' },
  muted: { txt: 'text-fog border-edge bg-raise',              dot: 'bg-fog' },
}
export function Pill({ tone = 'muted', children, className }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider', pillTones[tone].txt, className)}>
      <span className={cn('size-1.5 rounded-full', pillTones[tone].dot)} />
      {children}
    </span>
  )
}

/* -------------------------------- PROGRESO -------------------------------- */
export function ProgressRing({ value, size = 104, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-edge)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--color-volt)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-black leading-none"><CountUp to={value} /><span className="text-sm text-fog">%</span></p>
        {label && <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-fog">{label}</p>}
      </div>
    </div>
  )
}

export function HBar({ value, max, tone = 'bg-volt' }: { value: number; max: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge">
      <motion.div
        className={cn('h-full rounded-full', tone)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

/** Número que "cuenta" al montar — puro detalle de interfaz. */
export function CountUp({ to, prefix = '', suffix = '', duration = 1.2 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000))
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])
  return <>{prefix}{n.toLocaleString('es-ES')}{suffix}</>
}

/* --------------------------------- AVATAR --------------------------------- */
export function AvatarTxt({ nombre, tono, size = 'size-9' }: { nombre: string; tono: string; size?: string }) {
  const ini = nombre.split(' ').slice(0, 2).map((w) => w[0]).join('')
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold text-ink', size)} style={{ background: tono }}>
      {ini}
    </span>
  )
}

/* ---------------------------------- FORM ---------------------------------- */
export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">{label}</span>
      {children}
    </label>
  )
}

/* --------------------------------- TOASTS --------------------------------- */
export interface Toast { id: number; msg: string; tone: 'ok' | 'err' | 'info' }

/** Sistema de avisos mínimo. En producción: sonner / react-hot-toast. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  // useCallback → identidad estable para usar `push` en dependencias de useEffect
  const push = useCallback((msg: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])
  return { toasts, push }
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  const icons = { ok: CircleCheck, err: CircleAlert, info: Info }
  const colors = { ok: 'text-volt', err: 'text-rose-400', info: 'text-sky-300' }
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.tone]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-edge bg-raise/95 p-3.5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', colors[t.tone])} />
              <p className="text-[13px] leading-snug text-paper">{t.msg}</p>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------ CABECERA SECCIÓN -------------------------- */
export function SectionHead({ kicker, titulo, right }: { kicker: string; titulo: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Kicker>{kicker}</Kicker>
        <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-tight md:text-3xl">{titulo}</h2>
      </div>
      {right}
    </div>
  )
}
