# PERSONAS.md

**Equipo:** ______________________________

**Proyecto:** GYM (ximEdgar Gym) – Sistema web de gestión de gimnasio

> Las Personas son ficticias, pero representan a los dos tipos de usuario que maneja el sistema: la **administración y recepción** (roles `ADMINISTRADOR` y `RECEPCIONISTA`) y el **socio** (rol `SOCIO`). Cada una se basa en lo que dicen usuarios reales en las mini entrevistas (ver campo "Tipo de usuario").

---

## Persona 1 — Marleny Tuanama (principal)

| Campo | Detalle |
|---|---|
| **1. Nombre y edad** | Marleny Tuanama, 38 años |
| **2. Ocupación y contexto** | Dueña y administradora de un gimnasio pequeño en Pucallpa. En horas punta (mañana temprano y de 6 a 8 p. m.) atiende ella misma la puerta; el resto del día cobra, programa clases y revisa quién debe renovar. |
| **3. Tecnología** | Laptop en el mostrador y celular. Usa WhatsApp para avisar a los socios y lleva asistencia y pagos en un cuaderno y hojas de Excel. Nivel digital: medio; aprende rápido, pero no quiere capacitaciones largas. |
| **4. Motivación** | Quiere dejar el cuaderno: saber de inmediato si alguien puede entrar, cobrar sin equivocarse y no perder dinero por socios que entran con la membresía vencida. |
| **5. Objetivos** | Registrar el ingreso con solo el DNI. Ver qué membresías vencen pronto para avisar a tiempo. Programar clases sin que choquen aula ni entrenador. Saber cuánto ingresó en el día. |
| **6. Frustraciones** | Fila en la puerta mientras busca un nombre en el cuaderno. Discusiones cuando un socio dice "ayer pagué" y no hay registro. Clases sobrevendidas. Corregir datos mal escritos. |
| **7. Escenario de uso** | En el mostrador, de pie, con socios esperando: 10 a 20 segundos por persona. Al cerrar el día, 10 minutos en la laptop para revisar pagos y membresías. |
| **Tipo de usuario** | Administrador / recepción. Salió de la mini entrevista a: ______________________________ |
| **8. Frase que la define** | “Necesito saber en un vistazo si puede entrar o no, sin buscar en el cuaderno.” |

**Decisiones de diseño que se desprenden de esta ficha:** registro de ingreso con un solo campo (DNI) y validación en tiempo real; errores con código y motivo claros (membresía vencida, socio dado de baja, ingreso duplicado); resumen del día visible sin navegar por varias pantallas.

---

## Persona 2 — Jhon Rengifo

| Campo | Detalle |
|---|---|
| **1. Nombre y edad** | Jhon Rengifo, 22 años |
| **2. Ocupación y contexto** | Estudia en un instituto en Pucallpa y trabaja medio tiempo por las tardes. Entrena 3 o 4 veces por semana, de 6:00 a 7:30 p. m., al salir del trabajo. |
| **3. Tecnología** | Celular Android de gama media. Usa WhatsApp, TikTok y Facebook todos los días. Nunca ha usado una app de gimnasio. Nivel digital: medio; no tiene paciencia con formularios largos. |
| **4. Motivación** | Quiere dejar de enterarse en la puerta de que su membresía venció, y no perder su lugar en la clase de spinning. |
| **5. Objetivos** | Ver en segundos hasta cuándo paga su membresía. Reservar una clase sin preguntar en recepción. Corregir su correo o teléfono por su cuenta. |
| **6. Frustraciones** | Llegar con la bolsa y que le digan “tu membresía venció ayer”. Descubrir que la clase está llena al llegar. Olvidar contraseñas. Si la app demora, vuelve a preguntar en persona. |
| **7. Escenario de uso** | En el micro o en el descanso del trabajo, desde el celular, con una sola mano y señal irregular. Dispone de 1 o 2 minutos como máximo. |
| **Tipo de usuario** | Cliente (socio). Salió de la mini entrevista a: ______________________________ |
| **8. Frase que lo define** | “Si tengo que preguntar en recepción cada vez, mejor ni miro.” |

**Decisiones de diseño que se desprenden de esta ficha:** "Mi perfil" pensado primero para celular, con estado y vencimiento de la membresía a la vista; formularios cortos; aviso claro cuando una clase está llena.

---

## Mapa de empatía — Marleny Tuanama

| Cuadrante | Ideas |
|---|---|
| **Piensa y siente** | “¿Y si dejo entrar a alguien que no pagó y pierdo plata?” · Le preocupa quedar mal frente a otros socios cuando les dice que su membresía venció. · Le importa que el gimnasio se vea ordenado y confiable. |
| **Ve** | Fila de socios en la puerta mientras ella busca en el cuaderno. · Otros gimnasios de la zona que avisan por WhatsApp cuando se vence la membresía. · Hojas de Excel y cuadernos con datos desordenados. |
| **Oye** | Socios que dicen: “Ayer pagué, revisa bien.” · Su entrenador: “La clase de las 7 ya está llena.” · Una amiga con negocio: “Con un sistema se acaban las discusiones.” |
| **Dice y hace** | Anota ingresos y pagos en un cuaderno y luego los pasa a Excel. · Llama o escribe por WhatsApp a quienes están por vencer. · Pide el DNI y lo busca a mano para confirmar al socio. |
| **Dolores** | Perder tiempo en la puerta y que se forme cola. · Errores de memoria y de escritura en los pagos. · No saber cuántas personas hay en una clase hasta que ya empezó. |
| **Ganancias** | Registrar un ingreso en pocos segundos con solo el DNI. · Saber qué membresías vencen esta semana y avisar a tiempo. · Cerrar el día sabiendo exactamente cuánto ingresó. |

---

## Historias de usuario reescritas

**HU-__ · Control de ingresos** (Persona 1)
> **Como** Marleny, **quiero** escribir el DNI del socio y ver al instante si su membresía está vigente, **para** dejarlo entrar sin buscar en el cuaderno ni hacer esperar a la fila.
>
> **Criterio:** *Dado* un socio con membresía vencida, *cuando* ingreso su DNI y registro el ingreso, *entonces* el sistema muestra el error 403 con la fecha de vencimiento y no registra la asistencia.

**HU-__ · Mi membresía** (Persona 2)
> **Como** Jhon, **quiero** ver en mi perfil el plan, el inicio y el vencimiento de mi membresía, **para** saber cuándo renovar sin preguntar en recepción.
>
> **Criterio:** *Dado* que Jhon tiene una membresía activa, *cuando* abre “Mi perfil”, *entonces* ve el estado “Activa”, el plan y la fecha de vencimiento en la misma pantalla.

**HU-__ · Clase con cupos** (Persona 1)
> **Como** Marleny, **quiero** que el sistema me avise cuando una clase ya no tiene cupos, **para** no sobrevender la clase ni tener que decir “no hay lugar” en la puerta.
>
> **Criterio:** *Dado* una clase con aforo completo, *cuando* intento inscribir a otro socio con membresía vigente, *entonces* el sistema muestra el error 409 “La clase está llena” y no crea la inscripción.
