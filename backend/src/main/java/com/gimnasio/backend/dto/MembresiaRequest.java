package com.gimnasio.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** fechaInicio es opcional: si no se envia, empieza hoy (hora de Lima). */
public record MembresiaRequest(
        @NotNull Long socioId,
        @NotNull Long planId,
        LocalDate fechaInicio
) {}
