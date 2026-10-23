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

The app uses minimal hash routing in `App.jsx`: `#/login` (default) renders `src/page/login.jsx`, and `#/memberships` renders `src/page/memberships.jsx`. There is no backend.

- Login authentication is mocked in `login.jsx` (`verifyCredentials`); replace it with the real API when one exists.
- Memberships are demo data held in React state (`createInitialMembers`), so changes reset on reload.
- Shared email validation lives in `src/lib/email.js`; plans, date math, membership status, and assignment rules live in `src/lib/memberships.js`. Keep business rules there rather than duplicating them in pages.

## Bitácora y Registro de Cambios
- **Actualización de estado:** Cada vez que se complete una tarea, refactorización o adición de código, el agente debe proporcionar un resumen claro de los archivos modificados.
- **Memoria de decisiones:** Si se toma una decisión de diseño importante o se implementa una solución alternativa, debe documentarse brevemente en la respuesta para mantener el contexto en las siguientes iteraciones.