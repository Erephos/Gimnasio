-- SQL-Gimnasio.sql
--
-- ADVERTENCIA: este archivo no existia en el repositorio. backend-node/ y
-- backend/ (Spring, archivado) lo mencionan como la fuente de verdad del
-- esquema "gimnasio", pero nunca se versiono. Lo reconstrui leyendo cada
-- consulta SQL de backend-node/src/routes/*.js, backend-node/src/lib/http.js
-- y backend-node/src/middleware/auth.js (nombres de tabla, columnas, joins,
-- checks y que errores de Postgres espera manejar error-handler.js).
--
-- Antes de usarlo para la feria: si Edgar ya tiene una base en Neon
-- funcionando, hagan `npx prisma db pull` contra esa base real para que
-- prisma/schema.prisma se corrija solo con la estructura real, en vez de
-- confiar en esta reconstruccion. Si no existe ninguna base todavia, este
-- script sirve para crear una desde cero.

create schema gimnasio;
set search_path to gimnasio;

--Roles de cuenta (administrador/recepcion/entrenador/socio)
create table roles(
	id 		bigint 			generated always as identity primary key,
	nombre 	varchar(20) 	not null unique
);

insert into roles (nombre) values ('ADMINISTRADOR'), ('RECEPCIONISTA'), ('ENTRENADOR'), ('SOCIO');

--Cuentas de acceso (login). Un socio, entrenador o miembro del staff es
--siempre primero una fila aqui; socios/entrenadores extienden esta tabla.
create table usuarios(
	id 				bigint 			generated always as identity primary key,
	nombre 			varchar(60) 	not null,
	apellido 		varchar(60) 	not null,
	correo 			varchar(100) 	not null,
	password_hash 	text 			not null,
	rol_id 			bigint 			not null references roles(id),
	activo 			boolean 		not null default true,
	creado_en 		timestamptz 	not null default now(),
	actualizado_en 	timestamptz
);

--El login busca por lower(correo); por eso el indice es sobre la expresion,
--no sobre la columna cruda.
create unique index usuarios_correo_uq on usuarios (lower(correo));

--Datos propios de un socio (1 a 1 con usuarios, rol SOCIO)
create table socios(
	id 					bigint 			generated always as identity primary key,
	usuario_id 			bigint 			not null unique references usuarios(id) on delete cascade,
	dni 				varchar(8) 		not null unique,
	telefono 			varchar(9),
	genero 				varchar(10) 	not null check (genero in ('MASCULINO', 'FEMENINO')),
	direccion 			varchar(150),
	contacto_emergencia varchar(100),
	creado_en 			timestamptz 	not null default now()
);

--Datos propios de un entrenador (1 a 1 con usuarios, rol ENTRENADOR)
create table entrenadores(
	id 			bigint 			generated always as identity primary key,
	usuario_id 	bigint 			not null unique references usuarios(id) on delete cascade,
	dni 		varchar(8) 		not null unique,
	telefono 	varchar(9),
	especialidad varchar(50) 	not null,
	creado_en 	timestamptz 	not null default now()
);

--Planes de membresia (Mensual, Trimestral, etc.)
create table planes(
	id 				bigint 			generated always as identity primary key,
	nombre 			varchar(30) 	not null,
	precio 			numeric(10,2) 	not null check (precio > 0),
	duracion_dias 	integer 		not null check (duracion_dias > 0),
	activo 			boolean 		not null default true
);

create unique index planes_nombre_uq on planes (lower(nombre));

--Membresias compradas por un socio. fecha_fin es EXCLUSIVA (vigente si
--fecha_inicio <= hoy < fecha_fin), igual que lo usa mapMembresia en el backend.
create table membresias(
	id 				bigint 			generated always as identity primary key,
	socio_id 		bigint 			not null references socios(id) on delete cascade,
	plan_id 		bigint 			not null references planes(id),
	fecha_inicio 	date 			not null,
	fecha_fin 		date 			not null check (fecha_fin > fecha_inicio),
	precio_pagado 	numeric(10,2) 	not null check (precio_pagado > 0),
	creada_en 		timestamptz 	not null default now()
);

create index membresias_socio_idx on membresias (socio_id, fecha_inicio desc);

--Pagos sobre una membresia. No se borran; se anulan (estado + motivo).
create table pagos(
	id 					bigint 			generated always as identity primary key,
	socio_id 			bigint 			not null references socios(id),
	membresia_id 		bigint 			not null references membresias(id),
	monto 				numeric(10,2) 	not null check (monto > 0),
	metodo 				varchar(20) 	not null check (metodo in ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA')),
	estado 				varchar(20) 	not null default 'REGISTRADO' check (estado in ('REGISTRADO', 'ANULADO')),
	fecha_pago 			timestamptz 	not null default now(),
	registrado_por 		bigint 			not null references usuarios(id),
	anulado_por 		bigint 			references usuarios(id),
	anulado_en 			timestamptz,
	motivo_anulacion 	varchar(200)
);

create index pagos_membresia_idx on pagos (membresia_id);
create index pagos_fecha_idx on pagos (fecha_pago desc);

--Ingreso diario de un socio. Una entrada por socio por dia (unique),
--asistencias.js confia en que el 23505 de Postgres se traduzca a 409.
create table asistencias(
	id 				bigint 			generated always as identity primary key,
	socio_id 		bigint 			not null references socios(id),
	fecha 			date 			not null,
	hora_entrada 	timestamptz 	not null default now(),
	registrado_por 	bigint 			not null references usuarios(id),
	unique (socio_id, fecha)
);

--Clases grupales con cupo (aforo) y entrenador asignado.
create table clases(
	id 				bigint 			generated always as identity primary key,
	disciplina 		varchar(30) 	not null,
	entrenador_id 	bigint 			not null references entrenadores(id),
	aula 			varchar(30) 	not null,
	inicio 			timestamptz 	not null,
	fin 			timestamptz 	not null check (fin > inicio),
	aforo 			integer 		not null check (aforo > 0),
	activa 			boolean 		not null default true,
	creada_en 		timestamptz 	not null default now()
);

create index clases_entrenador_idx on clases (entrenador_id);

--Reserva de un socio a una clase. No hay unique estricto: un socio puede
--reservar, cancelar y volver a reservar la misma clase; schedule.js valida
--duplicados "mientras este RESERVADA" en la aplicacion, no en la BD.
create table reservas(
	id 			bigint 			generated always as identity primary key,
	clase_id 	bigint 			not null references clases(id),
	socio_id 	bigint 			not null references socios(id),
	estado 		varchar(20) 	not null default 'RESERVADA' check (estado in ('RESERVADA', 'CANCELADA')),
	asistio_en 	timestamptz,
	creada_en 	timestamptz 	not null default now()
);

create index reservas_clase_idx on reservas (clase_id);
create index reservas_socio_idx on reservas (socio_id);

--Tokens de un solo uso para "olvide mi contraseña" (expiran en 30 min).
create table recuperacion_tokens(
	id 			bigint 			generated always as identity primary key,
	usuario_id 	bigint 			not null references usuarios(id) on delete cascade,
	token_hash 	text 			not null,
	expira_en 	timestamptz 	not null,
	usado_en 	timestamptz,
	creado_en 	timestamptz 	not null default now()
);

create index recuperacion_usuario_idx on recuperacion_tokens (usuario_id) where usado_en is null;

--Bitacora de acciones. usuario_id en SET NULL: si alguna vez se borra una
--cuenta (hoy solo hay baja logica), el historial de auditoria se conserva.
create table auditoria(
	id 			bigint 			generated always as identity primary key,
	usuario_id 	bigint 			references usuarios(id) on delete set null,
	accion 		varchar(40) 	not null,
	entidad 	varchar(30) 	not null,
	entidad_id 	bigint,
	detalle 	text,
	fecha 		timestamptz 	not null default now()
);

create index auditoria_fecha_idx on auditoria (fecha desc);
