/// <reference types="vite/client" />

/**
 * Tipos de las variables de entorno del FRONTEND (prefijo VITE_).
 * Ojo: todo lo que empieza por VITE_ se compila dentro del bundle
 * y es visible para cualquiera. Las claves secretas (SAP, JWT,
 * pasarela de pago…) viven SOLO en el .env del servidor.
 */
interface ImportMetaEnv {
  /** URL base de tu API, p. ej. http://localhost:8000/api */
  readonly VITE_API_URL?: string
  /** "false" para usar la API real; cualquier otro valor = datos demo */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
