# API del gimnasio (Node.js)

Backend REST activo con Node.js 22, Express y PostgreSQL. Mantiene el contrato de la API previa para conservar la integración prevista con el frontend. El esquema existente `gimnasio` es la fuente de verdad: esta API no crea ni altera tablas. `../backend/` contiene la implementación histórica en Spring Boot y ya no es el backend activo.

## Ejecutar localmente

1. Desde `backend-node/`, copia `.env.example` a `.env`. Mantén `.env` privado y fuera de Git. Configura `DATABASE_URL` con la URL PostgreSQL y `JWT_SECRET` aleatorio de al menos 32 caracteres. El esquema es `gimnasio` y está fijado en las consultas; configura `CORS_ORIGINS` con el origen del frontend.
2. Instala dependencias e inicia:

```bash
npm install
npm run dev
```

3. Comprueba `GET http://localhost:8080/api/health`; debe responder `{"estado":"ok","baseDatos":"conectada"}`.

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
- Operaciones compuestas y de concurrencia usan transacciones; bloqueos de fila protegen pagos y membresías, y bloqueos transaccionales protegen el aforo de clases y conflictos de horarios.

## Configuración del frontend

La API escucha en `http://localhost:8080` por defecto. Configura el origen del frontend en `CORS_ORIGINS` y usa `Authorization: Bearer <token>` para rutas protegidas. El frontend debe enviar `POST /api/auth/login` con `{ "correo", "password" }` y conservar el campo `token` recibido; `/api/socios` crea cuentas socio públicamente. La ruta de recuperación solo envía correo cuando el SMTP está habilitado; el frontend debe mostrar una confirmación genérica.

## Verificación

```bash
npm test
npm run dev
```

`npm test` cubre utilidades de contrato. Los flujos principales se verificaron contra PostgreSQL con cuentas y registros ficticios temporales, que luego se limpiaron. No se versionan credenciales: cada entorno debe configurar su propio `.env`.
