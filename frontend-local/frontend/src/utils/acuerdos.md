## ¿cuando respondemos mensajes?

- Edgar: los horarios que tengo disponible son de 3:00pm a 6:pm
- ximena: los horarios que tengo disponible son de 1:00pm a 4:pm

## ¿Cómo decidimos si no hay acuerdo?

- Criterio del Owner de la tarea: Si el cambio es principalmente de frontend o arquitectura backend, el responsable directo de esa área toma la decisión final y asume la responsabilidad del resultado.
- Prueba de concepto rápida (Timebox): Hacemos una prueba rápida de 15 a 30 minutos con la opción más ligera. Si funciona bien en la práctica, nos quedamos con esa.
- Priorizar la reversibilidad y simplicidad: Elegimos la opción más simple de implementar y que sea más fácil de cambiar en el futuro si descubrimos una mejor alternativa.
- Desempate con un tercero: Si la decisión es crítica y seguimos estancados, le pedimos una opinión rápida de 5 minutos a un compañero, mentor o líder técnico.
- Moneda o azar (Solo para detalles menores): Si es una preferencia puramente estética o sin impacto técnico real, lo decidimos al azar en 5 segundos y seguimos adelante.

## ¿Cuánto esperamos antes de pedir ayuda?

- Primeros 15 a 30 minutos: Intentamos resolver el problema de forma autónoma (revisar la documentación, hacer depuración del código o buscar soluciones previas).
- Si pasados los 30 minutos seguimos bloqueados: Detenemos la búsqueda individual y pedimos ayuda de inmediato (vía canal Cara a cara o Chat) compartiendo lo que ya intentamos y el error exacto que tenemos.

## ¿Quién revisa antes de pasar a Hecho?

- Revisión por el compañero: Quien desarrolló la funcionalidad la mueve a En revisión y abre el Pull Request (PR). El otro integrante (que no hizo la tarea) revisa el código, lo prueba y aprueba el PR.   
  Criterio de aprobación:    
  Solo cuando la otra persona ha verificado que cumple los criterios de aceptación y los tests pasan, la tarea se mueve oficialmente a Hecho.   

## ¿Qué reglas seguimos al usar OpenCode?

- Atribución y Licenciamiento: Respetar siempre las licencias del código abierto que reutilizamos, manteniendo los créditos de autoría originales si el proyecto lo requiere.
- Revisión de Seguridad: Todo fragmento de código externo (OpenCode) que integremos debe pasar por una revisión previa de ambos para evitar vulnerabilidades.
- Pruebas Locales: Antes de fusionar código abierto a la rama principal (main), debemos probar que no rompa la compilación ni las funcionalidades actuales del sistema.
- Documentación de Cambios: Si modificamos alguna librería o componente abierto, debemos documentarlo claramente en los commits o en el repositorio para que el otro entienda el ajuste.
