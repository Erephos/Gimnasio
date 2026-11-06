# Frontend — ximEdgar Gym

React 19 + Vite + Tailwind 4 + react-router (HashRouter).

## Ejecutar en local (sin backend)

Requisito: Node.js 20 o superior.

```bash
npm install
npm run dev      # abre http://localhost:5173
```

Funciona completo con datos de demostración guardados en el navegador
(`VITE_USE_MOCK=true` en `.env`). Para reiniciar los datos, borra
`gimnasio.mock.v1` desde DevTools → Application → Local Storage.

## Usuarios de demostración

| Rol            | Correo                    | Contraseña        | Pantalla de inicio |
|----------------|---------------------------|-------------------|--------------------|
| Administrador  | admin@ximedgar.com        | AdminGym2026!     | /socios            |
| Recepcionista  | recepcion@ximedgar.com    | Recepcion2026!    | /socios            |
| Entrenador     | entrenador@ximedgar.com   | Entrenador2026!   | /horarios          |
| Socio          | socio@ximedgar.com        | Gimnasio2026!     | /mi-cuenta         |

## Páginas por rol

- Recepción y Administración: Socios, Planes y membresías, Pagos, Ingresos, Horarios y clases, Reportes, Mi cuenta.
- Solo Administración: Administración (usuarios y auditoría).
- Entrenador: Horarios y clases, Mi cuenta.
- Socio: Mi cuenta (perfil, membresía, reservas, cambio de contraseña).

## Usar el backend real

1. Levanta el backend en `http://localhost:8080`.
2. En `.env` cambia `VITE_USE_MOCK=false`.
3. Reinicia `npm run dev` (Vite redirige `/api` al backend; otro destino con `DEV_API_TARGET`).

## Scripts

```bash
npm run lint     # revisión de código
npm run build    # compilación de producción en dist/
npm run preview  # previsualizar la compilación
```

## Estructura

```
src/
  app/          App y rutas
  components/   layout/ (menú, rutas protegidas), ui/ (componentes), shared/
  config/       roles y constantes
  features/     una carpeta por página: socios, membresias, pagos, ingresos,
                clases, reportes, administracion, mi-cuenta, auth
  hooks/  mock/  services/  utils/
```
