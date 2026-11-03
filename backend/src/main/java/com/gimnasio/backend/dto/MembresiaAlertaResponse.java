package com.gimnasio.backend.dto;

import java.time.LocalDate;

public record MembresiaAlertaResponse(
        Long membresiaId,
        Long socioId,
        String socioNombre,
        String correo,
        String dni,
        String plan,
        LocalDate fechaFin,
        long diasRestantes,
        String estado
) {}
