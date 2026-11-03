package com.gimnasio.backend.dto;

import jakarta.validation.constraints.*;

public record EntrenadorRequest(
        @NotBlank @Size(max = 60) String nombre,
        @NotBlank @Size(max = 60) String apellido,
        @NotBlank @Email @Size(max = 100) String correo,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Pattern(regexp = "^[0-9]{8}$", message = "El DNI debe tener exactamente 8 digitos") String dni,
        @Pattern(regexp = "^[0-9]{9}$", message = "El telefono debe tener exactamente 9 digitos") String telefono,
        @NotBlank @Size(max = 50) String especialidad
) {}
