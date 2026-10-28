package com.gimnasio.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record PlanRequest(
        @NotBlank @Size(max = 30) String nombre,
        @NotNull @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
        @Digits(integer = 8, fraction = 2) BigDecimal precio,
        @NotNull @Min(value = 1, message = "La duracion debe ser de al menos 1 dia") Integer duracionDias
) {}
