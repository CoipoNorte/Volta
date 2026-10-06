/* ============================================================================
 * Landing.tsx — VISTA PÚBLICA (sin autenticación)
 * Punto de entrada del site: presentación de la autoescuela + selector de
 * acceso a los dos portales. En producción estas rutas serían:
 *   /            → este landing
 *   /portal      → portal alumno   (protegida por JWT rol "alumno")
 *   /admin       → backoffice      (protegida por JWT rol "empleado")
 * ==========================================================================*/
import { motion } from 'framer-motion'
import {
  ArrowRight, ArrowUpRight, UserRound, LayoutDashboard, MapPin, Phone, Mail, Clock,
  ShieldCheck, Gauge, GraduationCap, ClipboardList, BookOpen, Route, BadgeCheck, CircleCheck,
} from 'lucide-react'
import { Logo, Btn, Kicker, CountUp } from '@/components/ui'
import { COURSES } from '@/lib/data'

type Props = { onEnter: (vista: 'portal' | 'admin') => void }

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
}

const STATS = [
  { n: 4800, suffix: '+', label: 'Conductores formados' },
  { n: 97, suffix: '%', label: 'Aprobados a la primera' },
  { n: 22, suffix: '', label: 'Vehículos en flota' },
  { n: 28, suffix: '', label: 'Años en carretera' },
]

const METHOD = [
  { n: '01', icon: ClipboardList, t: 'Matrícula online', d: 'Alta en 5 minutos. Subes tu DNI, firmas digital y tu expediente entra en el CRM.' },
  { n: '02', icon: BookOpen, t: 'Teoría interactiva', d: 'Campus 24/7 con tests oficiales DGT, estadísticas y material desbloqueable.' },
  { n: '03', icon: Route, t: 'Prácticas 1:1', d: 'Reserva huecos desde el portal. Instructor asignado y rutas medidas progreso a progreso.' },
  { n: '04', icon: BadgeCheck, t: 'Examen y carnet', d: 'Te citamos, te llevamos y tramitamos la provisión con la DGT. Tú solo conduces.' },
]

const MARQUEE = ['TEORÍA ONLINE', 'TESTS DGT ILIMITADOS', 'PRÁCTICAS 1:1', 'CAMPUS 24/7', 'FLOTA PROPIA', 'APROBADO A LA PRIMERA', 'RECUPERA TUS PUNTOS']

export default function Landing({ onEnter }: Props) {
  return (
    <div className="min-h-screen bg-ink text-paper">

      {/* ============================== NAV ============================== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-edge/70 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.2em] text-fog md:flex">
            {['Cursos', 'Método', 'Acceso', 'Contacto'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="transition-colors hover:text-volt">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Btn tone="ghost" size="sm" onClick={() => onEnter('portal')}>
              <UserRound className="size-3.5" /> Alumno
            </Btn>
            <Btn tone="line" size="sm" onClick={() => onEnter('admin')}>
              <LayoutDashboard className="size-3.5" /> Empleados
            </Btn>
          </div>
        </div>
      </header>

      {/* ============================== HERO ============================== */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden">
        <img src="/img/hero.jpg" alt="Carretera nocturna con estelas de luz" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-ink/40" />
        <div className="absolute inset-0 bg-grain" />

        {/* Líneas de carretera animadas (puro SVG, sin coste de render) */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 1440 810" preserveAspectRatio="none" aria-hidden>
          <path d="M-40 700 C 360 640 620 330 1500 380" fill="none" stroke="var(--color-volt)" strokeOpacity=".45" strokeWidth="3" strokeDasharray="22 34" className="dash-slow" />
          <path d="M-60 790 C 420 720 780 470 1520 530" fill="none" stroke="#EEF1F3" strokeOpacity=".22" strokeWidth="2" strokeDasharray="14 26" className="dash-fast" />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 pt-40 md:px-8">
          <motion.div initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <Kicker>Autoescuela digital · Madrid · desde 1998</Kicker>
            <h1 className="mt-6 font-display font-black uppercase leading-[0.92] tracking-tight">
              <span className="block text-[clamp(3rem,9vw,8.5rem)]">Domina la</span>
              <span className="block text-[clamp(3rem,9vw,8.5rem)] italic text-volt">carretera<span className="text-paper not-italic">.</span></span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-fog md:text-lg">
              Matrícula online, campus de teoría con tests oficiales y prácticas que
              reservas desde tu móvil. Toda la gestión —pagos, documentos, exámenes—
              dentro de una sola plataforma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#cursos"><Btn>Ver permisos <ArrowRight className="size-4" /></Btn></a>
              <a href="#acceso"><Btn tone="line">Acceder al portal <ArrowUpRight className="size-4" /></Btn></a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.18em] text-fog">
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-volt" /> Centro homologado DGT</span>
              <span className="flex items-center gap-2"><Gauge className="size-4 text-volt" /> Flota propia de 22 vehículos</span>
              <span className="flex items-center gap-2"><GraduationCap className="size-4 text-volt" /> +4.800 conductores</span>
            </div>
          </motion.div>

          {/* stats */}
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-edge bg-edge/60 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-coal/80 p-5 backdrop-blur">
                <p className="font-display text-3xl font-black text-volt"><CountUp to={s.n} suffix={s.suffix} /></p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fog">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SELECTOR DE ACCESO (GATES) ===================== */}
      {/* Es el conmutador de roles del esquema. En producción sería un LOGIN
          real: POST /auth/login → el servidor devuelve el rol y el router te
          manda a /portal o /admin según el JWT. Ver src/lib/api.ts */}
      <section id="acceso" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <motion.div {...reveal}>
          <Kicker>Acceso a la plataforma</Kicker>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
            Un portal, <span className="txt-outline-volt">dos carreteras</span>
          </h2>
        </motion.div>

        <div className="mt-12 flex flex-col gap-4 md:h-[440px] md:flex-row">
          {/* ---- ALUMNO ---- */}
          <motion.button
            {...reveal}
            onClick={() => onEnter('portal')}
            className="group relative h-80 flex-1 cursor-pointer overflow-hidden rounded-2xl border border-edge text-left transition-[flex] duration-500 ease-out md:h-auto md:hover:flex-[1.7]"
          >
            <img src="/img/alumno.jpg" alt="Alumno conduciendo de noche" className="absolute inset-0 size-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
              <span className="w-fit rounded-full border border-volt/40 bg-volt/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-volt">Portal del alumno</span>
              <div>
                <h3 className="font-display text-3xl font-black uppercase tracking-tight md:text-5xl">Soy<br />alumno</h3>
                <p className="mt-3 max-w-xs text-sm text-fog">Tu progreso, material de teoría, clases reservables y todos tus documentos y pagos.</p>
                <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-volt">
                  Entrar al campus <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </div>
          </motion.button>

          {/* ---- EMPLEADO ---- */}
          <motion.button
            {...reveal}
            onClick={() => onEnter('admin')}
            className="group relative h-80 flex-1 cursor-pointer overflow-hidden rounded-2xl border border-edge text-left transition-[flex] duration-500 ease-out md:h-auto md:hover:flex-[1.7]"
          >
            <img src="/img/empleado.jpg" alt="Sala de control con paneles de gestión" className="absolute inset-0 size-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
              <span className="w-fit rounded-full border border-ambers/40 bg-ambers/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ambers">Backoffice</span>
              <div>
                <h3 className="font-display text-3xl font-black uppercase tracking-tight md:text-5xl">Soy<br />empleado</h3>
                <p className="mt-3 max-w-xs text-sm text-fog">CRM de alumnos, agenda, envío de documentos, facturación y conectores SAP / Excel / WhatsApp.</p>
                <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ambers">
                  Abrir gestión <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </div>
          </motion.button>
        </div>
      </section>

      {/* ======================= MARQUEE ======================= */}
      <div className="overflow-hidden border-y border-edge bg-coal py-4">
        <div className="flex w-max animate-marquee items-center gap-10">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-lg font-black uppercase tracking-wide text-fog/70">
              {m} <span className="inline-block size-2 rotate-45 bg-volt" />
            </span>
          ))}
        </div>
      </div>

      {/* ============================== CURSOS ============================== */}
      {/* Los cursos también podrían venir de la API: GET /api/cursos (público) */}
      <section id="cursos" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <motion.div {...reveal} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Métrica 01 · Catálogo</Kicker>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
              Permisos y <span className="txt-outline">cursos</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-fog">Precios con tasas DGT gestionadas desde secretaría. Financiación hasta 12 meses sin intereses.</p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c, i) => (
            <motion.article
              key={c.num}
              {...reveal}
              transition={{ ...reveal.transition, delay: (i % 3) * 0.08 }}
              className="group flex flex-col rounded-2xl border border-edge bg-panel p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-volt/50"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-semibold text-volt">{c.num}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">{c.precio}</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-tight">{c.nombre}</h3>
              <p className="mt-1 text-sm text-fog">{c.detalle}</p>
              <ul className="mt-5 space-y-2 border-t border-dashed border-edge pt-5">
                {c.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px] text-fog">
                    <CircleCheck className="size-3.5 shrink-0 text-volt" /> {f}
                  </li>
                ))}
              </ul>
              <a href="#acceso" className="mt-auto pt-6">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-paper transition-colors group-hover:text-volt">
                  Matricúlate <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ============================== MÉTODO ============================== */}
      <section id="metodo" className="border-t border-edge bg-coal/50">
        <div className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          <motion.div {...reveal}>
            <Kicker>Métrica 02 · El método</Kicker>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
              De cero a carnet <span className="txt-outline-volt">en 4 semanas</span>
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-10 md:grid-cols-4">
            {METHOD.map((s, i) => (
              <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.09 }} className="relative">
                <div className="absolute -top-5 left-0 h-px w-full border-t border-dashed border-edge" />
                <span className="absolute -top-[5px] left-0 size-2 rotate-45 bg-volt" />
                <p className="txt-outline font-display text-6xl font-black">{s.n}</p>
                <s.icon className="mt-5 size-6 text-volt" />
                <h3 className="mt-3 font-display text-lg font-black uppercase tracking-tight">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA FINAL ============================== */}
      <section id="contacto" className="bg-volt text-ink">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-20 md:flex-row md:items-end md:justify-between md:px-8">
          <motion.div {...reveal}>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em]">Sede Centro · C/ Gran Vía 44 · Madrid</p>
            <h2 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-8xl">
              ¿En marcha?
            </h2>
            <p className="mt-4 max-w-md font-medium">Primera clase de valoración gratis. Te llamamos, te citamos y te ponemos al volante.</p>
          </motion.div>
          <motion.div {...reveal} className="flex items-center gap-3">
            <a href="tel:+34910123456" className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-volt transition-transform hover:-translate-y-0.5">
              <Phone className="size-4" /> 910 123 456
            </a>
            <button onClick={() => onEnter('portal')} className="inline-flex cursor-pointer items-center gap-2 rounded-md border-2 border-ink px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5">
              Portal alumnos <ArrowRight className="size-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="border-t border-edge">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog">
              Autoescuela homologada por la DGT. Plataforma propia para teoría,
              reservas y toda la gestión de tu expediente.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Contacto</p>
            <ul className="mt-4 space-y-2.5 text-sm text-fog">
              <li className="flex items-center gap-2.5"><MapPin className="size-4 text-volt" /> C/ Gran Vía 44, 28013 Madrid</li>
              <li className="flex items-center gap-2.5"><Phone className="size-4 text-volt" /> 910 123 456</li>
              <li className="flex items-center gap-2.5"><Mail className="size-4 text-volt" /> hola@volta.auto</li>
              <li className="flex items-center gap-2.5"><Clock className="size-4 text-volt" /> L–V 9:00–21:00 · S 10–14</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Esquema</p>
            <ul className="mt-4 space-y-2.5 font-mono text-[11px] leading-relaxed text-fog/80">
              <li>v1.0 · demo sin backend</li>
              <li>Datos ficticios (src/lib/data.ts)</li>
              <li>Contrato API en src/lib/api.ts</li>
              <li>Guía: docs/GUIA_BACKEND.md</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-dashed border-edge">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 font-mono text-[10px] uppercase tracking-[0.2em] text-fog/60 md:px-8">
            <span>© 2026 VOLTA Autoescuela S.L. — Todos los derechos reservados</span>
            <span>Aviso legal · Privacidad · Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
