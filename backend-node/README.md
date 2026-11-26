# API del gimnasio (Node.js)

Backend REST activo con Node.js 22, Express, **Prisma** y PostgreSQL. Mantiene el contrato de la API previa para conservar la integración prevista con el frontend. El esquema `gimnasio` sigue siendo la fuente de verdad (ver `../SQL-Gimnasio.sql`); Prisma es la capa de acceso a datos, no quien decide la estructura de las tablas. `../backend/` contiene la implementación histórica en Spring Boot y ya no es el backend activo.

> **Antes migraba con `pg` (SQL crudo); ahora usa Prisma.** `../SQL-Gimnasio.sql` no estaba versionado en el repo — se reconstruyó leyendo cada consulta de `src/routes/*.js`. Si ya existe una base en Neon funcionando, corran `npx prisma db pull` contra ella para que `prisma/schema.prisma` se corrija solo con la estructura real antes de confiar en esta reconstrucción.

## Ejecutar localmente

1. Desde `backend-node/`, copia `.env.example` a `.env`. Mantén `.env` privado y fuera de Git. Configura `DATABASE_URL` con la URL PostgreSQL y `JWT_SECRET` aleatorio de al menos 32 caracteres. El esquema es `gimnasio`; configura `CORS_ORIGINS` con el origen del frontend.
2. Si la base todavía no existe, aplica `../SQL-Gimnasio.sql` una vez (crea el esquema, las tablas y los roles). Si ya existe, pasa al paso 3.
3. Instala dependencias, genera el cliente de Prisma e inicia:

```bash
npm install
npm run prisma:generate
npm run dev
```

4. Comprueba `GET http://localhost:8080/api/health`; debe responder `{"estado":"ok","baseDatos":"conectada"}`.

Comandos de Prisma disponibles: `npm run prisma:generate` (regenerar el cliente tras tocar el schema), `npm run prisma:migrate` (crear y aplicar una migración), `npm run prisma:studio` (UI para ver/editar datos).

Configura `APP_MAIL_ENABLED=true`, `APP_MAIL_FROM`, `APP_MAIL_RESET_URL`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME` y `MAIL_PASSWORD` para habilitar la recuperación por correo. Si se deja desactivada, la API responde de forma genérica y no revela si un correo existe.

## Rutas y permisos

`Público` significa que no requiere token. Las rutas protegidas reciben `Authorization: Bearer <token>`. Los roles disponibles son `ADMINISTRADOR`, `RECEPCIONISTA`, `ENTRENADOR` y `SOCIO`.

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| GET | `/api/health` | Público | Estado de API y conexión a PostgreSQL. |
| POST | `/api/auth/login` | Público | Login con `correo`, `password`; token JWT expira según `JWT_EXPIRES_IN` (30m por defecto). |
| POST | `/api/auth/recuperar` | Público | Solicita enlace temporal sin revelar si el correo está registrado. |
| POST | `/api/auth/restablecer` | Público | Usa `token` y `nuevaPassword`; token de un solo uso por 30 minutos. |
| POST | `/api/socios` | Público | Registro de socio. |
| POST | `/api/reto-sentadillas` | Público | Guarda el puntaje del reto de sentadillas (stand de feria): `nombre`, `repeticiones`, `duracionSegundos`. |
| GET | `/api/reto-sentadillas/top` | Público | Top puntajes del reto, `limit` opcional (máx. 50). |
| GET | `/api/socios` | Admin, recepción | Listado paginado; filtros `q`, `activo`, `page`, `size`. |
| GET | `/api/socios/mi-perfil` | Socio | Perfil asociado al token. |
| GET, PUT | `/api/socios/{id}` | Admin, recepción, socio | Consultar/actualizar; socio solo el propio, DNI editable solo por admin. |
| DELETE | `/api/socios/{id}` | Admin | Baja lógica, conserva historial. |
| POST, GET | `/api/usuarios` | Admin | Crear/listar cuentas de administrador y recepción. Listado acepta `rol`, `page`, `size`. |
| PATCH | `/api/usuarios/{id}/rol` | Admin | Cambia rol entre admin y recepción; invalida el token anterior. |
| PATCH | `/api/usuarios/{id}/estado?activo=true` | Admin | Activa/desactiva otra cuenta. |
| PATCH | `/api/usuarios/mi-password` | Usuario autenticado | Cambia su contraseña. |
| POST | `/api/entrenadores` | Admin | Crear entrenador. |
| GET | `/api/entrenadores` | Admin, recepción | Listar entrenadores paginados. |
| GET | `/api/planes` | Autenticado | Lista planes activos. |
| GET | `/api/planes/todos` | Admin | Lista todos los planes. |
| POST, PUT, PATCH | `/api/planes[/{id}][/estado]` | Admin | CRUD de planes y cambio de estado. |
| POST | `/api/membresias` | Admin, recepción | Asigna plan, precio congelado, fechas exclusivas y sin solapamientos. |
| GET | `/api/membresias/socio/{socioId}[ /vigente]` | Admin, recepción | Historial o membresía vigente de un socio. |
| GET | `/api/membresias/mia[ /vigente]` | Socio | Historial o membresía vigente propia. |
| GET | `/api/membresias/alertas?dias=7` | Admin, recepción | Vencidas y próximas a vencer. Rango 0–90 días. |
| POST, GET | `/api/pagos` | Admin, recepción | Registra abonos y lista pagos paginados con filtros `socioId`, `q`, `estado`. |
| GET | `/api/pagos/membresia/{membresiaId}` | Admin, recepción | Historial de pagos de una membresía. |
| PATCH | `/api/pagos/{id}/anular` | Admin | Anula con motivo, sin borrar el registro. |
| POST | `/api/asistencias` | Admin, recepción | Registra ingreso por DNI; valida estado y membresía del día en Lima. |
| GET | `/api/asistencias` | Admin, recepción | Listado por `fecha`, paginado y filtrable por `q`. |
| GET | `/api/asistencias/socio/{socioId}` | Admin, recepción | Historial paginado de asistencia. |
| GET | `/api/clases` | Autenticado | Clases activas que no terminaron y cupos disponibles. |
| POST | `/api/clases` | Admin | Crea clase; valida entrenador, aula y solapamientos. |
| PATCH | `/api/clases/{id}/cancelar` | Admin | Cancela clase y reservas activas. |
| POST | `/api/reservas` | Socio, admin, recepción | Reserva para sí mismo o para un socio si es personal. |
| GET | `/api/reservas/mias` | Socio | Lista reservas propias. |
| GET | `/api/reservas/clase/{claseId}` | Entrenador, admin, recepción | Lista reservas; entrenador solo de su clase. |
| PATCH | `/api/reservas/{id}/cancelar` | Socio, admin, recepción | Cancela reserva, socio solo la propia y antes del inicio. |
| PATCH | `/api/reservas/{id}/asistencia` | Entrenador, admin, recepción | Marca asistencia a clase; entrenador solo de su clase. |
| GET | `/api/reportes/resumen?desde=&hasta=` | Admin, recepción | Ingresos, pagos, asistencias, membresías y socios nuevos. |
| GET | `/api/auditoria` | Admin | Eventos paginados. |

## Contrato y reglas

- Campos de entrada/salida en camelCase. Las listas paginadas conservan `content`, `totalElements`, `totalPages`, `number`, `size` y demás propiedades principales de Spring Data.
- Errores: `{ "status", "mensaje", "errores", "fecha" }`. En desarrollo puede incluirse un código PostgreSQL en `errores.codigo`; no se incluye en producción.
- Contraseñas se guardan con bcrypt; los tokens son JWT HS256, duran 30 minutos por defecto y verifican la cuenta/rol vigente en cada petición.
- La lógica de negocio usa el esquema `gimnasio` de forma explícita en SQL. No se envía `search_path` como parámetro de inicio, porque el endpoint agrupado de Neon usa PgBouncer.
- Fechas de negocio se calculan en `America/Lima`; timestamps se devuelven en ISO-8601.
- Operaciones compuestas y de concurrencia usan `prisma.$transaction`; los bloqueos de fila (`FOR UPDATE`) y los `pg_advisory_xact_lock` que protegen pagos, membresías, aforo de clases y conflictos de horario se mantienen como SQL crudo dentro de esas transacciones (`tx.$queryRaw`/`tx.$executeRaw`) — Prisma no los modela por su API de modelos.

## Configuración del frontend

La API escucha en `http://localhost:8080` por defecto. Configura el origen del frontend en `CORS_ORIGINS` y usa `Authorization: Bearer <token>` para rutas protegidas. El frontend debe enviar `POST /api/auth/login` con `{ "correo", "password" }` y conservar el campo `token` recibido; `/api/socios` crea cuentas socio públicamente. La ruta de recuperación solo envía correo cuando el SMTP está habilitado; el frontend debe mostrar una confirmación genérica.

## Verificación

```bash
npm test
npm run dev
```

`npm test` cubre utilidades de contrato. Los flujos principales se verificaron contra PostgreSQL con cuentas y registros ficticios temporales, que luego se limpiaron. No se versionan credenciales: cada entorno debe configurar su propio `.env`.
