/* ============================================================================
 * data.ts — CONTRATO DE DATOS + DEMO
 * ----------------------------------------------------------------------------
 * Los TIPOS de este archivo definen exactamente la forma (schema) de las
 * respuestas JSON que tu backend debe devolver. Los ARRAYS son datos de
 * demostración: cuando conectes tu API (VITE_USE_MOCK=false) NO hace falta
 * borrar este archivo, simplemente dejará de usarse.
 *
 * Convenciones de API que asume el frontend:
 *  · IDs como strings opacos (uuid o correlativo: "st-001", "FAC-2026-0119").
 *  · Fechas en ISO-8601 ("2026-02-12T17:30:00+01:00") y DINERO EN CÉNTIMOS
 *    (35000 = 350,00 €) para evitar errores de redondeo con floats.
 *  · Estados como enums cerrados (ver literales de cada tipo).
 * ==========================================================================*/

/* ---------------------------------- ALUMNOS ------------------------------- */
export type Permiso = 'B' | 'B Intensivo' | 'A2' | 'AM' | 'C'
export type EstadoAlumno = 'activo' | 'pendiente-docs' | 'pendiente-pago' | 'examen' | 'inactivo'

export interface Student {
  id: string
  sapId: string            // código de cliente en SAP Business One (OCRD.CardCode)
  nombre: string
  email: string
  telefono: string
  permiso: Permiso
  estado: EstadoAlumno
  progresoTeoria: number   // 0–100 (%)
  horasPracticas: number
  horasObjetivo: number
  saldo: number            // céntimos; lo que debe (positivo) — en SAP: saldo vencido
  alta: string             // ISO date
  tono: string             // color del avatar (solo UI; no hace falta persistirlo)
}

export const STUDENTS: Student[] = [
  { id: 'st-001', sapId: 'C-100234', nombre: 'Lucía Mendoza Ríos',  email: 'lucia.mendoza@gmail.com',  telefono: '+34 612 44 09 18', permiso: 'B',           estado: 'activo',          progresoTeoria: 82,  horasPracticas: 14, horasObjetivo: 20, saldo: 0,     alta: '2026-01-08', tono: '#C8F542' },
  { id: 'st-002', sapId: 'C-100241', nombre: 'Marco Aguilar Sanz',  email: 'm.aguilar.sanz@outlook.es', telefono: '+34 655 21 77 40', permiso: 'A2',          estado: 'activo',          progresoTeoria: 45,  horasPracticas: 6,  horasObjetivo: 16, saldo: 12000, alta: '2026-01-15', tono: '#7DD3FC' },
  { id: 'st-003', sapId: 'C-100256', nombre: 'Sofía Cabrera León',  email: 'sofiacabrera@hotmail.com', telefono: '+34 600 98 12 55', permiso: 'B',           estado: 'pendiente-docs',  progresoTeoria: 10,  horasPracticas: 0,  horasObjetivo: 20, saldo: 59000, alta: '2026-02-02', tono: '#F0ABFC' },
  { id: 'st-004', sapId: 'C-100233', nombre: 'Iker Villaverde Paz', email: 'ikervpaz@gmail.com',       telefono: '+34 678 33 90 02', permiso: 'B',           estado: 'activo',          progresoTeoria: 97,  horasPracticas: 19, horasObjetivo: 20, saldo: 0,     alta: '2025-12-19', tono: '#FDBA74' },
  { id: 'st-005', sapId: 'C-100198', nombre: 'Nadia Romero Gil',    email: 'nadia.romero@icloud.com',  telefono: '+34 622 70 41 83', permiso: 'AM',          estado: 'inactivo',        progresoTeoria: 30,  horasPracticas: 2,  horasObjetivo: 8,  saldo: 18000, alta: '2025-11-04', tono: '#A5B4FC' },
  { id: 'st-006', sapId: 'C-100229', nombre: 'Hugo Ferrán Tuset',   email: 'hugoftuset@gmail.com',     telefono: '+34 690 15 62 37', permiso: 'B Intensivo', estado: 'examen',          progresoTeoria: 100, horasPracticas: 20, horasObjetivo: 20, saldo: 0,     alta: '2026-01-05', tono: '#6EE7B7' },
  { id: 'st-007', sapId: 'C-100210', nombre: 'Paula Ibáñez Serra',  email: 'paula.ibanez@gmail.com',   telefono: '+34 633 88 04 29', permiso: 'C',           estado: 'activo',          progresoTeoria: 60,  horasPracticas: 9,  horasObjetivo: 24, saldo: 34000, alta: '2025-11-27', tono: '#FDA4AF' },
  { id: 'st-008', sapId: 'C-100262', nombre: 'Adrián Soler Mir',    email: 'adrisoler@proton.me',      telefono: '+34 611 29 56 74', permiso: 'A2',          estado: 'pendiente-pago',  progresoTeoria: 12,  horasPracticas: 1,  horasObjetivo: 16, saldo: 29500, alta: '2026-02-04', tono: '#FDE047' },
]

/* --------------------------------- MATERIAL ------------------------------- */
export type TipoMaterial = 'pdf' | 'video' | 'test'
export type EstadoMaterial = 'completado' | 'disponible' | 'bloqueado'

export interface MaterialItem {
  id: string
  categoria: 'Teoría' | 'Maniobras' | 'Mecánica' | 'Test'
  titulo: string
  tipo: TipoMaterial
  meta: string             // "48 páginas" · "18:24 min" · "40 preguntas"
  estado: EstadoMaterial
  progreso: number         // 0–100 (útil para reanudar vídeo/test)
}

/** Material del campus de Lucía (alumna demo). En producción:
 *  GET /api/me/materiales — el servidor filtra por matrícula activa y
 *  desbloquea en cadena según el progreso (regla de negocio en backend). */
export const MATERIALS: MaterialItem[] = [
  { id: 'm-01', categoria: 'Teoría',    titulo: 'Señales y normas de circulación',   tipo: 'pdf',   meta: '48 páginas',    estado: 'completado', progreso: 100 },
  { id: 'm-02', categoria: 'Teoría',    titulo: 'Prioridad, cruces y adelantamientos', tipo: 'pdf', meta: '32 páginas',    estado: 'completado', progreso: 100 },
  { id: 'm-03', categoria: 'Test',      titulo: 'Test oficial DGT · Tema 3',         tipo: 'test',  meta: '40 preguntas',  estado: 'disponible', progreso: 0 },
  { id: 'm-04', categoria: 'Maniobras', titulo: 'Maniobras en ciudad: aparcamiento', tipo: 'video', meta: '18:24 min',     estado: 'disponible', progreso: 35 },
  { id: 'm-05', categoria: 'Mecánica',  titulo: 'Mecánica básica y mantenimiento',   tipo: 'pdf',   meta: '26 páginas',    estado: 'disponible', progreso: 0 },
  { id: 'm-06', categoria: 'Teoría',    titulo: 'Conducción eficiente y sostenible', tipo: 'video', meta: '12:10 min',     estado: 'disponible', progreso: 0 },
  { id: 'm-07', categoria: 'Test',      titulo: 'Test psicotécnico exprés',          tipo: 'test',  meta: '30 preguntas',  estado: 'disponible', progreso: 0 },
  { id: 'm-08', categoria: 'Teoría',    titulo: 'Conducción nocturna y adversa',     tipo: 'video', meta: '09:48 min',     estado: 'bloqueado',  progreso: 0 },
  { id: 'm-09', categoria: 'Test',      titulo: 'Simulacro de examen final',         tipo: 'test',  meta: '50 preguntas',  estado: 'bloqueado',  progreso: 0 },
]

/* ---------------------------------- CLASES -------------------------------- */
export interface Lesson {
  id: string
  fecha: string        // ISO date
  hora: string
  tipo: 'Práctica' | 'Teórica'
  instructor: string
  recurso: string      // vehículo o aula
  lugar: string
  estado: 'confirmada' | 'pendiente' | 'reservable'
}

export const MY_LESSONS: Lesson[] = [
  { id: 'l-01', fecha: '2026-02-12', hora: '17:30', tipo: 'Práctica', instructor: 'Elena Ruiz',  recurso: 'VW Golf · 2143 KLM',   lugar: 'Punto KM 12 — P.º de la Castellana', estado: 'confirmada' },
  { id: 'l-02', fecha: '2026-02-14', hora: '10:00', tipo: 'Teórica',  instructor: 'Marc Vidal',  recurso: 'Aula 2',               lugar: 'Sede Centro — C/ Gran Vía 44',      estado: 'confirmada' },
  { id: 'l-03', fecha: '2026-02-17', hora: '18:15', tipo: 'Práctica', instructor: 'Elena Ruiz',  recurso: 'SEAT León · 8801 GTR', lugar: 'Punto KM 4 — Av. de América',       estado: 'pendiente' },
  { id: 'l-04', fecha: '2026-02-19', hora: '09:30', tipo: 'Práctica', instructor: 'Ruth Serrat', recurso: 'Toyota Yaris · 5520 HVC', lugar: 'Punto KM 12 — P.º de la Castellana', estado: 'pendiente' },
  { id: 'l-05', fecha: '2026-02-21', hora: '11:00', tipo: 'Teórica',  instructor: 'Marc Vidal',  recurso: 'Aula 1',               lugar: 'Sede Centro — C/ Gran Vía 44',      estado: 'reservable' },
]

export const INSTRUCTORS = ['Elena Ruiz', 'Ruth Serrat', 'Jordi Pons', 'Marc Vidal']

/** Lecciones del "hoy" para el panel del empleado */
export const TODAY_LESSONS = [
  { hora: '09:00', alumno: 'Iker Villaverde',   tipo: 'Práctica', instructor: 'Ruth Serrat' },
  { hora: '10:30', alumno: 'Hugo Ferrán',       tipo: 'Teórica',  instructor: 'Marc Vidal' },
  { hora: '12:00', alumno: 'Paula Ibáñez',      tipo: 'Práctica', instructor: 'Jordi Pons' },
  { hora: '17:30', alumno: 'Lucía Mendoza',     tipo: 'Práctica', instructor: 'Elena Ruiz' },
  { hora: '19:00', alumno: 'Marco Aguilar',     tipo: 'Práctica', instructor: 'Ruth Serrat' },
]

/** Agenda semanal del empleado (estructura plana: el backend devolvería
 *  GET /api/lessons?from=…&to=… y el front agrupa por día). */
export const WEEK_AGENDA: Record<string, { hora: string; alumno: string; tipo: 'Práctica' | 'Teórica'; instructor: string }[]> = {
  'LUN 09': [
    { hora: '09:00', alumno: 'Iker V.',   tipo: 'Práctica', instructor: 'Ruth Serrat' },
    { hora: '11:00', alumno: 'Sofía C.',  tipo: 'Teórica',  instructor: 'Marc Vidal' },
    { hora: '17:30', alumno: 'Marco A.',  tipo: 'Práctica', instructor: 'Elena Ruiz' },
  ],
  'MAR 10': [
    { hora: '10:00', alumno: 'Paula I.',  tipo: 'Práctica', instructor: 'Jordi Pons' },
    { hora: '12:30', alumno: 'Nadia R.',  tipo: 'Teórica',  instructor: 'Marc Vidal' },
    { hora: '18:00', alumno: 'Lucía M.',  tipo: 'Práctica', instructor: 'Elena Ruiz' },
  ],
  'MIÉ 11': [
    { hora: '09:30', alumno: 'Hugo F.',   tipo: 'Práctica', instructor: 'Ruth Serrat' },
    { hora: '13:00', alumno: 'Adrián S.', tipo: 'Teórica',  instructor: 'Marc Vidal' },
  ],
  'JUE 12': [
    { hora: '10:15', alumno: 'Marco A.',  tipo: 'Práctica', instructor: 'Jordi Pons' },
    { hora: '17:30', alumno: 'Lucía M.',  tipo: 'Práctica', instructor: 'Elena Ruiz' },
    { hora: '19:00', alumno: 'Sofía C.',  tipo: 'Teórica',  instructor: 'Marc Vidal' },
  ],
  'VIE 13': [
    { hora: '09:00', alumno: 'Paula I.',  tipo: 'Práctica', instructor: 'Jordi Pons' },
    { hora: '11:30', alumno: 'Iker V.',   tipo: 'Práctica', instructor: 'Ruth Serrat' },
    { hora: '17:00', alumno: 'Adrián S.', tipo: 'Práctica', instructor: 'Elena Ruiz' },
    { hora: '19:30', alumno: 'Hugo F.',   tipo: 'Teórica',  instructor: 'Marc Vidal' },
  ],
}

/* -------------------------------- DOCUMENTOS ------------------------------ */
export interface DocFile {
  id: string
  nombre: string
  etiqueta: string     // Contrato · Material · Factura · Trámite DGT…
  fecha: string
  size: string
  origen: 'escuela' | 'alumno'
}

export const MY_DOCS: DocFile[] = [
  { id: 'd-01', nombre: 'Contrato de matrícula.pdf',      etiqueta: 'Contrato',      fecha: '08/01/2026', size: '214 KB', origen: 'escuela' },
  { id: 'd-02', nombre: 'Ficha médica + DNI (escaneado).pdf', etiqueta: 'Entregado por ti', fecha: '10/01/2026', size: '1,2 MB', origen: 'alumno' },
  { id: 'd-03', nombre: 'Manual oficial Permiso B.pdf',   etiqueta: 'Material',      fecha: '08/01/2026', size: '8,4 MB', origen: 'escuela' },
  { id: 'd-04', nombre: 'Justificante de pago #P-1022.pdf', etiqueta: 'Facturas',    fecha: '01/02/2026', size: '96 KB',  origen: 'escuela' },
  { id: 'd-05', nombre: 'Permiso provisional DGT.pdf',    etiqueta: 'Trámite DGT',   fecha: '—',          size: '142 KB', origen: 'escuela' },
]

/* ---------------------------------- PAGOS --------------------------------- */
export interface Payment {
  id: string
  concepto: string
  fecha: string
  metodo: 'Tarjeta' | 'Domiciliación' | 'Transferencia'
  importe: number           // céntimos
  estado: 'pagado' | 'pendiente' | 'vencido'
}

export const MY_PAYMENTS: Payment[] = [
  { id: 'p-01', concepto: 'Matrícula — Permiso B',  fecha: '08/01/2026', metodo: 'Tarjeta',       importe: 35000, estado: 'pagado' },
  { id: 'p-02', concepto: 'Cuota febrero',          fecha: '01/02/2026', metodo: 'Domiciliación', importe: 18500, estado: 'pagado' },
  { id: 'p-03', concepto: 'Pack 10 prácticas',      fecha: '10/02/2026', metodo: 'Transferencia', importe: 18500, estado: 'pendiente' },
]

/* -------------------------------- FACTURACIÓN ----------------------------- */
export interface Invoice {
  id: string
  numero: string                 // FAC-2026-0119 (serie legal por año)
  alumno: string
  fecha: string
  importe: number                // céntimos
  estado: 'cobrada' | 'pendiente' | 'vencida'
  sap: 'sincronizado' | 'pendiente' | 'error'   // estado en SAP Invoices
}

export const INVOICES: Invoice[] = [
  { id: 'f-01', numero: 'FAC-2026-0119', alumno: 'Hugo Ferrán Tuset',   fecha: '02/02/2026', importe: 53500, estado: 'cobrada',   sap: 'sincronizado' },
  { id: 'f-02', numero: 'FAC-2026-0124', alumno: 'Lucía Mendoza Ríos',  fecha: '01/02/2026', importe: 18500, estado: 'cobrada',   sap: 'sincronizado' },
  { id: 'f-03', numero: 'FAC-2026-0127', alumno: 'Paula Ibáñez Serra',  fecha: '03/02/2026', importe: 34000, estado: 'pendiente', sap: 'pendiente' },
  { id: 'f-04', numero: 'FAC-2026-0131', alumno: 'Sofía Cabrera León',  fecha: '04/02/2026', importe: 59000, estado: 'pendiente', sap: 'pendiente' },
  { id: 'f-05', numero: 'FAC-2026-0133', alumno: 'Adrián Soler Mir',    fecha: '05/02/2026', importe: 29500, estado: 'vencida',   sap: 'error' },
  { id: 'f-06', numero: 'FAC-2026-0135', alumno: 'Marco Aguilar Sanz',  fecha: '06/02/2026', importe: 12000, estado: 'pendiente', sap: 'error' },
  { id: 'f-07', numero: 'FAC-2026-0138', alumno: 'Iker Villaverde Paz', fecha: '08/02/2026', importe: 15000, estado: 'cobrada',   sap: 'sincronizado' },
]

/* --------------------------- DOCUMENTOS (EMPLEADO) ------------------------ */
export interface DocTemplate { id: string; nombre: string; detalle: string }

export const DOC_TEMPLATES: DocTemplate[] = [
  { id: 'tpl-01', nombre: 'Contrato de matrícula',               detalle: 'PDF generado con datos del expediente' },
  { id: 'tpl-02', nombre: 'Carta de bienvenida + acceso campus', detalle: 'Email HTML con credenciales del portal' },
  { id: 'tpl-03', nombre: 'Recordatorio de pago',                detalle: 'Plantilla con importe y fecha límite' },
  { id: 'tpl-04', nombre: 'Citación a examen teórico',           detalle: 'Fecha, sede DGT y consejos' },
  { id: 'tpl-05', nombre: 'Ficha médica — instrucciones',        detalle: 'Centros concertados y documentación' },
  { id: 'tpl-06', nombre: 'Certificado de prácticas',            detalle: 'Anexo oficial con horas realizadas' },
]

export interface SendLog {
  id: string
  plantilla: string
  alumno: string
  canales: ('email' | 'whatsapp')[]
  fecha: string
  estado: 'entregado' | 'leido' | 'error'
}

export const SEND_LOG: SendLog[] = [
  { id: 's-01', plantilla: 'Contrato de matrícula',         alumno: 'Nadia Romero Gil',   canales: ['email'],            fecha: 'Hoy · 09:12',   estado: 'entregado' },
  { id: 's-02', plantilla: 'Recordatorio de pago',          alumno: 'Adrián Soler Mir',   canales: ['email', 'whatsapp'], fecha: 'Ayer · 18:40', estado: 'leido' },
  { id: 's-03', plantilla: 'Citación a examen teórico',     alumno: 'Hugo Ferrán Tuset',  canales: ['email'],            fecha: 'Ayer · 16:05', estado: 'error' },
]

/* ------------------------------ INTEGRACIONES ----------------------------- */
export interface Integration {
  id: string
  nombre: string
  detalle: string
  estado: 'conectado' | 'activo' | 'pendiente'
  envHint: string        // variable de entorno del SERVIDOR (nunca en el frontend)
}

export const INTEGRATIONS: Integration[] = [
  { id: 'int-sap',  nombre: 'SAP Business One',   detalle: 'ERP financiero · clientes, facturas y asientos', estado: 'conectado', envHint: 'SAP_SERVICE_LAYER_URL' },
  { id: 'int-crm',  nombre: 'HubSpot CRM',        detalle: 'Pipeline comercial · leads y seguimiento',       estado: 'pendiente', envHint: 'HUBSPOT_API_KEY' },
  { id: 'int-xls',  nombre: 'Exportación Excel / CSV', detalle: 'Informes de alumnos, agenda y caja',        estado: 'activo',    envHint: '— (se genera en servidor)' },
  { id: 'int-wa',   nombre: 'WhatsApp Cloud API', detalle: 'Avisos automáticos de clases y pagos',           estado: 'pendiente', envHint: 'WHATSAPP_TOKEN' },
  { id: 'int-smtp', nombre: 'Email transaccional', detalle: 'SMTP / Mailgun · contratos y notificaciones',   estado: 'conectado', envHint: 'SMTP_HOST · SMTP_PASS' },
  { id: 'int-pay',  nombre: 'Pasarela de pago',   detalle: 'Redsys o Stripe · cobros online y recibos',      estado: 'pendiente', envHint: 'STRIPE_SECRET_KEY' },
]

/* ------------------------------- KPIs PANEL ------------------------------- */
export const KPIS = {
  alumnosActivos: { valor: 128,   delta: '+12 este mes',  spark: [40, 55, 48, 62, 74, 80, 92] },
  ingresosMes:    { valor: 24680, delta: '+8,4 % vs enero', spark: [50, 42, 60, 55, 70, 66, 84] },
  clasesHoy:      { valor: 17,    delta: '5 prácticas pendientes', spark: [30, 45, 35, 60, 52, 48, 65] },
  tasaApto:       { valor: 91,    delta: 'teórico · últimos 30 días', spark: [70, 72, 68, 80, 76, 85, 91] },
}

export const SIGNUPS_BY_MONTH = [
  { m: 'M', v: 9 }, { m: 'A', v: 14 }, { m: 'M', v: 11 }, { m: 'J', v: 18 },
  { m: 'J', v: 22 }, { m: 'A', v: 17 }, { m: 'S', v: 26 }, { m: 'O', v: 24 },
  { m: 'N', v: 29 }, { m: 'D', v: 21 }, { m: 'E', v: 27 }, { m: 'F', v: 19 },
]

export const FLEET_USAGE = [
  { vehiculo: 'VW Golf · 2143 KLM',    pct: 86 },
  { vehiculo: 'SEAT León · 8801 GTR',  pct: 72 },
  { vehiculo: 'Toyota Yaris · 5520 HVC', pct: 64 },
]

export const ADMIN_ALERTS = [
  { id: 'a-1', nivel: 'error' as const, texto: '2 facturas con error de sincronización en SAP' },
  { id: 'a-2', nivel: 'warn'  as const, texto: '3 alumnos con pago vencido — enviar recordatorio' },
  { id: 'a-3', nivel: 'warn'  as const, texto: 'DNI de Marco Aguilar pendiente de validar' },
]

/* --------------------------------- LANDING -------------------------------- */
export const COURSES = [
  { num: '01', nombre: 'Permiso B',          detalle: 'Turismo · el clásico para conducir coche', precio: 'Desde 590 €', feats: ['Teoría online + aula', 'App de tests DGT', '20 h prácticas incluidas'] },
  { num: '02', nombre: 'Permiso B Intensivo', detalle: 'Todo en 3 semanas, a tu ritmo',          precio: 'Desde 790 €', feats: ['Teoría intensiva', 'Prácticas diarias', 'Examen prioritario'] },
  { num: '03', nombre: 'Permiso A2',         detalle: 'Motos hasta 35 kW',                        precio: 'Desde 520 €', feats: ['Circuito cerrado', 'Vía abierta con instructor', 'Equipo incluido'] },
  { num: '04', nombre: 'Permiso AM',         detalle: 'Ciclomotor desde los 15',                  precio: 'Desde 240 €', feats: ['Teoría exprés', 'Prácticas en pista', 'Tasa DGT gestionada'] },
  { num: '05', nombre: 'Permiso C',          detalle: 'Camión · conducción profesional',          precio: 'Desde 1.150 €', feats: ['Flota propia', 'CAP inicial opcional', 'Bolsa de empleo'] },
  { num: '06', nombre: 'Recuperación de puntos', detalle: 'Cursos certificados DGT',              precio: 'Desde 210 €', feats: ['24 h lectivas', 'Certificado inmediato', 'Grupos reducidos'] },
]

export const ANNOUNCEMENTS = [
  { id: 'n-1', titulo: 'Convocatoria extraordinaria de examen teórico', detalle: '28 de febrero · Sede DGT Móstoles. Apúntate antes del día 20 en secretaría.' },
  { id: 'n-2', titulo: 'Nuevo módulo: conducción nocturna', detalle: 'Ya disponible el test avanzado de visibilidad y conducción adversa en tu campus.' },
]

/* ------------------------------ UTILIDADES UI ----------------------------- */
/** Formatea céntimos a moneda ES. Coincide con cómo debe serializar el backend. */
export const eur = (centimos: number) =>
  (centimos / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

/** "2026-02-12" → { dia: '12', mes: 'FEB' } para bloques de fecha. */
export const splitFecha = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const mes = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][(m ?? 1) - 1]
  return { dia: String(d ?? '').padStart(2, '0'), mes, anio: y }
}
