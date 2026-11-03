package com.gimnasio.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record PagoRequest(
        @NotNull Long membresiaId,
        @NotNull @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
        @Digits(integer = 8, fraction = 2) BigDecimal monto,
        @NotBlank @Pattern(regexp = "^(EFECTIVO|TRANSFERENCIA|TARJETA)$",
                message = "El metodo debe ser EFECTIVO, TRANSFERENCIA o TARJETA") String metodo
) {}
