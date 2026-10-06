# VOLTA · Autoescuela — Guía de implementación del backend

Este frontend es un **esquema funcional**: funciona 100 % con datos demo, pero
toda la UI ya habla con una capa de servicios (`src/lib/api.ts`) preparada para
tu API real. Esta guía te deja el camino listo para implementarla en
**PHP (Laravel)**, **Python (FastAPI)**, **Node (Express/Nest)** o **Java (Spring Boot)**.

---

## 1 · Arquitectura objetivo

```
┌──────────────────────┐        HTTPS / JSON          ┌──────────────────────┐
│  React + Vite (esto) │  ─────────────────────────▶  │  Tu API REST          │
│  src/lib/api.ts      │   Authorization: Bearer JWT  │  (Laravel/FastAPI/…)  │
└──────────────────────┘                              └─────────┬────────────┘
                                                                │
        ┌───────────────────┬───────────────────┬───────────────┼───────────────┐
        ▼                   ▼                   ▼               ▼               ▼
   PostgreSQL          Cola de trabajos     Almacenamiento   SAP B1         Servicios
   (datos)             (envíos, SAP)        S3 (documentos)  Service Layer  externos
                       Celery/BullMQ/Horizon                                 (SMTP/WhatsApp/Stripe)
```

**Decisiones clave (ya asumidas por el frontend):**

- **JWT con roles** (`alumno` / `empleado`). El portal del alumno usa rutas `/me/*`
  (el servidor deduce el usuario del token, nunca de un id del cliente).
- **Dinero en céntimos** enteros, **fechas ISO-8601**, ids opacos.
- **Nada pesado en caliente**: generar PDFs, sincronizar SAP, enviar WhatsApp…
  va a una **cola** y el endpoint responde `202 Accepted` al instante.
- **Documentos privados fuera del `public/`**: S3/disco protegido + URLs firmadas.

---

## 2 · Esquema de base de datos (PostgreSQL / MySQL)

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  telefono      TEXT,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('alumno','empleado')),  -- RBAC mínimo
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE students (                       -- ficha CRM del alumno
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),                        -- login del portal
  sap_card_code   TEXT UNIQUE,                -- OCRD.CardCode en SAP
  permiso         TEXT NOT NULL,              -- 'B','A2','AM','C','B Intensivo'
  estado          TEXT NOT NULL DEFAULT 'pendiente-docs'
                  CHECK (estado IN ('activo','pendiente-docs','pendiente-pago','examen','inactivo')),
  progreso_teoria INT NOT NULL DEFAULT 0,     -- 0..100 (lo recalcula un job)
  horas_practicas NUMERIC(4,1) NOT NULL DEFAULT 0,
  deleted_at      TIMESTAMPTZ                 -- BAJA LÓGICA, nunca DELETE físico
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL, titulo TEXT NOT NULL, tipo TEXT CHECK (tipo IN ('pdf','video','test')),
  meta TEXT, s3_key TEXT NOT NULL, orden INT NOT NULL  -- el desbloqueo va por orden
);

CREATE TABLE student_materials (              -- progreso por alumno
  student_id UUID REFERENCES students(id),
  material_id UUID REFERENCES materials(id),
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('completed','disponible','bloqueado')),
  progreso INT NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, material_id)
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  instructor_id UUID REFERENCES users(id),
  vehiculo TEXT, tipo TEXT CHECK (tipo IN ('Práctica','Teórica')),
  inicia_en TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('confirmada','pendiente','reservable','cancelada','completada')),
  -- Anti-solape a nivel DB (PostgreSQL):
  EXCLUDE USING gist (instructor_id WITH =, tstzrange(inicia_en, inicia_en + interval '45 minutes') WITH &&)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  nombre TEXT NOT NULL, etiqueta TEXT, s3_key TEXT NOT NULL,
  origen TEXT CHECK (origen IN ('escuela','alumno')),
  validado BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,                -- serie correlativa: FAC-2026-0142
  student_id UUID REFERENCES students(id),
  fecha DATE NOT NULL, importe_cent INT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('cobrada','pendiente','vencida')),
  sap_doc_entry INT, sap_estado TEXT NOT NULL DEFAULT 'pendiente'  -- sincronizado/pendiente/error
);

CREATE TABLE doc_sends (                      -- log del centro de envíos
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  template_id TEXT NOT NULL, canales TEXT[] NOT NULL,        -- {email,whatsapp}
  estado TEXT NOT NULL DEFAULT 'encolado',                   -- entregado/leido/error
  enviado_en TIMESTAMPTZ
);
```

---

## 3 · Endpoints que el frontend ya consume

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| POST | `/api/auth/login` | público | `{email,password}` → `{token,user}` (JWT + rol) |
| GET | `/api/me` | alumno | perfil + progreso (Student de `data.ts`) |
| GET | `/api/me/materiales` | alumno | solo si matrícula activa; desbloqueo por progreso |
| GET | `/api/me/clases` | alumno | próximas clases |
| POST | `/api/clases/reservar` | alumno | validación anti-solape en transacción |
| GET | `/api/me/documentos` | alumno | listado; binarios aparte (URL firmada) |
| POST | `/api/me/documentos` | alumno | multipart; antivirus + límite en servidor |
| GET | `/api/me/pagos` | alumno | historial de pagos/cuotas |
| GET | `/api/students` | empleado | `?search=&estado=&page=` |
| POST | `/api/students` | empleado | crea expediente + encola alta en SAP |
| PATCH | `/api/students/:id` | empleado | edición |
| DELETE | `/api/students/:id` | empleado | **baja lógica** (`deleted_at`) |
| GET | `/api/exports/students.xlsx` | empleado | Excel generado en servidor |
| GET | `/api/admin/dashboard` | empleado | KPIs agregados (GROUP BY, no tablas crudas) |
| GET | `/api/admin/agenda` | empleado | semana de clases |
| GET | `/api/documentos/plantillas` | empleado | plantillas del centro de envíos |
| GET | `/api/documentos/envios` | empleado | log de envíos |
| POST | `/api/documentos/enviar` | empleado | encola: PDF + S3 + SMTP/WhatsApp → `202` |
| GET | `/api/invoices` | empleado | facturación |
| POST | `/api/invoices/:id/sincronizar-sap` | empleado | alta en SAP (cola) |
| POST | `/api/invoices/sincronizar-sap` | empleado | lote completo |
| GET | `/api/admin/integraciones` | empleado | estado de conectores (healthcheck) |
| POST | `/api/pagos/checkout` | alumno | sesión Stripe / formulario Redsys |

**Errores normalizados:** `{ "message": "texto" }` + status correcto
(`401` sin token, `403` rol incorrecto, `409` solape de clase, `422` validación).

---

## 4 · Snippets mínimos por stack

### PHP — Laravel

```php
// routes/api.php
Route::post('/auth/login', [AuthController::class,'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',           fn (Request $r) => StudentResource::make($r->user()->student));
    Route::get('/me/materiales',[MaterialController::class,'mios']);
    Route::get('/students',     [StudentController::class,'index'])->middleware('role:empleado');
    Route::post('/documentos/enviar', [DocSendController::class,'store']);
    Route::get('/exports/students.xlsx', fn () => Excel::download(new StudentsExport, 'alumnos.xlsx'));
});
// AuthController@login — verifica con Hash::check() y emite token Sanctum.
// DocSendController@store — valida y hace:  SendDocumentJob::dispatch($data)->onQueue('docs');
// El Job genera el PDF (barryvdh/dompdf), lo sube a S3 (Storage::disk('s3')->temporaryUrl)
// y envía por Mail/WhatsApp. SAP: job aparte con la Service Layer (Guzzle).
```

### Python — FastAPI

```python
router = APIRouter(prefix="/api")

@router.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate(db, form.username, form.password)      # bcrypt (passlib)
    token = create_jwt(sub=str(user.id), rol=user.rol)         # PyJWT, exp 2 h
    return TokenResponse(token=token, user=UserOut.from_orm(user))

@router.get("/me/materiales", response_model=list[MaterialOut])
def mis_materiales(me: User = Depends(require_rol("alumno"))):
    return materiales_service.para_alumno(me.student_id)       # desbloqueo por orden

@router.post("/documentos/enviar", status_code=202)
def enviar(data: DocSendIn, bg: BackgroundTasks, _: User = Depends(require_rol("empleado"))):
    bg.add_task(worker_enviar_documento, data)                 # o Celery/RQ en serio
    return {"ok": True}
```

### Node — Express

```js
router.post('/auth/login', ctrl.login)                          // bcrypt + jsonwebtoken
router.use(authJwt)                                            // middleware: verifica Bearer
router.get('/me/materiales', requireRol('alumno'), ctrl.materiales)
router.post('/documentos/enviar', requireRol('empleado'), async (req, res, next) => {
  await queueDocs.add('enviar', req.body, { attempts: 3, backoff: 5000 })  // BullMQ + Redis
  res.status(202).json({ ok: true })
})
router.get('/exports/students.xlsx', requireRol('empleado'), async (req, res) => {
  const wb = new ExcelJS.Workbook(); /* …llenar… */
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  await wb.xlsx.write(res); res.end()
})
```

### Java — Spring Boot

```java
@PostMapping("/auth/login")                       // Spring Security + jjwt
public TokenRes login(@RequestBody @Valid LoginReq req) { return auth.login(req); }

@GetMapping("/me/materiales")
@PreAuthorize("hasRole('ALUMNO')")
public List<MaterialDto> misMateriales(Authentication a) {
    return materialService.paraAlumno(a.getName());
}
// SAP: RestTemplate/WebClient contra Service Layer con circuit breaker (Resilience4j)
// Envíos: @Async + cola (RabbitMQ) para no bloquear la request.
```

---

## 5 · Integraciones

### SAP Business One (Service Layer REST)
1. `POST {SAP}/b1s/v1/Login` → cookie de sesión (renovar a los ~30 min).
2. Al crear alumno: `POST /BusinessPartners` `{ CardCode, CardName, … }`.
3. Al facturar: `POST /Invoices` `{ CardCode, DocDate, Lines:[{ItemCode,Quantity,Price}] }`
   y guarda `DocEntry/DocNum` en tu tabla `invoices`.
4. **Todo dentro de jobs con reintentos y backoff**; si SAP cae, la factura sigue
   existiendo en tu DB y se reintenta (nunca bloquees al usuario por SAP).

### Excel
El esquema exporta CSV en el navegador; en producción genéralo en servidor
(Laravel-Excel / openpyxl / exceljs / Apache POI) y el front solo descarga el blob
(el código ya está listo en `api.exportStudentsExcel`).

### WhatsApp Cloud API (Meta)
- Necesitas app de Meta, número de empresa y **plantillas aprobadas** para mensajes
  iniciados por la escuela.
- `POST https://graph.facebook.com/v21.0/{PHONE_ID}/messages` con `template.name`.
- Webhooks entrantes actualizan `doc_sends.estado` (entregado → leído).

### Pasarela de pago
- **Stripe**: crea Checkout Session en servidor; el webhook `checkout.session.completed`
  marca el pago y emite factura.
- **Redsys** (ES): formulario redirigido + notificación POST con firma HMAC.

---

## 6 · Checklist de seguridad y buenas prácticas

- [ ] CORS restringido al dominio del front (nada de `*` con credenciales).
- [ ] Rate limiting en login y endpoints públicos (5 intentos/min).
- [ ] Passwords con bcrypt/argon2; JWT corto (2 h) + refresh token.
- [ ] Validación server-side en TODO (el front propone; el back dispone).
- [ ] Parametrizar SQL (Eloquent/SQLAlchemy/Prisma ya lo hacen).
- [ ] Documentos privados fuera de `public/`, con URLs firmadas temporales.
- [ ] Logs de auditoría: quién creó/editó/descargó qué y cuándo.
- [ ] `deleted_at` en alumnos y facturas: histórico contable intacto.
- [ ] Backups diarios de DB + S3 versionado.
- [ ] HTTPS siempre; secretos solo en el `.env` del servidor.
- [ ] RGPD: consentimiento en matrícula, derecho de supresión y retención mínima.

---

## 7 · Puesta en marcha con este frontend

```bash
# 1) Backend arriba en http://localhost:8000
# 2) Configura el front:
cp .env.example .env.local
#    VITE_API_URL=http://localhost:8000/api
#    VITE_USE_MOCK=false
# 3) Arranca:
npm install && npm run dev
```

Los tipos de cada respuesta están en `src/lib/data.ts` y los contratos comentados
endpoint a endpoint en `src/lib/api.ts`. Cambiar de stack no requiere tocar la UI.
