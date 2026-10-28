package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Socio;

import java.time.OffsetDateTime;

public record SocioResponse(
        Long                id,
        String              nombreCompleto,
        String              correo,
        String              dni,
        String              telefono,
        String              genero,
        String              direccion,
        String              contactoEmergencia,
        boolean             activo,
        OffsetDateTime      creadoEn
) {
    public static SocioResponse desde(Socio socio){
        return new SocioResponse(
                socio.getId(),
                socio.getUsuario().getNombre() + " " + socio.getUsuario().getApellido(),
                socio.getUsuario().getCorreo(),
                socio.getDni(),
                socio.getTelefono(),
                socio.getGenero(),
                socio.getDireccion(),
                socio.getContactoEmergencia(),
                socio.getUsuario().getActivo(),
                socio.getCreadoEn()
        );

    }
}
