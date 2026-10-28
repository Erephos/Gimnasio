package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Auditoria;

import java.time.OffsetDateTime;

public record AuditoriaResponse(
        Long id, String usuarioCorreo, String accion, String entidad, Long entidadId,
        String detalle, OffsetDateTime fecha
) {
    public static AuditoriaResponse desde(Auditoria a) {
        return new AuditoriaResponse(a.getId(), a.getUsuario() != null ? a.getUsuario().getCorreo() : null,
                a.getAccion(), a.getEntidad(), a.getEntidadId(), a.getDetalle(), a.getFecha());
    }
}
