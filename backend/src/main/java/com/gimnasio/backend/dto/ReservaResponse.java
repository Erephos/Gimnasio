package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Reserva;
import com.gimnasio.backend.util.Nombres;

import java.time.OffsetDateTime;

public record ReservaResponse(
        Long id, Long claseId, String disciplina, OffsetDateTime inicio, OffsetDateTime fin,
        Long socioId, String socioNombre, String estado, OffsetDateTime asistioEn, OffsetDateTime creadaEn
) {
    public static ReservaResponse desde(Reserva r) {
        return new ReservaResponse(r.getId(), r.getClase().getId(), r.getClase().getDisciplina(),
                r.getClase().getInicio(), r.getClase().getFin(), r.getSocio().getId(),
                Nombres.completo(r.getSocio().getUsuario()), r.getEstado(), r.getAsistioEn(), r.getCreadaEn());
    }
}
