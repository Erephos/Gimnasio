package com.gimnasio.backend.dto;

import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

/** inicio/fin en ISO-8601 con zona, p. ej. 2026-11-03T18:00:00-05:00 */
public record ClaseRequest(
        @NotBlank @Size(max = 30) String disciplina,
        @NotNull Long entrenadorId,
        @NotBlank @Size(max = 30) String aula,
        @NotNull OffsetDateTime inicio,
        @NotNull OffsetDateTime fin,
        @NotNull @Min(value = 1, message = "El aforo debe ser de al menos 1") Integer aforo
) {}
