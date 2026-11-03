package com.gimnasio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Alta de cuentas del personal. Socios y entrenadores tienen sus propios endpoints. */
public record UsuarioPersonalRequest(
        @NotBlank @Size(max = 60) String nombre,
        @NotBlank @Size(max = 60) String apellido,
        @NotBlank @Email @Size(max = 100) String correo,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Pattern(regexp = "^(ADMINISTRADOR|RECEPCIONISTA)$",
                message = "El rol debe ser ADMINISTRADOR o RECEPCIONISTA") String rol
) {}
