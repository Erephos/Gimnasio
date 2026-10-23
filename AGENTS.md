# AGENTS.md

Vite + React 19 SPA in plain JavaScript/JSX (no TypeScript), styled with Tailwind CSS v4. Frontend-only: there is no backend, API, database, or real auth service in this repo, despite the project-level mention of Spring Boot/PostgreSQL/NeonDB.

`README.md` is the untouched Vite template, not project documentation. Treat this file and the code as the source of truth.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the built `dist/`
- `npm run lint` — ESLint over the repo

There is no test runner, typecheck script, CI, formatter, or codegen. Do not invent `npm test`; verify changes with `npm run lint` and `npm run build`.

## Architecture

- Entry chain: `index.html` → `src/main.jsx` → `src/App.jsx`.
- Hash routing in `App.jsx` is minimal: `#/memberships` renders `src/page/memberships.jsx`; anything else (default `#/login`) renders `src/page/login.jsx`.
- `#/memberships` is role-guarded: it renders only when `canListMembers(getCurrentSession())` is true (admin/receptionist). Otherwise `Login` is rendered even if the hash says `#/memberships`.
- `src/page/login.jsx` is not just a login form: it also contains registration and the post-login workspace (member directory and payments for admin/receptionist, own profile for socios). Put those features there, not in a new page.
- Business rules live in `src/lib/`: `accounts.js` (registration, auth, roles, session, member search/pagination/profile, membership state), `memberships.js` (plans, date math, legacy demo members), `payments.js` (payment registration, history, daily/monthly income), and `email.js` (email validation). Keep rules there instead of duplicating them in page components.
- There are two unrelated demo datasets: `accounts.js` (`createSeedAccounts`, includes DNI, phone, membership history) and `memberships.js` (`createInitialMembers`). The login workspace reads `accounts.js`; `memberships.jsx` keeps its own React state. Do not assume they share data.

## Mock data and sessions

- `accounts.js` persists accounts and the current session in `localStorage` (`ximedgar.gym.accounts`, `ximedgar.gym.session`), so registrations and profile edits survive reloads. `memberships.jsx` still keeps its own in-memory React state. There is no backend.
- Profile updates are centralized in `updateMemberAccount`: email/phone/address/emergency contact are editable, the ID is immutable, and only an admin may correct the DNI. Email and DNI duplicates return `409`.
- Account removal is a soft delete via `deactivateMemberAccount`: only admins can deactivate, status becomes `inactivo`, history is preserved, and inactive accounts cannot authenticate or restore a session.
- `payments.js` persists payments in `localStorage` (`ximedgar.gym.payments`). Only admin/receptionist can register or summarize payments. Payments are immutable (no delete API), must reference an existing socio and one of their memberships, and validate amount > 0, a non-future ISO date, and method `efectivo`/`transferencia`/`tarjeta`.
- Demo logins from `accounts.js`:
  - Admin: `admin@ximedgar.com` / `AdminGym2026!`
  - Receptionist: `recepcion@ximedgar.com` / `Recepcion2026!`
  - Socio: `socio@ximedgar.com` / `Gimnasio2026!`
- Passwords are stored in plain text and auth is mocked (`authenticateAccount`, `startSession`). Replace with the real API instead of extending this pattern.

## Tailwind v4

- Tailwind is wired through the `@tailwindcss/vite` plugin in `vite.config.js`; there is no `tailwind.config.js` and no PostCSS config.
- Global CSS is only `src/index.css` (`@import "tailwindcss";`). Add theme customizations there via `@theme`, not in a JS config.
- `src/App.css` is unused; do not import it.

## Conventions

- Match the existing style: no semicolons, single quotes, 2-space indentation.
- ESLint uses flat config (`eslint.config.js`) and lints only `**/*.{js,jsx}`, ignoring `dist/`. `eslint-plugin-react-refresh` is enabled, so component files should only export React components (`App.jsx` has a single default export; helper components in `login.jsx` are not exported).
- `dist/` and `node_modules/` are generated and gitignored; never edit them by hand.

## Bitácora y Registro de Cambios

- **Actualización de estado:** Cada vez que se complete una tarea, refactorización o adición de código, el agente debe proporcionar un resumen claro de los archivos modificados.
- **Memoria de decisiones:** Si se toma una decisión de diseño importante o se implementa una solución alternativa, debe documentarse brevemente en la respuesta para mantener el contexto en las siguientes iteraciones.
