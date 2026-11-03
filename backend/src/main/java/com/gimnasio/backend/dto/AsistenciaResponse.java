package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Asistencia;
import com.gimnasio.backend.util.Nombres;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record AsistenciaResponse(
        Long id, Long socioId, String socioNombre, String dni, LocalDate fecha,
        OffsetDateTime horaEntrada, LocalDate membresiaVigenteHasta
) {
    public static AsistenciaResponse desde(Asistencia a, LocalDate membresiaVigenteHasta) {
        return new AsistenciaResponse(a.getId(), a.getSocio().getId(), Nombres.completo(a.getSocio().getUsuario()),
                a.getSocio().getDni(), a.getFecha(), a.getHoraEntrada(), membresiaVigenteHasta);
    }
}
