/* ============================================================================
 * api.ts — CAPA DE SERVICIOS (única puerta de datos de la UI)
 * ----------------------------------------------------------------------------
 * REGLA DE ORO: los componentes NUNCA importan `data.ts` ni hacen `fetch`
 * directamente. Todo pasa por estas funciones. Así, para pasar del esquema
 * a producción solo tocas ESTE archivo.
 *
 * CÓMO CONECTAR TU BACKEND:
 *   1. Levanta tu API (Laravel / FastAPI / Express / Spring…)
 *   2. `cp .env.example .env.local` y ajusta VITE_API_URL
 *   3. VITE_USE_MOCK=false → todo lo demás funciona igual
 *
 * CONTRATO GENERAL (idéntico en cualquier stack):
 *   · Auth:   POST /auth/login → { token, user } — JWT en Authorization: Bearer
 *   · Errores: { "message": "texto legible" } con status 4xx/5xx
 *   · Listas:  devuelven array plano (la paginación se añade con ?page=&per_page=)
 *   · Dinero:  céntimos enteros · Fechas: ISO-8601
 * ==========================================================================*/

import {
  STUDENTS, MATERIALS, MY_LESSONS, MY_DOCS, MY_PAYMENTS,
  INVOICES, DOC_TEMPLATES, SEND_LOG, INTEGRATIONS, KPIS,
  SIGNUPS_BY_MONTH, TODAY_LESSONS, WEEK_AGENDA, FLEET_USAGE, ADMIN_ALERTS,
} from './data'
import type {
  Student, MaterialItem, Lesson, DocFile, Payment, Invoice,
  DocTemplate, SendLog, Integration,
} from './data'

/** Base de tu API. En local: http://localhost:8000/api (FastAPI/Laravel…) */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

/** MODO DEMO: mientras sea distinto de "false" se usan los datos de data.ts */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/* ----------------------------------------------------------------------------
 * request<T> — wrapper de fetch único.
 * Centraliza: URL base, JSON, token JWT y normalización de errores.
 * Si mañana añades refresh-token o telemetría, solo tocas aquí.
 * --------------------------------------------------------------------------*/
const token = () => localStorage.getItem('volta_token')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.message ?? `Error ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

/** Simula latencia de red para que el esquema se comporte como producción. */
const mock = <T,>(data: T, ms = 380): Promise<T> =>
  new Promise((r) => setTimeout(() => r(structuredClone(data)), ms))

/* ============================================================================
 * AUTH
 * ----------------------------------------------------------------------------
 * FLUJO JWT RECOMENDADO (aplica a los 4 stacks):
 *   1. POST /auth/login { email, password } → 200 { token, user }
 *   2. Guardar el token (localStorage para demo; ideal: cookie httpOnly + CSRF)
 *   3. Cada petición posterior lleva  Authorization: Bearer <token>
 *   4. Middleware en servidor valida firma, expiración y ROL (alumno/empleado)
 *      → el portal del empleado exige rol "empleado" en cada endpoint /admin/*
 * ==========================================================================*/
export interface AuthUser { id: string; nombre: string; rol: 'alumno' | 'empleado' }

export async function login(email: string, _password: string): Promise<{ token: string; user: AuthUser }> {
  if (USE_MOCK) {
    localStorage.setItem('volta_token', 'demo-token')
    return mock({ token: 'demo-token', user: { id: 'st-001', nombre: 'Lucía Mendoza', rol: 'alumno' } })
  }
  // Laravel:  Route::post('/auth/login', [AuthController::class,'login']);
  // FastAPI:  @router.post("/auth/login")  (OAuth2PasswordRequestForm)
  // Express:  router.post('/auth/login', ctrl.login)  (jsonwebtoken/bcrypt)
  // Spring:   @PostMapping("/auth/login")  (Spring Security + jjwt)
  const data = await request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: _password }),
  })
  localStorage.setItem('volta_token', data.token)
  return data
}

export function logout() { localStorage.removeItem('volta_token') }

/* ============================================================================
 * PORTAL DEL ALUMNO  (todo lo que ve el cliente autenticado → prefijo /me)
 * El servidor infiere el alumno desde el JWT — NUNCA confíes en un id que
 * llegue del cliente para datos personales.
 * ==========================================================================*/

/** GET /api/me → perfil + progreso del alumno autenticado */
export async function myProfile(): Promise<Student> {
  if (USE_MOCK) return mock(STUDENTS[0]) // Lucía · matrícula activa (datos demo)
  return request<Student>('/me')
}

/** GET /api/me/materiales → solo si la matrícula está activa.
 *  El backend decide "bloqueado/disponible" (regla de negocio, no en el front). */
export async function myMaterials(): Promise<MaterialItem[]> {
  if (USE_MOCK) return mock(MATERIALS)
  return request<MaterialItem[]>('/me/materiales')
}

/** GET /api/me/clases → próximas clases del alumno */
export async function myLessons(): Promise<Lesson[]> {
  if (USE_MOCK) return mock(MY_LESSONS)
  return request<Lesson[]>('/me/clases')
}

/** GET /api/me/documentos → listado; el BINARIO se sirve aparte con URL
 *  firmada (S3/GCS) o endpoint protegido que streamee el PDF. Nunca metas
 *  documentos privados en la carpeta pública del servidor. */
export async function myDocuments(): Promise<DocFile[]> {
  if (USE_MOCK) return mock(MY_DOCS)
  return request<DocFile[]>('/me/documentos')
}

/** GET /api/me/pagos → historial de pagos/cuotas del alumno */
export async function myPayments(): Promise<Payment[]> {
  if (USE_MOCK) return mock(MY_PAYMENTS)
  return request<Payment[]>('/me/pagos')
}

/** POST /api/clases/reservar  { instructor, fecha, hora }
 *  IMPORTANTE: la validación de huecos libres y anti-solape ocurre SIEMPRE en
 *  el servidor (transacción DB). El front solo propone; el backend confirma. */
export async function bookLesson(payload: { instructor: string; dia: string; hora: string }): Promise<{ ok: true }> {
  if (USE_MOCK) return mock({ ok: true }, 650)
  return request('/clases/reservar', { method: 'POST', body: JSON.stringify(payload) })
}

/** POST /api/materiales/:id/archivo → { url }  (URL firmada temporal, p. ej. 15 min) */
export async function materialFileUrl(id: string): Promise<{ url: string }> {
  if (USE_MOCK) return mock({ url: '#' })
  return request(`/materiales/${id}/archivo`, { method: 'POST' })
}

/** POST /api/me/documentos  (multipart/form-data)
 *  Subida REAL con FormData — ojo: NO pongas Content-Type a mano, el navegador
 *  añade el boundary. Valida extensión/tamaño TAMBIÉN en servidor. */
export async function uploadStudentDocument(file: File): Promise<{ ok: true; nombre: string }> {
  if (USE_MOCK) return mock({ ok: true, nombre: file.name }, 900)
  const fd = new FormData()
  fd.append('archivo', file)
  const res = await fetch(`${API_URL}/me/documentos`, {
    method: 'POST',
    headers: token() ? { Authorization: `Bearer ${token()}` } : {},
    body: fd,
  })
  if (!res.ok) throw new ApiError(res.status, 'Error al subir el documento')
  return res.json()
}

/* ============================================================================
 * BACKOFFICE — ALUMNOS (CRM)   ·   requiere rol "empleado"
 * ==========================================================================*/

/** GET /api/students?search=&estado=  ·  listado CRM */
export async function listStudents(): Promise<Student[]> {
  if (USE_MOCK) return mock(STUDENTS)
  return request<Student[]>('/students')
}

/** POST /api/students  ·  IMPORTANTE: tras crear el alumno aquí, el backend
 *  debe dar de alta el cliente también en SAP (OCRD) dentro de un job/cola
 *  para no bloquear la respuesta HTTP (nunca llames a SAP en caliente). */
export async function createStudent(data: Pick<Student, 'nombre' | 'email' | 'telefono' | 'permiso'>): Promise<Student> {
  if (USE_MOCK) {
    const nuevo: Student = {
      id: `st-${Date.now()}`, sapId: 'C-PENDIENTE', ...data,
      estado: 'pendiente-docs', progresoTeoria: 0, horasPracticas: 0,
      horasObjetivo: 20, saldo: 0, alta: new Date().toISOString().slice(0, 10), tono: '#C8F542',
    }
    return mock(nuevo, 600)
  }
  return request<Student>('/students', { method: 'POST', body: JSON.stringify(data) })
}

/** DELETE /api/students/:id  ·  mejor BAJA LÓGICA (columna deleted_at /
 *  estado=inactivo) que borrado físico: conservas histórico contable. */
export async function deleteStudent(id: string): Promise<{ ok: true }> {
  if (USE_MOCK) return mock({ ok: true }, 400)
  return request(`/students/${id}`, { method: 'DELETE' })
}

/** GET /api/exports/students.xlsx — descarga de Excel REAL.
 *  En el esquema generamos un CSV en el navegador (válido para demo), pero la
 *  versión seria la genera el SERVIDOR con librería de Excel:
 *    · PHP:    Maatwebsite/Laravel-Excel  →  return Excel::download(...)
 *    · Python: openpyxl / pandas.to_excel →  StreamingResponse + media type xlsx
 *    · Node:   exceljs                    →  res.send(buffer)
 *    · Java:   Apache POI                 →  ByteArrayResource
 *  El frontend solo hace: fetch con Accept: …vnd.openxmlformats… + blob. */
export async function exportStudentsExcel(): Promise<void> {
  if (USE_MOCK) {
    const cab = 'sap_id;nombre;email;telefono;permiso;estado;saldo_centimos\n'
    const filas = STUDENTS.map((s) =>
      [s.sapId, s.nombre, s.email, s.telefono, s.permiso, s.estado, s.saldo]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'),
    ).join('\n')
    // \uFEFF = BOM para que Excel respete tildes/ñ al abrir el CSV
    const url = URL.createObjectURL(new Blob(['\uFEFF' + cab + filas], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'alumnos_volta.csv' })
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  const res = await fetch(`${API_URL}/exports/students.xlsx`, {
    headers: token() ? { Authorization: `Bearer ${token()}` } : {},
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: 'alumnos.xlsx' }).click()
  URL.revokeObjectURL(url)
}

/* ============================================================================
 * BACKOFFICE — DOCUMENTOS Y COMUNICACIONES
 * ==========================================================================*/

/** GET /api/documentos/plantillas */
export async function listTemplates(): Promise<DocTemplate[]> {
  if (USE_MOCK) return mock(DOC_TEMPLATES)
  return request<DocTemplate[]>('/documentos/plantillas')
}

/** POST /api/documentos/enviar { studentId, templateId, canales, mensaje }
 *  ARQUITECTURA RECOMENDADA: el controlador NO envía nada en caliente;
 *  encola el trabajo (Laravel Queue / Celery / BullMQ) y un worker:
 *    1. Genera el PDF (dompdf · WeasyPrint · puppeteer · iText)
 *    2. Lo sube a almacenamiento (S3) y guarda registro en tabla envios
 *    3. Manda por SMTP y/o WhatsApp Cloud API (requiere plantilla aprobada)
 *    4. Webhooks actualizan estado: entregado → leído → error */
export async function sendDocument(payload: {
  studentId: string; templateId: string; canales: ('email' | 'whatsapp')[]; mensaje: string
}): Promise<{ ok: true }> {
  if (USE_MOCK) { void payload; return mock({ ok: true }, 800) }
  return request('/documentos/enviar', { method: 'POST', body: JSON.stringify(payload) })
}

/** GET /api/documentos/envios → últimos envíos con estado */
export async function recentSends(): Promise<SendLog[]> {
  if (USE_MOCK) return mock(SEND_LOG)
  return request<SendLog[]>('/documentos/envios')
}

/* ============================================================================
 * BACKOFFICE — FACTURACIÓN + SAP
 * ==========================================================================*/

/** GET /api/invoices */
export async function listInvoices(): Promise<Invoice[]> {
  if (USE_MOCK) return mock(INVOICES)
  return request<Invoice[]>('/invoices')
}

/** POST /api/invoices/:id/sincronizar-sap
 *  INTEGRACIÓN SAP BUSINESS ONE (Service Layer REST):
 *    1. Login:  POST {SAP}/b1s/v1/Login  →  cookie de sesión (30 min)
 *    2. Create: POST {SAP}/b1s/v1/Invoices  { CardCode, DocDate, Lines:[…] }
 *    3. Guarda en tu tabla invoices el DocEntry/DocNum devuelto
 *  NUNCA expongas credenciales SAP en el frontend: proxy en tu backend y
 *  reintenta con backoff en cola si SAP está caído (circuit breaker). */
export async function syncInvoiceSap(id: string): Promise<{ ok: true }> {
  if (USE_MOCK) { void id; return mock({ ok: true }, 700) }
  return request(`/invoices/${id}/sincronizar-sap`, { method: 'POST' })
}

/** POST /api/invoices/sincronizar-sap  (todas las pendientes — batch en cola) */
export async function syncAllSap(): Promise<{ ok: true }> {
  if (USE_MOCK) return mock({ ok: true }, 1000)
  return request('/invoices/sincronizar-sap', { method: 'POST' })
}

/* ============================================================================
 * BACKOFFICE — PANEL, AGENDA E INTEGRACIONES
 * ==========================================================================*/

/** GET /api/admin/dashboard → KPIs + gráficas preagregadas en SQL.
 *  Agregación en servidor (GROUP BY), no traigas tablas enteras al cliente. */
export async function dashboardData() {
  if (USE_MOCK) return mock({ kpis: KPIS, altas: SIGNUPS_BY_MONTH, hoy: TODAY_LESSONS, flota: FLEET_USAGE, alertas: ADMIN_ALERTS })
  return request<typeof KPIS extends never ? never : {
    kpis: typeof KPIS; altas: typeof SIGNUPS_BY_MONTH; hoy: typeof TODAY_LESSONS
    flota: typeof FLEET_USAGE; alertas: typeof ADMIN_ALERTS
  }>('/admin/dashboard')
}

/** GET /api/admin/agenda?semana=  */
export async function weekAgenda(): Promise<typeof WEEK_AGENDA> {
  if (USE_MOCK) return mock(WEEK_AGENDA)
  return request('/admin/agenda')
}

/** GET /api/admin/integraciones → estado de conectores (ping periódico en
 *  servidor: healthcheck a SAP, SMTP… cada X min y guarda último resultado). */
export async function listIntegrations(): Promise<Integration[]> {
  if (USE_MOCK) return mock(INTEGRATIONS)
  return request<Integration[]>('/admin/integraciones')
}
