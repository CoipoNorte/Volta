/* ============================================================================
 * Admin.tsx — BACKOFFICE DEL EMPLEADO (requiere rol "empleado" en el JWT)
 * ----------------------------------------------------------------------------
 * Módulos de gestión: panel de KPIs, CRM de alumnos, agenda, centro de
 * documentos (envío por email/WhatsApp), facturación con sincronización SAP
 * y panel de integraciones. Todo pasa por src/lib/api.ts.
 *
 * ENDPOINTS QUE ESPERA ESTE FRONT (ver contratos en api.ts):
 *   GET  /api/admin/dashboard ............ KPIs agregados en SQL
 *   GET  /api/students · POST · DELETE ... CRM (baja lógica recomendada)
 *   GET  /api/exports/students.xlsx ...... Excel generado en servidor
 *   GET  /api/admin/agenda ............... semana de clases
 *   GET  /api/documentos/plantillas|envios · POST /api/documentos/enviar
 *   GET  /api/invoices · POST .../sincronizar-sap (SAP Service Layer)
 *   GET  /api/admin/integraciones ........ healthcheck de conectores
 * ==========================================================================*/
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Users, CalendarDays, FileStack, Receipt, Blocks, LogOut,
  Search, Plus, FileDown, Eye, Pencil, Trash2, RefreshCw, Send, TriangleAlert,
  Database, FileSpreadsheet, MessageCircle, Mail, CreditCard, CalendarClock,
  TrendingUp, CarFront,
} from 'lucide-react'
import { Logo, Btn, Pill, Kicker, HBar, AvatarTxt, CountUp, useToasts, Toasts, Field } from '@/components/ui'
import * as api from '@/lib/api'
import type { Student, Invoice, DocTemplate, SendLog, Integration, EstadoAlumno } from '@/lib/data'
import { eur } from '@/lib/data'

type SectionId = 'panel' | 'alumnos' | 'agenda' | 'documentos' | 'facturacion' | 'integraciones'
type Push = (msg: string, tone?: 'ok' | 'err' | 'info') => void

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'panel', label: 'Panel', icon: LayoutDashboard },
  { id: 'alumnos', label: 'Alumnos', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'documentos', label: 'Documentos', icon: FileStack },
  { id: 'facturacion', label: 'Facturación', icon: Receipt },
  { id: 'integraciones', label: 'Integraciones', icon: Blocks },
]

const ESTADO_ALUMNO: Record<EstadoAlumno, { tone: 'ok' | 'info' | 'warn' | 'err' | 'muted'; label: string }> = {
  activo: { tone: 'ok', label: 'Activo' },
  examen: { tone: 'info', label: 'En examen' },
  'pendiente-docs': { tone: 'warn', label: 'Pend. docs' },
  'pendiente-pago': { tone: 'err', label: 'Pend. pago' },
  inactivo: { tone: 'muted', label: 'Inactivo' },
}

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl border border-edge bg-panel ${className}`} />
)

/* ============================ SECCIÓN · PANEL ============================= */
function SecPanel({ push }: { push: Push }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.dashboardData>> | null>(null)
  useEffect(() => { api.dashboardData().then(setData).catch(() => push('Error cargando KPIs', 'err')) }, [push])
  if (!data) return <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}<Skeleton className="h-72 md:col-span-2" /><Skeleton className="h-72 md:col-span-2" /></div>

  const k = data.kpis
  const cards = [
    { label: 'Alumnos activos', valor: k.alumnosActivos.valor, suffix: '', delta: k.alumnosActivos.delta, spark: k.alumnosActivos.spark, icon: Users },
    { label: 'Ingresos · febrero', valor: k.ingresosMes.valor, suffix: ' €', delta: k.ingresosMes.delta, spark: k.ingresosMes.spark, icon: CreditCard },
    { label: 'Clases hoy', valor: k.clasesHoy.valor, suffix: '', delta: k.clasesHoy.delta, spark: k.clasesHoy.spark, icon: CalendarClock },
    { label: 'Tasa apto teórico', valor: k.tasaApto.valor, suffix: ' %', delta: k.tasaApto.delta, spark: k.tasaApto.spark, icon: TrendingUp },
  ]
  const maxAltas = Math.max(...data.altas.map((a) => a.v))

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-edge bg-panel p-5 transition-colors hover:border-edge2">
            <div className="flex items-start justify-between">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">{c.label}</p>
              <span className="grid size-8 place-items-center rounded-lg border border-edge bg-raise text-volt"><c.icon className="size-4" /></span>
            </div>
            <p className="mt-2 font-display text-3xl font-black"><CountUp to={c.valor} suffix={c.suffix} /></p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="flex h-8 items-end gap-1">
                {c.spark.map((v, i) => (
                  <span key={i} className={`w-1.5 rounded-sm ${i === c.spark.length - 1 ? 'bg-volt' : 'bg-edge2'}`} style={{ height: `${v}%` }} />
                ))}
              </div>
              <Pill>{c.delta}</Pill>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Altas por mes — en producción: SELECT DATE_TRUNC('month',… ) GROUP BY */}
        <div className="rounded-2xl border border-edge bg-panel p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Altas por mes · últimos 12</p>
            <Pill tone="ok"><TrendingUp className="size-3" /> tendencia positiva</Pill>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2.5">
            {data.altas.map((a, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[10px] text-fog opacity-0 transition-opacity group-hover:opacity-100">{a.v}</span>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(a.v / maxAltas) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full rounded-t-md ${i === data.altas.length - 1 ? 'bg-volt' : 'bg-edge2 group-hover:bg-volt/50'}`}
                />
                <span className="font-mono text-[9px] uppercase text-fog">{a.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hoy */}
        <div className="rounded-2xl border border-edge bg-panel p-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Clases de hoy</p>
          <div className="mt-4 space-y-1">
            {data.hoy.map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-raise/70">
                <span className="w-11 shrink-0 font-mono text-[12px] font-semibold text-volt">{l.hora}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{l.alumno}</p>
                  <p className="truncate font-mono text-[10px] text-fog">{l.instructor}</p>
                </div>
                <Pill tone={l.tipo === 'Práctica' ? 'ok' : 'info'}>{l.tipo}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Alertas operativas — reglas de negocio en servidor */}
        <div className="rounded-2xl border border-edge bg-panel p-6 xl:col-span-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Alertas operativas</p>
          <div className="mt-4 space-y-2.5">
            {data.alertas.map((a) => (
              <div key={a.id} className={`flex items-center gap-3 rounded-xl border p-3.5 ${a.nivel === 'error' ? 'border-rose-400/25 bg-rose-400/5' : 'border-ambers/25 bg-ambers/5'}`}>
                <TriangleAlert className={`size-4 shrink-0 ${a.nivel === 'error' ? 'text-rose-400' : 'text-ambers'}`} />
                <p className="flex-1 text-[13px]">{a.texto}</p>
                <Btn tone="ghost" size="sm" onClick={() => push('TODO(BACKEND): acción de resolución + registro de auditoría', 'info')}>Resolver</Btn>
              </div>
            ))}
          </div>
        </div>
        {/* Flota */}
        <div className="rounded-2xl border border-edge bg-panel p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Ocupación de flota</p>
            <CarFront className="size-4 text-volt" />
          </div>
          <div className="mt-5 space-y-4">
            {data.flota.map((f) => (
              <div key={f.vehiculo}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-mono text-fog">{f.vehiculo}</span>
                  <span className="font-mono font-semibold text-volt">{f.pct}%</span>
                </div>
                <HBar value={f.pct} max={100} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================== SECCIÓN · ALUMNOS ============================ */
function SecAlumnos({ push }: { push: Push }) {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', permiso: 'B' })

  useEffect(() => { api.listStudents().then(setStudents) }, [])

  const filtrados = students.filter((s) => {
    const q = search.toLowerCase()
    return (estado === 'todos' || s.estado === estado) && (s.nombre.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  })

  const crear = async () => {
    if (!form.nombre || !form.email) return push('Nombre y email son obligatorios', 'err')
    // En producción: POST /api/students → el backend crea expediente + cliente SAP (cola)
    const nuevo = await api.createStudent(form as Pick<Student, 'nombre' | 'email' | 'telefono' | 'permiso'>)
    setStudents((s) => [nuevo, ...s])
    setForm({ nombre: '', email: '', telefono: '', permiso: 'B' })
    setFormOpen(false)
    push(`Alumno "${nuevo.nombre}" creado. El alta en SAP queda encolada (job asíncrono).`)
  }

  const eliminar = async (s: Student) => {
    await api.deleteStudent(s.id)
    setStudents((xs) => xs.filter((x) => x.id !== s.id))
    push(`Baja lógica de ${s.nombre} aplicada (deleted_at). Se conserva el histórico contable.`, 'info')
  }

  const exportar = async () => {
    await api.exportStudentsExcel()
    push('Demo: CSV generado en el navegador. En producción el servidor devuelve el .xlsx.', 'info')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fog" />
          <input className="input pl-9" placeholder="Buscar por nombre o email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADO_ALUMNO).map(([v, e]) => <option key={v} value={v}>{e.label}</option>)}
        </select>
        <Btn tone="line" onClick={exportar}><FileDown className="size-4" /> Exportar Excel</Btn>
        <Btn onClick={() => setFormOpen((v) => !v)}><Plus className="size-4" /> Nuevo alumno</Btn>
      </div>

      {/* Alta rápida */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-volt/30 bg-volt/[0.03] p-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-volt">Alta de expediente · POST /api/students</p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Field label="Nombre completo"><input className="input" placeholder="Nombre y apellidos" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
                <Field label="Email"><input className="input" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Teléfono"><input className="input" placeholder="+34 …" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>
                <Field label="Permiso">
                  <select className="input" value={form.permiso} onChange={(e) => setForm({ ...form, permiso: e.target.value })}>
                    {['B', 'B Intensivo', 'A2', 'AM', 'C'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Btn onClick={crear}>Guardar expediente</Btn>
                <Btn tone="ghost" onClick={() => setFormOpen(false)}>Cancelar</Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla CRM */}
      <div className="overflow-x-auto rounded-2xl border border-edge bg-panel">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-edge font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
              <th className="px-5 py-3.5 font-semibold">Alumno</th>
              <th className="px-5 py-3.5 font-semibold">Permiso</th>
              <th className="px-5 py-3.5 font-semibold">Estado</th>
              <th className="px-5 py-3.5 font-semibold">Progreso</th>
              <th className="px-5 py-3.5 font-semibold">SAP ID</th>
              <th className="px-5 py-3.5 text-right font-semibold">Saldo</th>
              <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {filtrados.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-raise/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <AvatarTxt nombre={s.nombre} tono={s.tono} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.nombre}</p>
                      <p className="truncate font-mono text-[11px] text-fog">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><Pill>{s.permiso}</Pill></td>
                <td className="px-5 py-3.5"><Pill tone={ESTADO_ALUMNO[s.estado].tone}>{ESTADO_ALUMNO[s.estado].label}</Pill></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16"><HBar value={s.progresoTeoria} max={100} /></div>
                    <span className="font-mono text-[11px] text-fog">{s.progresoTeoria}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[12px] text-sky-300">{s.sapId}</td>
                <td className={`px-5 py-3.5 text-right font-mono text-[12px] font-semibold ${s.saldo > 0 ? 'text-ambers' : 'text-fog'}`}>{eur(s.saldo)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => push(`TODO(BACKEND): GET /api/students/${s.id} → ficha 360º`, 'info')} className="grid size-8 cursor-pointer place-items-center rounded-md text-fog transition-colors hover:bg-raise hover:text-paper" aria-label="Ver ficha"><Eye className="size-4" /></button>
                    <button onClick={() => push(`TODO(BACKEND): PATCH /api/students/${s.id} → editar datos`, 'info')} className="grid size-8 cursor-pointer place-items-center rounded-md text-fog transition-colors hover:bg-raise hover:text-paper" aria-label="Editar"><Pencil className="size-4" /></button>
                    <button onClick={() => void eliminar(s)} className="grid size-8 cursor-pointer place-items-center rounded-md text-fog transition-colors hover:bg-rose-400/10 hover:text-rose-400" aria-label="Dar de baja"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="p-10 text-center font-mono text-[12px] text-fog">Sin resultados para esta búsqueda.</p>}
      </div>
      <p className="font-mono text-[11px] text-fog/70">{filtrados.length} de {students.length} expedientes · sincronizado con CRM hace 2 min</p>
    </div>
  )
}

/* ============================ SECCIÓN · AGENDA ============================ */
/* Color por instructor (en prod: columna "color" en tabla instructores) */
const INSTRUCTOR_COLOR: Record<string, string> = {
  'Elena Ruiz': '#C8F542', 'Ruth Serrat': '#7DD3FC', 'Jordi Pons': '#FB923C', 'Marc Vidal': '#F472B6',
}

function SecAgenda({ push }: { push: Push }) {
  const [agenda, setAgenda] = useState<Awaited<ReturnType<typeof api.weekAgenda>> | null>(null)
  useEffect(() => { api.weekAgenda().then(setAgenda) }, [])
  if (!agenda) return <Skeleton className="h-96" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-fog">Semana del 9 — 13 feb 2026 · {Object.values(agenda).flat().length} clases programadas</p>
        <div className="flex gap-2">
          {/* TODO(BACKEND): POST /api/clases — el servidor impide solapes de instructor y vehículo */}
          <Btn onClick={() => push('TODO(BACKEND): POST /api/clases con validación anti-solape', 'info')}><Plus className="size-4" /> Nueva clase</Btn>
          <Btn tone="line" onClick={() => push('TODO(BACKEND): GET /api/exports/agenda.xlsx', 'info')}><FileDown className="size-4" /> Exportar</Btn>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries(agenda).map(([dia, clases]) => (
          <div key={dia} className="rounded-2xl border border-edge bg-panel p-4">
            <div className="flex items-center justify-between border-b border-dashed border-edge pb-3">
              <p className="font-display text-sm font-black uppercase tracking-wide">{dia}</p>
              <span className="font-mono text-[10px] text-fog">{clases.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {clases.map((c, i) => (
                <button
                  key={i}
                  onClick={() => push(`TODO(BACKEND): GET /api/clases/${dia}/${c.hora} → detalle y check-in`, 'info')}
                  className="w-full cursor-pointer rounded-lg border border-edge bg-raise/60 p-2.5 text-left transition-colors hover:border-edge2"
                  style={{ borderLeft: `3px solid ${INSTRUCTOR_COLOR[c.instructor] ?? '#99A1AE'}` }}
                >
                  <p className="flex items-center justify-between font-mono text-[11px] font-semibold text-volt">
                    {c.hora}
                    <span className={`text-[9px] uppercase tracking-wider ${c.tipo === 'Práctica' ? 'text-volt' : 'text-sky-300'}`}>{c.tipo}</span>
                  </p>
                  <p className="mt-1 truncate text-[12.5px] font-medium">{c.alumno}</p>
                  <p className="truncate font-mono text-[10px] text-fog">{c.instructor}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        {Object.entries(INSTRUCTOR_COLOR).map(([n, c]) => (
          <span key={n} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-fog">
            <span className="size-2 rounded-full" style={{ background: c }} /> {n}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ========================== SECCIÓN · DOCUMENTOS ========================== */
function SecDocumentos({ push }: { push: Push }) {
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [sends, setSends] = useState<SendLog[]>([])
  const [tpl, setTpl] = useState('')
  const [alumno, setAlumno] = useState('')
  const [canales, setCanales] = useState<('email' | 'whatsapp')[]>(['email'])
  const [mensaje, setMensaje] = useState('Hola {nombre}, desde VOLTA Autoescuela te enviamos la siguiente documentación sobre tu expediente.')

  useEffect(() => {
    Promise.all([api.listTemplates(), api.listStudents(), api.recentSends()])
      .then(([t, s, l]) => { setTemplates(t); setStudents(s); setSends(l); setTpl(t[0]?.id ?? ''); setAlumno(s[0]?.id ?? '') })
  }, [])

  const toggleCanal = (c: 'email' | 'whatsapp') =>
    setCanales((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]))

  const enviar = async () => {
    if (canales.length === 0) return push('Selecciona al menos un canal', 'err')
    await api.sendDocument({ studentId: alumno, templateId: tpl, canales, mensaje })
    const t = templates.find((x) => x.id === tpl)
    const s = students.find((x) => x.id === alumno)
    setSends((xs) => [{ id: `s-${Date.now()}`, plantilla: t?.nombre ?? '', alumno: s?.nombre ?? '', canales, fecha: 'Ahora', estado: 'entregado' }, ...xs])
    push('Documento encolado. Un worker genera el PDF, lo sube a S3 y lo envía (ver api.ts).')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Plantillas */}
        <div className="rounded-2xl border border-edge bg-panel p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Plantillas ({templates.length})</p>
          <div className="mt-4 space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTpl(t.id)}
                className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all ${tpl === t.id ? 'border-volt/60 bg-volt/[0.06]' : 'border-edge hover:border-edge2'}`}
              >
                <p className="text-[13px] font-semibold">{t.nombre}</p>
                <p className="mt-0.5 font-mono text-[10px] text-fog">{t.detalle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Compositor de envío */}
        <div className="rounded-2xl border border-edge bg-panel p-6 xl:col-span-2">
          <Kicker>Centro de envíos · POST /api/documentos/enviar</Kicker>
          <h3 className="mt-2 font-display text-xl font-black uppercase">Enviar documento a alumno</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Alumno destinatario">
              <select className="input" value={alumno} onChange={(e) => setAlumno(e.target.value)}>
                {students.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Field>
            <Field label="Plantilla">
              <select className="input" value={tpl} onChange={(e) => setTpl(e.target.value)}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Canales</span>
            <div className="flex gap-2">
              <button onClick={() => toggleCanal('email')} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors ${canales.includes('email') ? 'border-volt bg-volt/10 text-volt' : 'border-edge text-fog'}`}>
                <Mail className="size-3.5" /> Email
              </button>
              <button onClick={() => toggleCanal('whatsapp')} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors ${canales.includes('whatsapp') ? 'border-volt bg-volt/10 text-volt' : 'border-edge text-fog'}`}>
                <MessageCircle className="size-3.5" /> WhatsApp
              </button>
            </div>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-fog/70">WhatsApp exige plantillas aprobadas por Meta (Cloud API) fuera de la ventana de 24 h.</p>
          </div>
          <Field label="Mensaje (variables: {nombre}, {permiso}, {fecha_examen})" className="mt-4">
            <textarea className="input min-h-24 resize-none" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
          </Field>
          <div className="mt-5 flex items-center gap-3">
            <Btn onClick={enviar}><Send className="size-4" /> Encolar envío</Btn>
            <p className="font-mono text-[10px] text-fog/70">Respuesta inmediata 202 · el worker notifica el resultado por webhook</p>
          </div>
        </div>
      </div>

      {/* Log de envíos */}
      <div className="overflow-x-auto rounded-2xl border border-edge bg-panel">
        <p className="border-b border-edge px-5 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">Envíos recientes · GET /api/documentos/envios</p>
        <table className="w-full min-w-[720px] text-left text-sm">
          <tbody className="divide-y divide-edge">
            {sends.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-raise/50">
                <td className="px-5 py-3.5 font-medium">{s.plantilla}</td>
                <td className="px-5 py-3.5 text-fog">{s.alumno}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    {s.canales.map((c) => (
                      <span key={c} className="grid size-7 place-items-center rounded-md border border-edge text-fog">
                        {c === 'email' ? <Mail className="size-3.5" /> : <MessageCircle className="size-3.5" />}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-fog">{s.fecha}</td>
                <td className="px-5 py-3.5"><Pill tone={s.estado === 'entregado' ? 'ok' : s.estado === 'leido' ? 'info' : 'err'}>{s.estado}</Pill></td>
                <td className="px-5 py-3.5 text-right">
                  {s.estado === 'error' && (
                    <Btn tone="line" size="sm" onClick={() => push('TODO(BACKEND): POST /api/documentos/envios/:id/reintentar', 'info')}><RefreshCw className="size-3.5" /> Reintentar</Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ========================== SECCIÓN · FACTURACIÓN ========================= */
function SecFacturacion({ push }: { push: Push }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  useEffect(() => { api.listInvoices().then(setInvoices) }, [])

  const sum = (estados: Invoice['estado'][]) => invoices.filter((f) => estados.includes(f.estado)).reduce((a, f) => a + f.importe, 0)
  const sapPend = invoices.filter((f) => f.sap !== 'sincronizado').length

  const syncOne = async (f: Invoice) => {
    await api.syncInvoiceSap(f.id)
    setInvoices((xs) => xs.map((x) => (x.id === f.id ? { ...x, sap: 'sincronizado' } : x)))
    push(`${f.numero} registrada en SAP (Invoices → DocEntry 4471).`)
  }
  const syncAll = async () => {
    await api.syncAllSap()
    setInvoices((xs) => xs.map((x) => ({ ...x, sap: 'sincronizado' as const })))
    push('Lote encolado: todas las facturas pendientes se registrarán en SAP con reintentos.')
  }

  const stats = [
    { label: 'Cobrado', valor: eur(sum(['cobrada'])), cls: 'text-volt' },
    { label: 'Pendiente de cobro', valor: eur(sum(['pendiente'])), cls: 'text-ambers' },
    { label: 'Vencido', valor: eur(sum(['vencida'])), cls: 'text-rose-400' },
    { label: 'Sin sincronizar SAP', valor: String(sapPend), cls: 'text-sky-300' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-edge bg-panel p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">{s.label}</p>
            <p className={`mt-2.5 font-display text-3xl font-black ${s.cls}`}>{s.valor}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-fog">Serie A · ejercicio 2026 · SII / Veri*factu ready</p>
        <div className="flex gap-2">
          <Btn tone="line" onClick={() => push('TODO(BACKEND): POST /api/invoices (numeración correlativa en servidor)', 'info')}><Plus className="size-4" /> Nueva factura</Btn>
          <Btn onClick={syncAll} disabled={sapPend === 0}><Database className="size-4" /> Sincronizar todo con SAP</Btn>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-edge bg-panel">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-edge font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
              <th className="px-5 py-3.5 font-semibold">Nº factura</th>
              <th className="px-5 py-3.5 font-semibold">Cliente</th>
              <th className="px-5 py-3.5 font-semibold">Fecha</th>
              <th className="px-5 py-3.5 text-right font-semibold">Importe</th>
              <th className="px-5 py-3.5 font-semibold">Estado</th>
              <th className="px-5 py-3.5 font-semibold">SAP B1</th>
              <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {invoices.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-raise/50">
                <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-volt">{f.numero}</td>
                <td className="px-5 py-3.5">{f.alumno}</td>
                <td className="px-5 py-3.5 font-mono text-[12px] text-fog">{f.fecha}</td>
                <td className="px-5 py-3.5 text-right font-mono text-[12px] font-semibold">{eur(f.importe)}</td>
                <td className="px-5 py-3.5"><Pill tone={f.estado === 'cobrada' ? 'ok' : f.estado === 'pendiente' ? 'warn' : 'err'}>{f.estado}</Pill></td>
                <td className="px-5 py-3.5"><Pill tone={f.sap === 'sincronizado' ? 'ok' : f.sap === 'pendiente' ? 'warn' : 'err'}>{f.sap}</Pill></td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    {f.sap !== 'sincronizado' && (
                      <button onClick={() => void syncOne(f)} className="grid size-8 cursor-pointer place-items-center rounded-md text-fog transition-colors hover:bg-raise hover:text-volt" aria-label="Sincronizar con SAP"><RefreshCw className="size-4" /></button>
                    )}
                    <button onClick={() => push(`TODO(BACKEND): GET /api/invoices/${f.id}/pdf → factura oficial`, 'info')} className="grid size-8 cursor-pointer place-items-center rounded-md text-fog transition-colors hover:bg-raise hover:text-paper" aria-label="Ver factura"><Eye className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ========================= SECCIÓN · INTEGRACIONES ======================== */
function SecIntegraciones({ push }: { push: Push }) {
  const [items, setItems] = useState<Integration[]>([])
  useEffect(() => { api.listIntegrations().then(setItems) }, [])

  const icono = (id: string) =>
    id === 'int-sap' ? Database : id === 'int-crm' ? Users : id === 'int-xls' ? FileSpreadsheet
    : id === 'int-wa' ? MessageCircle : id === 'int-pay' ? CreditCard : Mail

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-ambers/30 bg-ambers/5 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ambers" />
        <p className="text-[13px] leading-relaxed">
          <span className="font-semibold text-ambers">Regla de seguridad: </span>
          las claves (SAP, WhatsApp, Stripe…) viven sólo en el <code className="font-mono text-[12px] text-volt">.env del servidor</code>.
          Este panel consulta su ESTADO vía <code className="font-mono text-[12px]">GET /api/admin/integraciones</code>; el secreto jamás llega al navegador.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => {
          const Icon = icono(i.id)
          const conectado = i.estado === 'conectado' || i.estado === 'activo'
          return (
            <div key={i.id} className={`rounded-2xl border bg-panel p-5 transition-all hover:-translate-y-1 ${conectado ? 'border-volt/25' : 'border-edge'}`}>
              <div className="flex items-start justify-between">
                <span className={`grid size-11 place-items-center rounded-xl border ${conectado ? 'border-volt/30 bg-volt/10 text-volt' : 'border-edge bg-raise text-fog'}`}>
                  <Icon className="size-5" />
                </span>
                <Pill tone={conectado ? 'ok' : 'warn'}>{i.estado}</Pill>
              </div>
              <h3 className="mt-4 font-display text-lg font-black uppercase tracking-tight">{i.nombre}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-fog">{i.detalle}</p>
              <p className="mt-3 rounded-lg border border-dashed border-edge px-3 py-2 font-mono text-[10px] text-fog">
                env servidor → <span className="text-sky-300">{i.envHint}</span>
              </p>
              <Btn tone="line" size="sm" className="mt-4 w-full" onClick={() => push(`Configura ${i.envHint} en el .env del backend y reinicia el servicio. El healthcheck se actualizará solo.`, 'info')}>
                {conectado ? 'Revisar conexión' : 'Cómo conectar'}
              </Btn>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================== LAYOUT ADMIN ============================== */
export default function Admin({ onExit }: { onExit: () => void }) {
  const [section, setSection] = useState<SectionId>('panel')
  const { toasts, push } = useToasts()
  const activa = SECTIONS.find((s) => s.id === section)!

  return (
    <div className="min-h-screen bg-ink text-paper">
      {/* ----------------------------- Sidebar ----------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-edge bg-coal lg:flex">
        <div className="border-b border-edge p-5"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-all ${section === s.id ? 'bg-volt/10 text-volt' : 'text-fog hover:bg-raise hover:text-paper'}`}
            >
              <s.icon className="size-4" />
              {s.label}
              {section === s.id && <span className="ml-auto size-1.5 rounded-full bg-volt" />}
            </button>
          ))}
        </nav>
        <div className="border-t border-edge p-4">
          <div className="flex items-center gap-3 rounded-xl border border-edge bg-raise/60 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-ambers font-mono text-[11px] font-bold text-ink">SO</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold">Sara Ortiz</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-fog">Coordinación</p>
            </div>
            <button onClick={() => { api.logout(); onExit() }} className="cursor-pointer text-fog transition-colors hover:text-rose-400" aria-label="Salir"><LogOut className="size-4" /></button>
          </div>
        </div>
      </aside>

      {/* ------------------------------ Main ------------------------------- */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-edge bg-ink/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-4">
              <span className="lg:hidden"><Logo compacto /></span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-fog">Backoffice · {SECTIONS.findIndex((s) => s.id === section) + 1}/{SECTIONS.length}</p>
                <h1 className="font-display text-lg font-black uppercase tracking-tight">{activa.label}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="ok" className="hidden sm:inline-flex">SAP conectado</Pill>
              <button onClick={() => { api.logout(); onExit() }} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-edge text-fog transition-colors hover:text-rose-400 lg:hidden" aria-label="Salir"><LogOut className="size-4" /></button>
            </div>
          </div>
          {/* nav móvil */}
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-edge px-4 py-2 lg:hidden">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)} className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${section === s.id ? 'bg-volt text-ink' : 'text-fog'}`}>
                <s.icon className="size-3.5" /> {s.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="px-4 py-8 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              {section === 'panel' && <SecPanel push={push} />}
              {section === 'alumnos' && <SecAlumnos push={push} />}
              {section === 'agenda' && <SecAgenda push={push} />}
              {section === 'documentos' && <SecDocumentos push={push} />}
              {section === 'facturacion' && <SecFacturacion push={push} />}
              {section === 'integraciones' && <SecIntegraciones push={push} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toasts toasts={toasts} />
    </div>
  )
}
