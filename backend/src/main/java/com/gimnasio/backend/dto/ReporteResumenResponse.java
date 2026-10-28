package com.gimnasio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReporteResumenResponse(
        LocalDate desde,
        LocalDate hasta,
        BigDecimal ingresosRegistrados,
        long pagosRegistrados,
        long asistencias,
        long membresiasVigentes,
        long membresiasVencidas,
        long sociosNuevos
) {}
