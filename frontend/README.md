# ximEdgar Gym — Frontend

React 19 + Vite + Tailwind 4. Conectado a la API real en `../backend-node`. Listo para **Vercel**.

## Local

```bash
npm install
cp .env.example .env   # ajusta VITE_API_URL si el backend no corre en localhost:8080
npm run dev
```

Necesita `backend-node` corriendo (`npm run dev` ahí, puerto 8080 por defecto).

## Deploy Vercel

1. Sube el repo (carpeta `frontend` como root del proyecto en Vercel, o monorepo con Root Directory = `frontend`).
2. Framework: Vite
3. Build: `npm run build` · Output: `dist`
4. Variable de entorno `VITE_API_URL` apuntando al backend desplegado.
5. Ya incluye `vercel.json` para SPA.

## Funcionalidades

- Login / registro de socio / recuperación de contraseña por correo
- Roles y menú por rol (Administrador, Recepcionista, Entrenador, Socio)
- Socios: alta, edición, baja, búsqueda, asignación de plan/membresía
- Planes: alta, edición, activar/desactivar
- Caja: registrar cobros contra una membresía vigente
- Asistencia por DNI
- Clases y entrenadores
- Alertas de vencimiento
- Reportes y auditoría
- Admin: usuarios, roles

Sesión: `ximedgar.gym.session` (localStorage, solo el token JWT y datos del usuario logueado — los datos del gimnasio viven en la base real).
