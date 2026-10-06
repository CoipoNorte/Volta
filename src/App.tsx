/* ============================================================================
 * App.tsx — ORQUESTADOR DE VISTAS
 * ----------------------------------------------------------------------------
 * NOTA DE ARQUITECTURA (routing):
 * Este esquema usa un estado local para alternar vistas y mantener cero
 * dependencias. En producción instala react-router-dom y protege las rutas:
 *
 *   <Route path="/" element={<Landing/>} />
 *   <Route path="/portal" element={<RequireAuth rol="alumno"><Portal/></RequireAuth>} />
 *   <Route path="/admin"  element={<RequireAuth rol="empleado"><Admin/></RequireAuth>} />
 *
 * RequireAuth lee el JWT (localStorage / cookie httpOnly), llama a
 * GET /api/me para validarlo y redirige a /login si falta o el rol no sirve.
 * LA SEGURIDAD REAL vive en el servidor: el front solo orienta la navegación.
 * ==========================================================================*/
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Landing from '@/views/Landing'
import Portal from '@/views/Portal'
import Admin from '@/views/Admin'

type Vista = 'landing' | 'portal' | 'admin'

const TITULOS: Record<Vista, string> = {
  landing: 'VOLTA · Autoescuela Digital',
  portal: 'VOLTA · Portal del alumno',
  admin: 'VOLTA · Backoffice de gestión',
}

export default function App() {
  const [vista, setVista] = useState<Vista>('landing')

  useEffect(() => {
    document.title = TITULOS[vista]
    window.scrollTo(0, 0)
  }, [vista])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vista}
        initial={{ opacity: 0, y: vista === 'landing' ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {vista === 'landing' && <Landing onEnter={setVista} />}
        {vista === 'portal' && <Portal onExit={() => setVista('landing')} />}
        {vista === 'admin' && <Admin onExit={() => setVista('landing')} />}
      </motion.div>
    </AnimatePresence>
  )
}
