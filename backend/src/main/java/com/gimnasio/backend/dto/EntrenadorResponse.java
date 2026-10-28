package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Entrenador;
import com.gimnasio.backend.util.Nombres;

import java.time.OffsetDateTime;

public record EntrenadorResponse(
        Long id, String nombreCompleto, String correo, String dni, String telefono,
        String especialidad, Boolean activo, OffsetDateTime creadoEn
) {
    public static EntrenadorResponse desde(Entrenador e) {
        return new EntrenadorResponse(e.getId(), Nombres.completo(e.getUsuario()), e.getUsuario().getCorreo(),
                e.getDni(), e.getTelefono(), e.getEspecialidad(), e.getUsuario().getActivo(), e.getCreadoEn());
    }
}
