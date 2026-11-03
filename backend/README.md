# Backend del gimnasio

API REST con Spring Boot y PostgreSQL. El esquema esperado es el script `SQL-Gimnasio.sql` entregado para este proyecto y JPA usa `validate`: al arrancar comprueba que las tablas y columnas existan, pero no las crea ni modifica.

## Ejecutar y configurar

```bash
./mvnw test
./mvnw spring-boot:run
```

La configuración local vive en `application-local.properties`, que no se versiona ni se incluye en el JAR. Para despliegue, configura `SPRING_PROFILES_ACTIVE=prod`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` y `APP_JWT_SECRET` en el entorno. El secreto JWT debe tener al menos 256 bits. Configura `APP_CORS_ALLOWED_ORIGINS` con los orígenes exactos del frontend (separados por comas).

La recuperación de contraseña queda desactivada por defecto. Para habilitarla configura `APP_MAIL_ENABLED=true`, `APP_MAIL_FROM`, `APP_MAIL_RESET_URL`, `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME` y `SPRING_MAIL_PASSWORD`. El enlace de `APP_MAIL_RESET_URL` debe abrir la pantalla del frontend que enviará el token a `/api/auth/restablecer`. La solicitud de recuperación siempre responde igual exista o no el correo.

## Autenticación, roles y respuestas

Para iniciar sesión, llama a `POST /api/auth/login` y guarda el `token` de la respuesta. En rutas protegidas envía `Authorization: Bearer <token>`. El token dura 30 minutos; como todavía no existe renovación, al vencer el frontend debe pedir al usuario que vuelva a iniciar sesión. Roles: `ADMINISTRADOR`, `RECEPCIONISTA`, `SOCIO` y `ENTRENADOR`. Las fechas de negocio usan `America/Lima`; fecha y hora se transportan en ISO-8601.

La colección Postman de comprobaciones seguras está en `postman/Gimnasio-API.postman_collection.json`. Con el backend local en ejecución, se puede lanzar con:

```bash
postman collection run postman/Gimnasio-API.postman_collection.json \
  --environment postman/Gimnasio-local.postman_environment.json
```

Estas comprobaciones no requieren iniciar sesión en Postman ni en la nube de Postman; solo apuntan a la URL local configurada en el entorno.

La colección autenticada por roles está en `postman/Gimnasio-roles.postman_collection.json`. Requiere variables locales `adminEmail`, `adminPassword`, `recepcionEmail`, `recepcionPassword`, `socioEmail`, `socioPassword`, `entrenadorEmail` y `entrenadorPassword`, pasadas con `--env-var` o guardadas en un entorno privado de Postman. No guardes esas contraseñas en el repositorio. Cada login exitoso genera su evento normal en la tabla de auditoría.

Los errores de API usan este formato:

```json
{
  "status": 400,
  "mensaje": "Hay datos invalidos en la peticion",
  "errores": { "dni": "El DNI debe tener exactamente 8 digitos" },
  "fecha": "2026-10-28T10:30:00-05:00"
}
```

Estados comunes: `400` datos inválidos, `401` token ausente/inválido, `403` rol sin permiso, `404` recurso o ruta inexistente, `405` método HTTP no permitido, `415` tipo de contenido no soportado, `409` duplicado o conflicto de negocio y `500` error inesperado. Listados paginados devuelven el objeto estándar `Page` de Spring Data (`content`, `totalElements`, `totalPages`, `number`, `size`, entre otros campos).

## Contrato de endpoints

`Público` no requiere token. Los demás roles indicados requieren autenticación. Los roles no mencionados reciben `403`.

| Método y ruta | Acceso | Uso y parámetros |
|---|---|---|
| `POST /api/auth/login` | Público | Inicio de sesión. Cuerpo: `correo`, `password`. Devuelve `token`, `tokenType`, `usuarioId`, `nombre`, `rol`. |
| `POST /api/auth/recuperar` | Público | Cuerpo: `correo`. Devuelve `202` y un mensaje genérico. Requiere SMTP habilitado para enviar correo. |
| `POST /api/auth/restablecer` | Público | Cuerpo: `token`, `nuevaPassword` (8–100 caracteres). Token de un solo uso y válido por 30 minutos. |
| `POST /api/socios` | Público | Registro. Cuerpo: `nombre`, `apellido`, `correo`, `password`, `dni`, `telefono`, `genero`, `direccion`, `contactoEmergencia`. `genero`: `MASCULINO` o `FEMENINO`; DNI 8 dígitos; teléfono 9 dígitos. |
| `GET /api/socios` | Admin, recepción | Lista paginada. Query opcional: `q`, `activo`; paginación `page` (0 desde el inicio), `size` (máximo 50). |
| `GET /api/socios/{id}` | Admin, recepción, socio | Obtiene perfil; el socio solo puede consultar el suyo. |
| `PUT /api/socios/{id}` | Admin, recepción, socio | Actualiza `correo`, `telefono`, `direccion`, `contactoEmergencia`; admin también puede actualizar `dni`. El socio solo modifica su perfil. Campos opcionales. |
| `DELETE /api/socios/{id}` | Admin | Baja lógica; historial preservado. Devuelve `204`. |
| `GET /api/planes` | Cualquier usuario autenticado | Lista planes activos. |
| `GET /api/planes/todos` | Admin | Lista todos los planes. |
| `POST /api/planes` | Admin | Cuerpo: `nombre`, `precio`, `duracionDias`. |
| `PUT /api/planes/{id}` | Admin | Actualiza `nombre`, `precio`, `duracionDias`. |
| `PATCH /api/planes/{id}/estado?activo=true` | Admin | Activa/desactiva un plan. |
| `POST /api/membresias` | Admin, recepción | Asigna membresía. Cuerpo: `socioId`, `planId`, `fechaInicio` opcional (por defecto hoy en Lima). `fechaFin` es exclusiva; no se permiten periodos solapados. |
| `GET /api/membresias/socio/{socioId}` | Admin, recepción | Historial completo de membresías de un socio. |
| `GET /api/membresias/socio/{socioId}/vigente` | Admin, recepción | Membresía vigente; `404` si no hay. |
| `GET /api/membresias/mia` | Socio | Historial propio. |
| `GET /api/membresias/mia/vigente` | Socio | Membresía vigente propia; `404` si no hay. |
| `GET /api/membresias/alertas?dias=7` | Admin, recepción | Membresías vencidas en los últimos 30 días o que vencen dentro del rango (0–90 días). |
| `POST /api/pagos` | Admin, recepción | Registra abono. Cuerpo: `membresiaId`, `monto` (> 0 y no mayor al saldo), `metodo` (`EFECTIVO`, `TRANSFERENCIA`, `TARJETA`). |
| `GET /api/pagos` | Admin, recepción | Lista paginada; filtros opcionales `socioId`, `q`, `estado` (`REGISTRADO` o `ANULADO`), `page`, `size` (máximo 50). |
| `GET /api/pagos/membresia/{membresiaId}` | Admin, recepción | Historial de pagos de una membresía. |
| `PATCH /api/pagos/{id}/anular` | Admin | Anula sin borrar el registro. Cuerpo: `motivo`. |
| `POST /api/asistencias` | Admin, recepción | Registra ingreso por DNI. Cuerpo: `dni`. Valida socio activo, membresía vigente y un ingreso por día. |
| `GET /api/asistencias?fecha=AAAA-MM-DD&page=0&size=20&q=` | Admin, recepción | Asistencias del día indicado (hoy en Lima si se omite); filtro por nombre/DNI. |
| `GET /api/asistencias/socio/{socioId}?page=0&size=20` | Admin, recepción | Historial de asistencia del socio. |
| `POST /api/entrenadores` | Admin | Crea entrenador. Cuerpo: `nombre`, `apellido`, `correo`, `password`, `dni`, `telefono`, `especialidad`. |
| `GET /api/entrenadores?page=0&size=10` | Admin, recepción | Lista paginada de entrenadores. |
| `GET /api/clases` | Cualquier usuario autenticado | Próximas clases con reservas y cupos disponibles. |
| `POST /api/clases` | Admin | Crea clase. Cuerpo: `disciplina`, `entrenadorId`, `aula`, `inicio`, `fin`, `aforo`. Fechas: ISO-8601 con zona, por ejemplo `2026-11-03T18:00:00-05:00`. |
| `PATCH /api/clases/{id}/cancelar` | Admin | Cancela la clase y sus reservas activas. |
| `POST /api/reservas` | Socio, admin, recepción | Cuerpo: `claseId`; personal puede añadir `socioId`. Socio reserva para sí mismo. |
| `GET /api/reservas/mias` | Socio | Reservas propias. |
| `GET /api/reservas/clase/{claseId}` | Entrenador, admin, recepción | Reservas de una clase. |
| `PATCH /api/reservas/{id}/cancelar` | Socio, admin, recepción | Cancela reserva; socio solo puede cancelar la propia. |
| `PATCH /api/reservas/{id}/asistencia` | Entrenador, admin, recepción | Marca asistencia a una reserva. |
| `GET /api/reportes/resumen?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` | Admin, recepción | Resumen del rango: ingresos, pagos, asistencias, membresías vigentes/vencidas y nuevos socios. Fechas opcionales. |
| `GET /api/auditoria?page=0&size=20` | Admin | Eventos de auditoría paginados. |
| `GET /api/socios/mi-perfil` | Socio | Perfil del socio con la sesión iniciada (no requiere conocer el `socioId`). |
| `POST /api/usuarios` | Admin | Crea cuentas del personal. Cuerpo: `nombre`, `apellido`, `correo`, `password`, `rol` (`ADMINISTRADOR` o `RECEPCIONISTA`). |
| `GET /api/usuarios?page=0&size=10&rol=` | Admin | Lista paginada de cuentas; filtro opcional por rol. |
| `PATCH /api/usuarios/{id}/rol` | Admin | Cuerpo: `rol`. Solo entre administrador y recepcionista; no sobre sí mismo. Invalida la sesión del usuario afectado. |
| `PATCH /api/usuarios/{id}/estado?activo=false` | Admin | Activa/desactiva una cuenta (no la propia). Una cuenta desactivada pierde acceso de inmediato aunque su token no haya vencido. |
| `PATCH /api/usuarios/mi-password` | Cualquier usuario autenticado | Cuerpo: `passwordActual`, `passwordNueva` (8–100 caracteres). |

## Notas para integración

- Las rutas de creación devuelven `201`; la baja de socio devuelve `204`; la solicitud de recuperación devuelve `202`.
- Los campos de respuesta son camelCase. IDs son numéricos; importes se serializan como decimales; fechas son ISO (`YYYY-MM-DD`) y timestamps incluyen zona.
- Una membresía conserva el precio del plan en el momento de asignarla. Los pagos pueden registrarse en varios abonos hasta cubrir ese importe y se serializan por membresía para evitar sobrepagos concurrentes.
- La UI de restablecimiento debe leer el token de `APP_MAIL_RESET_URL` y enviarlo junto con `nuevaPassword` al endpoint público.
