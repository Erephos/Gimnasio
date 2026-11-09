# ximEdgar Gym — Frontend (demo offline)

React 19 + Vite + Tailwind 4. Persistencia en **localStorage**. Listo para **Vercel**.

## Local

```bash
npm install
npm run dev
```

## Deploy Vercel

1. Sube el repo (carpeta `frontend` como root del proyecto en Vercel, o monorepo con Root Directory = `frontend`).
2. Framework: Vite
3. Build: `npm run build` · Output: `dist`
4. Ya incluye `vercel.json` para SPA.

## Cuentas demo

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@ximedgar.com | Admin2026! |
| Recepción | recepcion@ximedgar.com | Recepcion2026! |
| Entrenador | entrenador@ximedgar.com | Entrenador2026! |
| Socio | sofia@email.com | Socio2026! |

## Funcionalidades (sin backend)

- Login / registro socio / recuperar contraseña (simulado)
- Roles y menú por rol
- Socios: alta, edición, baja, búsqueda
- Planes: alta, edición, activar/desactivar
- Caja: registrar cobros (renueva membresía)
- Asistencia por DNI
- Clases y entrenadores
- Alertas de vencimiento
- Reportes básicos
- Admin: usuarios, roles, reset demo

Storage: `ximedgar.gym.v1` · sesión: `ximedgar.gym.session`
