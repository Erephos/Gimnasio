create table roles(
    id      									bigint       							generated always as identity primary key,
    nombre  							varchar(30)  					not null unique
);

insert into roles(nombre) values
	('ADMINISTRADOR'),
	('RECEPCIONISTA'),
	('ENTRENADOR'),
	('SOCIO');


create table usuarios(
    id              		 					bigint        							generated always as identity primary key,
    nombre          					varchar(60)   					not null,
    apellido        					varchar(60)   					not null,
    correo          					varchar(100)  					not null unique,
    password_hash   		varchar(255)  					not null,
    rol_id          						bigint        							not null references roles(id) on delete restrict,
    activo          						boolean       						not null default true,
    creado_en       				timestamptz   				not null default now(),
    actualizado_en  			timestamptz   				not null default now()
);

create table socios(
    id                   						bigint       							generated always as identity primary key,
    usuario_id           			bigint       							not null unique references usuarios(id) on delete restrict,
    dni                  					varchar(8)   						not null unique
                         						constraint ck_socios_dni check (dni ~ '^[0-9]{8}$'),
    telefono             			varchar(9)
                         						constraint ck_socios_telefono check (telefono ~ '^[0-9]{9}$'),
    genero               				varchar(10)  					not null
                         						constraint ck_socios_genero check (genero in ('MASCULINO', 'FEMENINO')),
    direccion            			varchar(150),
    contacto_emergencia  varchar(100),
    creado_en            			timestamptz  					not null default now()
);

create table planes(
    id             							bigint         							generated always as identity primary key,
    nombre         					varchar(30)    					not null unique,
    precio         						numeric(10,2)  				not null
                   								constraint ck_planes_precio check (precio > 0),
    duracion_dias  			integer        						not null
                   								constraint ck_planes_duracion check (duracion_dias > 0),
    activo         						boolean        						not null default true
);

create table membresias(
    id             							bigint         							generated always as identity primary key,
    socio_id       					bigint         							not null references socios(id) on delete restrict,
    plan_id        					bigint         							not null references planes(id) on delete restrict,
    fecha_inicio   				date           							not null,
    fecha_fin      					date           							not null,
    precio_pagado  			numeric(10,2)  				not null
                   								constraint ck_membresias_precio check (precio_pagado > 0),
    creada_en      				timestamptz    				not null default now(),
    											constraint ck_membresias_fechas check (fecha_fin > fecha_inicio)
);

create index idx_membresias_socio_fin on membresias (socio_id, fecha_fin);

create table pagos(
    id                						bigint         							generated always as identity primary key,
    socio_id          				bigint         							not null references socios(id) on delete restrict,
    membresia_id      		bigint         							not null references membresias(id) on delete restrict,
    monto             				numeric(10,2)  				not null
                      							constraint ck_pagos_monto check (monto > 0),
    metodo            				varchar(15)    					not null
                      							constraint ck_pagos_metodo check (metodo in ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA')),
    estado            					varchar(10)    					not null default 'REGISTRADO'
                      							constraint ck_pagos_estado check (estado in ('REGISTRADO', 'ANULADO')),
    fecha_pago        			timestamptz    				not null default now(),
    registrado_por    		bigint         							not null references usuarios(id) on delete restrict,
    anulado_por       			bigint         							references usuarios(id) on delete restrict,
    anulado_en        			timestamptz	,
    motivo_anulacion  	varchar(200)
);

create index idx_pagos_socio on pagos (socio_id);
create index idx_pagos_fecha on pagos (fecha_pago);

create table asistencias(
    id              							bigint       							generated always as identity primary key,
    socio_id        					bigint       							not null references socios(id) on delete restrict,
    fecha           						date         								not null default (now() at time zone 'America/Lima')::date,
    hora_entrada    			timestamptz  					not null default now(),
    registrado_por  			bigint       							not null references usuarios(id) on delete restrict,
    											constraint uq_asistencias_socio_fecha unique (socio_id, fecha)
);

create index idx_asistencias_fecha on asistencias (fecha);

create table recuperacion_tokens(
    id          								bigint       							generated always as identity primary key,
    usuario_id  					bigint       							not null references usuarios(id) on delete restrict,
    token_hash  					varchar(64)  					not null unique,
    expira_en   					timestamptz  					not null,
    usado_en    					timestamptz,
    creado_en   					timestamptz  					not null default now(),
    											constraint ck_recuperacion_expira check (expira_en > creado_en)
);

create table auditoria(
    id          								bigint        							generated always as identity primary key,
    usuario_id  					bigint        							references usuarios(id) on delete restrict,
    accion      						varchar(30)   					not null,
    entidad     						varchar(30)   					not null,
    entidad_id  					bigint,
    detalle     						varchar(500),
    fecha       							timestamptz   				not null default now()
);

create index idx_auditoria_fecha on auditoria (fecha);
create index idx_auditoria_usuario_fecha on auditoria (usuario_id, fecha);

create table entrenadores(
    id            							bigint       							generated always as identity primary key,
    usuario_id    					bigint       							not null unique references usuarios(id) on delete restrict,
    dni           							varchar(8)   						not null unique
                  								constraint ck_entrenadores_dni check (dni ~ '^[0-9]{8}$'),
    telefono      					varchar(9)
                  								constraint ck_entrenadores_telefono check (telefono ~ '^[0-9]{9}$'),
    especialidad  				varchar(50)  					not null,
    creado_en     				timestamptz  					not null default now()
);

create table clases(
    id             							bigint       							generated always as identity primary key,
    disciplina     					varchar(30)  					not null,
    entrenador_id  			bigint       							not null references entrenadores(id) on delete restrict,
    aula           						varchar(30)  					not null,
    inicio         						timestamptz  					not null,
    fin            							timestamptz  					not null,
    aforo          						integer      							not null
                   								constraint ck_clases_aforo check (aforo > 0),
    activa         						boolean      						not null default true,
    creada_en      				timestamptz  					not null default now(),
    											constraint ck_clases_horario check (fin > inicio)
);

create table reservas(
    id          								bigint       							generated always as identity primary key,
    clase_id    						bigint       							not null references clases(id) on delete restrict,
    socio_id    						bigint       							not null references socios(id) on delete restrict,
    estado      						varchar(10)  					not null default 'RESERVADA'
                								constraint ck_reservas_estado check (estado in ('RESERVADA', 'CANCELADA')),
    asistio_en  					timestamptz,
    creada_en   					timestamptz  					not null default now()
);

create unique index uq_reservas_activa
    on reservas (clase_id, socio_id)
    where estado = 'RESERVADA';

create index idx_reservas_socio on reservas (socio_id);

update gimnasio.usuarios
set rol_id = (select id from gimnasio.roles where nombre = 'ADMINISTRADOR')
where correo = 'admin@test.com';


