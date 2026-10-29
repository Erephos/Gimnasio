package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Usuario;

import java.time.OffsetDateTime;

public record UsuarioResponse(Long id, String nombre, String apellido, String correo,
                              String rol, Boolean activo, OffsetDateTime creadoEn) {
    public static UsuarioResponse desde(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getApellido(), u.getCorreo(),
                u.getRol().getNombre(), u.getActivo(), u.getCreadoEn());
    }
}
