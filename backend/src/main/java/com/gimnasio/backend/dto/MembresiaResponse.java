package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Membresia;
import com.gimnasio.backend.util.Fechas;
import com.gimnasio.backend.util.Nombres;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record MembresiaResponse(
        Long id, Long socioId, String socioNombre, Long planId, String planNombre,
        LocalDate fechaInicio, LocalDate fechaFin, BigDecimal precioPagado,
        boolean vigente, OffsetDateTime creadaEn
) {
    public static MembresiaResponse desde(Membresia m) {
        LocalDate hoy = Fechas.hoy();
        boolean vigente = !hoy.isBefore(m.getFechaInicio()) && hoy.isBefore(m.getFechaFin());
        return new MembresiaResponse(m.getId(), m.getSocio().getId(),
                Nombres.completo(m.getSocio().getUsuario()), m.getPlan().getId(), m.getPlan().getNombre(),
                m.getFechaInicio(), m.getFechaFin(), m.getPrecioPagado(), vigente, m.getCreadaEn());
    }
}
