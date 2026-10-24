# AGENTS.md

Vite + React 19 single-page app in plain JavaScript/JSX (no TypeScript), styled with Tailwind CSS v4.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the built `dist/`
- `npm run lint` — ESLint over the whole repo

There is no test runner, typecheck script, or CI configuration. Do not assume `npm test` exists or add type-aware linting without converting the codebase to TypeScript first.

## Tailwind v4 specifics

- Tailwind is wired through the `@tailwindcss/vite` plugin in `vite.config.js`; there is no `tailwind.config.js` and no PostCSS config.
- Global CSS lives in `src/index.css`, which only contains `@import "tailwindcss";`. Add theme customizations there via `@theme`, not by creating a JS config file.
- The starter `src/App.css` is no longer imported; page styling is done with Tailwind utility classes.

## Structure and conventions

- Entry chain: `index.html` → `src/main.jsx` → `src/App.jsx`.
- Assets: files imported from `src/assets/` are bundled by Vite; files in `public/` are served at the root and referenced by absolute paths (e.g. `/icons.svg#github-icon`).
- ESLint uses flat config (`eslint.config.js`) and lints only `**/*.{js,jsx}`, ignoring `dist/`. `eslint-plugin-react-refresh` is enabled, so component files should only export React components (that is why `App.jsx` has a single default export).
- Match the existing style: no semicolons, single quotes, 2-space indentation.
- `dist/` and `node_modules/` are generated and gitignored; never edit them by hand.

The app uses `react-router-dom` (v7) as its routing library. `HashRouter` is configured in `src/main.jsx`; routes and the shared header with navigation links live in `src/App.jsx`: `/login` (default), `/memberships`, `/ingresos`, and `/horarios`. `/` and any unknown path redirect to `/login` with `<Navigate>`. Hash routing keeps existing `#/...` links working and avoids server rewrites on static hosting. There is no backend.

- Use `<Link>`/`<NavLink>` for internal navigation and `<Navigate>` for redirects. Do not use `window.location` or raw `href="#/..."` anchors; add new screens as `<Route>` entries in `src/App.jsx`.
- Login authentication is mocked in `login.jsx` (`verifyCredentials`); it offers two demo roles: socio and recepción/administración. The staff role redirects to `/memberships` with `useNavigate`. Replace it with the real API when one exists.
- Memberships are demo data held in React state (`createInitialMembers`), so changes reset on reload.
- Check-ins are also in-memory (`createInitialCheckIns` in `src/lib/ingresos.js`). `registerCheckIn` validates DNI format, existence (404), inactive status, membership presence/expiry, and one entry per day; timestamps are computed in `America/Lima`.
- Trainers, group classes, enrollments, and attendance are in-memory too (`src/lib/horarios.js`). `registerTrainer`, `registerClass`, `enrollMember`, `cancelEnrollment`, and `markAttendance` enforce DNI/discipline/date/time/capacity validation, trainer status, room and trainer time conflicts, active memberships, capacity limits, duplicate enrollments, and single attendance marking.
- Shared email validation lives in `src/lib/email.js`; plans, date math, membership status, and assignment rules live in `src/lib/memberships.js`; DNI validation, Peru time, and check-in rules live in `src/lib/ingresos.js`; trainer, class, enrollment, and attendance rules live in `src/lib/horarios.js`. Keep business rules there rather than duplicating them in pages.

## Reglas del proyecto

- **Idioma:** responde siempre en español, incluidas las explicaciones, los resúmenes de cambios y los mensajes de la interfaz. Los nombres de archivos, funciones y APIs pueden mantenerse en inglés cuando sea la convención técnica.
- **Stack:** usa solo React y Tailwind CSS para construir la interfaz. No agregues librerías de componentes, CSS-in-JS, frameworks de estado ni otras dependencias de UI sin pedirlo antes.
- **Criterios de aceptación:** cada pantalla nueva o modificada debe cumplir todos los criterios de aceptación de su historia de usuario. Verifícalos explícitamente (lint, build y prueba funcional) antes de dar la tarea por terminada.
- **Resumen de cambios:** al finalizar, explica qué archivos cambiaste y por qué, uno por uno, indicando el impacto de cada cambio.
- **Datos de prueba:** usa siempre datos ficticios y de demostración (nombres, DNIs, correos y credenciales inventados). No uses datos reales de personas, credenciales de producción ni información sensible, ni siquiera en ejemplos o capturas.

## Bitácora y Registro de Cambios
- **Actualización de estado:** Cada vez que se complete una tarea, refactorización o adición de código, el agente debe proporcionar un resumen claro de los archivos modificados.
- **Memoria de decisiones:** Si se toma una decisión de diseño importante o se implementa una solución alternativa, debe documentarse brevemente en la respuesta para mantener el contexto en las siguientes iteraciones.