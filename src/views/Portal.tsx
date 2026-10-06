/* ============================================================================
 * Portal.tsx — VISTA DEL CLIENTE (alumno autenticado, matrícula activa)
 * ----------------------------------------------------------------------------
 * Todas las secciones de datos llegan por src/lib/api.ts (prefijo /me/*).
 * El alumno NO se identifica por id: el servidor lo deduce del JWT.
 *
 * RUTAS QUE ESPERA ESTE FRONT (implementar en tu backend):
 *   GET  /api/me ................ perfil + progreso
 *   GET  /api/me/materiales ..... contenido desbloqueado según progreso
 *   GET  /api/me/clases ......... próximas clases
 *   POST /api/clases/reservar ... reserva (validación anti-solape en servidor)
 *   GET  /api/me/documentos ..... expediente documental
 *   POST /api/me/documentos ..... subida multipart (DNI, ficha médica…)
 *   GET  /api/me/pagos .......... movimientos y cobros
 * ==========================================================================*/
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, CalendarCheck, FileText, CreditCard, Bell, LogOut,
  Lock, CirclePlay, ListChecks, Download, Upload, Clock, MapPin, ArrowRight,
  CalendarPlus, CalendarClock, Phone, MessageCircle, Gauge, ArrowDownToLine,
} from 'lucide-react'
import { Logo, Btn, Pill, Kicker, ProgressRing, HBar, AvatarTxt, useToasts, Toasts, Field } from '@/components/ui'
import * as api from '@/lib/api'
import type { Student, MaterialItem, Lesson, DocFile, Payment } from '@/lib/data'
import { eur, splitFecha, INSTRUCTORS, ANNOUNCEMENTS } from '@/lib/data'
// Nota: INSTRUCTORS y ANNOUNCEMENTS son catálogos estáticos del esquema.
// En producción → GET /api/instructores y GET /api/anuncios.

type TabId = 'panel' | 'material' | 'clases' | 'docs' | 'pagos'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'panel', label: 'Panel', icon: LayoutDashboard },
  { id: 'material', label: 'Material', icon: BookOpen },
  { id: 'clases', label: 'Clases', icon: CalendarCheck },
  { id: 'docs', label: 'Documentos', icon: FileText },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
]

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl border border-edge bg-panel ${className}`} />
)

export default function Portal({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<TabId>('panel')
  const { toasts, push } = useToasts()

  // ---- Estado de datos (cargados vía capa de servicios) ----
  const [student, setStudent] = useState<Student | null>(null)
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [docs, setDocs] = useState<DocFile[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [cargando, setCargando] = useState(true)

  /* Carga inicial: en producción iría dentro de un layout protegido
     (<RequireAuth rol="alumno">) que redirige a /login si no hay JWT. */
  useEffect(() => {
    Promise.all([api.myProfile(), api.myMaterials(), api.myLessons(), api.myDocuments(), api.myPayments()])
      .then(([s, m, l, d, p]) => { setStudent(s); setMaterials(m); setLessons(l); setDocs(d); setPayments(p) })
      .catch(() => push('No se pudo cargar tu expediente', 'err'))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ------------------------------ MATERIAL ------------------------------ */
  const [filtro, setFiltro] = useState('Todos')
  const categorias = ['Todos', ...new Set(materials.map((m) => m.categoria))]
  const filtrados = filtro === 'Todos' ? materials : materials.filter((m) => m.categoria === filtro)

  const abrirMaterial = async (m: MaterialItem) => {
    // TODO(BACKEND): POST /api/materiales/:id/archivo → { url } firmada (S3, 15 min)
    await api.materialFileUrl(m.id)
    push(`"${m.titulo}": aquí se abriría la URL firmada del recurso (ver api.ts)`, 'info')
  }

  /* ------------------------------- CLASES ------------------------------- */
  const [reserva, setReserva] = useState({ instructor: INSTRUCTORS[0], dia: 'Lunes 16', hora: '17:30' })
  const reservar = async () => {
    await api.bookLesson(reserva)
    push(`Práctica solicitada con ${reserva.instructor} · ${reserva.dia} ${reserva.hora}. Pendiente de confirmación.`)
  }

  /* ----------------------------- DOCUMENTOS ----------------------------- */
  const fileRef = useRef<HTMLInputElement>(null)
  const subir = async (file: File) => {
    // TODO(BACKEND): multipart con límite de tamaño y antivirus (ClamAV) en servidor
    await api.uploadStudentDocument(file)
    setDocs((d) => [{ id: `tmp-${Date.now()}`, nombre: file.name, etiqueta: 'Entregado por ti', fecha: new Date().toLocaleDateString('es-ES'), size: `${Math.max(1, Math.round(file.size / 1024))} KB`, origen: 'alumno' }, ...d])
    push(`"${file.name}" recibido — pendiente de validación por secretaría.`)
  }

  const nombre = student?.nombre.split(' ')[0] ?? 'Alumno'
  const cobrado = payments.filter((p) => p.estado === 'pagado').reduce((a, p) => a + p.importe, 0)
  const pendiente = payments.filter((p) => p.estado !== 'pagado').reduce((a, p) => a + p.importe, 0)
  const proxima = lessons[0]

  return (
    <div className="min-h-screen bg-ink text-paper">
      {/* ============================ TOPBAR ============================ */}
      <header className="sticky top-0 z-40 border-b border-edge bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <button onClick={onExit} className="cursor-pointer" aria-label="Volver"><Logo /></button>
          <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative cursor-pointer px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${tab === t.id ? 'text-volt' : 'text-fog hover:text-paper'}`}
              >
                {t.label}
                {tab === t.id && <motion.span layoutId="tab-ink" className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-volt" />}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => push('Sin notificaciones nuevas', 'info')} className="relative grid size-9 cursor-pointer place-items-center rounded-lg border border-edge text-fog transition-colors hover:text-paper" aria-label="Notificaciones">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-volt" />
            </button>
            <div className="hidden items-center gap-2.5 rounded-lg border border-edge py-1.5 pl-1.5 pr-3 sm:flex">
              {student && <AvatarTxt nombre={student.nombre} tono={student.tono} size="size-7" />}
              <div className="leading-tight">
                <p className="text-xs font-semibold">{nombre}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-volt">Permiso {student?.permiso}</p>
              </div>
            </div>
            <button onClick={() => { api.logout(); onExit() }} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-edge text-fog transition-colors hover:text-rose-400" aria-label="Cerrar sesión">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        {/* tabs en móvil */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-edge px-4 py-2 md:hidden">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${tab === t.id ? 'bg-volt text-ink' : 'text-fog'}`}>
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: 'easeOut' }}>

            {cargando ? (
              <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-52 md:col-span-2" /><Skeleton className="h-52" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
            ) : student && (
              <>
                {/* ================================================================ */}
                                {/* TAB · PANEL                                                      */}
                {/* ================================================================ */}
                {tab === 'panel' && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Bienvenida / expediente */}
                    <div className="relative overflow-hidden rounded-2xl border border-edge bg-panel p-6 md:p-8 lg:col-span-2">
                      <p className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[11rem] font-black leading-none text-raise">B</p>
                      <Kicker>KM 12 · Permiso {student.permiso}</Kicker>
                      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight md:text-5xl">
                        Hola, {nombre} —<br />sigues en ruta.
                      </h1>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Pill tone="ok">Matrícula activa</Pill>
                        <Pill>Expediente VLT-2026-0481</Pill>
                        <Pill>Alta {student.alta.split('-').reverse().join('/')}</Pill>
                      </div>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <Btn onClick={() => setTab('material')}>Continuar test · Tema 3 <ArrowRight className="size-4" /></Btn>
                        <Btn tone="line" onClick={() => setTab('clases')}>Reservar práctica</Btn>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="rounded-2xl border border-edge bg-panel p-6">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Tu instructora</p>
                      <div className="mt-4 flex items-center gap-3.5">
                        <span className="grid size-12 place-items-center rounded-full bg-sky-300 font-mono text-sm font-bold text-ink">ER</span>
                        <div>
                          <p className="font-display text-lg font-black">Elena Ruiz</p>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-fog">4,9 / 5 · 312 prácticas</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <Btn tone="line" size="sm" onClick={() => push('Llamada iniciada — TODO(BACKEND): click-to-call vía CRM', 'info')}><Phone className="size-3.5" /> Llamar</Btn>
                        <Btn tone="line" size="sm" onClick={() => push('Chat con tu instructor — TODO(BACKEND): mensajería interna', 'info')}><MessageCircle className="size-3.5" /> Chat</Btn>
                      </div>
                    </div>

                    {/* Progreso teoría */}
                    <div className="rounded-2xl border border-edge bg-panel p-6">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Teoría</p>
                      <div className="mt-4 flex items-center gap-5">
                        <ProgressRing value={student.progresoTeoria} label="Temario" />
                        <div className="flex-1 space-y-3 text-sm text-fog">
                          <p>Has completado <span className="font-semibold text-paper">11 de 14 temas</span> y tu media en tests es <span className="text-volt">9,1</span>.</p>
                          <Btn tone="line" size="sm" onClick={() => setTab('material')}>Ir al material</Btn>
                        </div>
                      </div>
                    </div>

                    {/* Progreso prácticas */}
                    <div className="rounded-2xl border border-edge bg-panel p-6">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Prácticas</p>
                        <Gauge className="size-4 text-volt" />
                      </div>
                      <p className="mt-4 font-display text-4xl font-black">{student.horasPracticas}<span className="text-lg text-fog"> / {student.horasObjetivo} h</span></p>
                      <div className="mt-4"><HBar value={student.horasPracticas} max={student.horasObjetivo} /></div>
                      <p className="mt-3 text-[13px] text-fog">Media de aprobados VOLTA: {student.horasObjetivo} h. Vas al ritmo previsto.</p>
                    </div>

                    {/* Próxima clase */}
                    {proxima && (
                      <div className="rounded-2xl border border-volt/25 bg-volt/[0.04] p-6">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-volt">Próxima clase</p>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-volt text-center text-ink">
                            <div><p className="font-display text-xl font-black leading-none">{splitFecha(proxima.fecha).dia}</p><p className="font-mono text-[9px] font-bold">{splitFecha(proxima.fecha).mes}</p></div>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{proxima.tipo} · {proxima.hora} h</p>
                            <p className="truncate text-[13px] text-fog">{proxima.instructor} · {proxima.lugar}</p>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          {/* TODO(BACKEND): GET /api/clases/:id/ics → descargar evento de calendario */}
                          <Btn tone="line" size="sm" onClick={() => push('TODO(BACKEND): generar archivo .ics del evento', 'info')}><CalendarPlus className="size-3.5" /> Añadir</Btn>
                          <Btn tone="ghost" size="sm" onClick={() => push('TODO(BACKEND): PATCH /api/clases/:id → estado "reprogramar"', 'info')}><CalendarClock className="size-3.5" /> Reprogramar</Btn>
                        </div>
                      </div>
                    )}

                    {/* Avisos */}
                    <div className="rounded-2xl border border-edge bg-panel p-6 lg:col-span-2">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Tablón de avisos</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {ANNOUNCEMENTS.map((a) => (
                          <div key={a.id} className="rounded-xl border border-dashed border-edge p-4">
                            <p className="flex items-center gap-2 font-semibold"><span className="size-1.5 rounded-full bg-volt" />{a.titulo}</p>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-fog">{a.detalle}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen pagos */}
                    <div className="rounded-2xl border border-edge bg-panel p-6">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Mi cuenta</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between"><span className="text-fog">Pagado</span><span className="font-mono font-semibold text-volt">{eur(cobrado)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-fog">Pendiente</span><span className={`font-mono font-semibold ${pendiente > 0 ? 'text-ambers' : ''}`}>{eur(pendiente)}</span></div>
                      </div>
                      <Btn tone="line" size="sm" className="mt-5 w-full" onClick={() => setTab('pagos')}>Ver movimientos</Btn>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                                {/* TAB · MATERIAL (desbloqueado por matrícula activa)               */}
                {/* ================================================================ */}
                {tab === 'material' && (
                  <div>
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <Kicker>Campus virtual</Kicker>
                        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight md:text-4xl">Material de teoría</h1>
                      </div>
                      <Pill tone="ok">{materials.filter((m) => m.estado !== 'bloqueado').length} de {materials.length} desbloqueados</Pill>
                    </div>

                    <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
                      {categorias.map((c) => (
                        <button key={c} onClick={() => setFiltro(c)} className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors ${filtro === c ? 'border-volt bg-volt text-ink' : 'border-edge text-fog hover:border-volt/50 hover:text-paper'}`}>
                          {c}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filtrados.map((m) => {
                        const Icon = m.tipo === 'pdf' ? FileText : m.tipo === 'video' ? CirclePlay : ListChecks
                        const iconColor = m.tipo === 'pdf' ? 'text-ambers' : m.tipo === 'video' ? 'text-sky-300' : 'text-volt'
                        const bloqueado = m.estado === 'bloqueado'
                        return (
                          <article key={m.id} className={`flex flex-col rounded-2xl border bg-panel p-5 transition-all duration-300 ${bloqueado ? 'border-edge opacity-55' : 'border-edge hover:-translate-y-1 hover:border-volt/50'}`}>
                            <div className="flex items-start justify-between">
                              <span className={`grid size-11 place-items-center rounded-xl border border-edge bg-raise ${iconColor}`}><Icon className="size-5" /></span>
                              <Pill tone={m.estado === 'completado' ? 'ok' : m.estado === 'disponible' ? 'info' : 'muted'}>{m.estado}</Pill>
                            </div>
                            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-volt">{m.categoria} · {m.tipo}</p>
                            <h3 className="mt-1.5 font-display text-lg font-black leading-tight">{m.titulo}</h3>
                            <p className="mt-1 font-mono text-[11px] text-fog">{m.meta}</p>
                            {m.progreso > 0 && m.progreso < 100 && (
                              <div className="mt-4"><HBar value={m.progreso} max={100} /><p className="mt-1.5 font-mono text-[10px] text-fog">{m.progreso}% visto</p></div>
                            )}
                            <div className="mt-auto pt-5">
                              {bloqueado ? (
                                <Btn tone="line" size="sm" disabled className="w-full"><Lock className="size-3.5" /> Completa el tema anterior</Btn>
                              ) : (
                                <Btn size="sm" tone={m.estado === 'completado' ? 'line' : 'volt'} className="w-full" onClick={() => abrirMaterial(m)}>
                                  {m.estado === 'completado' ? 'Repasar' : m.tipo === 'test' ? 'Iniciar test' : 'Abrir'} <ArrowRight className="size-3.5" />
                                </Btn>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                                {/* TAB · CLASES                                                     */}
                {/* ================================================================ */}
                {tab === 'clases' && (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <Kicker>Agenda personal</Kicker>
                      <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight">Próximas clases</h1>
                      <div className="mt-6 space-y-3">
                        {lessons.map((l) => (
                          <div key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-edge bg-panel p-4 transition-colors hover:border-edge2">
                            <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-edge bg-raise text-center">
                              <div><p className="font-display text-xl font-black leading-none">{splitFecha(l.fecha).dia}</p><p className="font-mono text-[9px] uppercase text-fog">{splitFecha(l.fecha).mes}</p></div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill tone={l.tipo === 'Práctica' ? 'ok' : 'info'}>{l.tipo}</Pill>
                                <Pill tone={l.estado === 'confirmada' ? 'ok' : l.estado === 'pendiente' ? 'warn' : 'muted'}>{l.estado}</Pill>
                              </div>
                              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold"><Clock className="size-3.5 text-volt" /> {l.hora} h · {l.instructor} <span className="hidden font-mono text-[11px] font-normal text-fog sm:inline">· {l.recurso}</span></p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-fog"><MapPin className="size-3.5" /> {l.lugar}</p>
                            </div>
                            {l.estado === 'reservable'
                              ? <Btn size="sm" onClick={reservar}>Reservar</Btn>
                              : <Btn size="sm" tone="ghost" onClick={() => push('TODO(BACKEND): PATCH /api/clases/:id — reprogramar según política (24 h antes)', 'info')}><CalendarClock className="size-4" /></Btn>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formulario de reserva */}
                    <div className="h-fit rounded-2xl border border-edge bg-panel p-6 lg:sticky lg:top-24">
                      <Kicker>Solicitud</Kicker>
                      <h2 className="mt-2 font-display text-xl font-black uppercase">Reservar práctica</h2>
                      <div className="mt-5 space-y-4">
                        <Field label="Instructor">
                          <select className="input" value={reserva.instructor} onChange={(e) => setReserva({ ...reserva, instructor: e.target.value })}>
                            {INSTRUCTORS.map((i) => <option key={i}>{i}</option>)}
                          </select>
                        </Field>
                        <Field label="Día">
                          <select className="input" value={reserva.dia} onChange={(e) => setReserva({ ...reserva, dia: e.target.value })}>
                            {['Lunes 16', 'Martes 17', 'Miércoles 18', 'Jueves 19', 'Viernes 20'].map((d) => <option key={d}>{d}</option>)}
                          </select>
                        </Field>
                        <Field label="Hora">
                          <select className="input" value={reserva.hora} onChange={(e) => setReserva({ ...reserva, hora: e.target.value })}>
                            {['09:00', '10:30', '12:00', '17:30', '19:00'].map((h) => <option key={h}>{h}</option>)}
                          </select>
                        </Field>
                        <Btn className="w-full" onClick={reservar}>Solicitar hueco <ArrowRight className="size-4" /></Btn>
                        <p className="text-[12px] leading-relaxed text-fog">El servidor valida disponibilidad y solapes (transacción DB) y confirma por email / WhatsApp.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                                {/* TAB · DOCUMENTOS                                                 */}
                {/* ================================================================ */}
                {tab === 'docs' && (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <Kicker>Expediente</Kicker>
                      <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight">Mis documentos</h1>
                      <div className="mt-6 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-panel">
                        {docs.map((d) => (
                          <div key={d.id} className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-raise/60">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-edge bg-raise text-ambers"><FileText className="size-5" /></span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{d.nombre}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-fog">{d.fecha} · {d.size}</p>
                            </div>
                            <Pill tone={d.origen === 'alumno' ? 'info' : 'muted'}>{d.etiqueta}</Pill>
                            {/* TODO(BACKEND): GET /api/me/documentos/:id/descargar → stream o URL firmada */}
                            <Btn tone="line" size="sm" onClick={() => push(`TODO(BACKEND): descarga protegida de "${d.nombre}" (URL firmada)`, 'info')}><Download className="size-4" /></Btn>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subida */}
                    <div className="h-fit rounded-2xl border border-edge bg-panel p-6 lg:sticky lg:top-24">
                      <Kicker>Entregas</Kicker>
                      <h2 className="mt-2 font-display text-xl font-black uppercase">Sube tu documentación</h2>
                      <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); e.target.value = '' }} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="mt-5 flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-edge2 p-8 text-center transition-colors hover:border-volt/60"
                      >
                        <span className="grid size-12 place-items-center rounded-full bg-volt/10 text-volt"><Upload className="size-5" /></span>
                        <span className="text-sm font-semibold">Haz clic para seleccionar</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-fog">PDF o JPG · máx. 10 MB</span>
                      </button>
                      <p className="mt-4 text-[12px] leading-relaxed text-fog">
                        DNI, ficha psicotécnica, autorización menor de edad… Secretaría
                        valida cada entrega y actualiza tu expediente (cola de revisión).
                      </p>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                                {/* TAB · PAGOS                                                      */}
                {/* ================================================================ */}
                {tab === 'pagos' && (
                  <div>
                    <Kicker>Mi cuenta</Kicker>
                    <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight">Pagos y cuotas</h1>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {[
                        { label: 'Pagado', valor: eur(cobrado), icon: ArrowDownToLine, cls: 'text-volt' },
                        { label: 'Pendiente', valor: eur(pendiente), icon: Clock, cls: 'text-ambers' },
                        { label: 'Próximo cobro', valor: '01 MAR', icon: CalendarCheck, cls: 'text-sky-300' },
                      ].map((c) => (
                        <div key={c.label} className="rounded-2xl border border-edge bg-panel p-5">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-fog">{c.label}</p>
                            <c.icon className={`size-4 ${c.cls}`} />
                          </div>
                          <p className={`mt-3 font-display text-3xl font-black ${c.cls}`}>{c.valor}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 overflow-x-auto rounded-2xl border border-edge bg-panel">
                      <table className="w-full min-w-[620px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-edge font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
                            <th className="px-5 py-3.5 font-semibold">Concepto</th>
                            <th className="px-5 py-3.5 font-semibold">Fecha</th>
                            <th className="px-5 py-3.5 font-semibold">Método</th>
                            <th className="px-5 py-3.5 text-right font-semibold">Importe</th>
                            <th className="px-5 py-3.5 font-semibold">Estado</th>
                            <th className="px-5 py-3.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-edge">
                          {payments.map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-raise/50">
                              <td className="px-5 py-4 font-medium">{p.concepto}</td>
                              <td className="px-5 py-4 font-mono text-[12px] text-fog">{p.fecha}</td>
                              <td className="px-5 py-4"><Pill>{p.metodo}</Pill></td>
                              <td className="px-5 py-4 text-right font-mono font-semibold">{eur(p.importe)}</td>
                              <td className="px-5 py-4"><Pill tone={p.estado === 'pagado' ? 'ok' : 'warn'}>{p.estado}</Pill></td>
                              <td className="px-5 py-4 text-right">
                                {p.estado === 'pendiente' && (
                                  /* TODO(BACKEND): POST /api/pagos/checkout → sesión Stripe / formulario Redsys */
                                  <Btn size="sm" onClick={() => push('TODO(BACKEND): redirección a pasarela (Stripe/Redsys) — ver GUIA_BACKEND.md', 'info')}>Pagar</Btn>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 font-mono text-[11px] leading-relaxed text-fog/70">
                      Recibos y facturas oficiales en Documentos. Las cuotas se domicilian
                      el día 1 de cada mes; los cobros online incluyen factura inmediata en PDF.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toasts toasts={toasts} />
    </div>
  )
}
