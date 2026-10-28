package com.gimnasio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SocioActualizacionRequest(
        @Email @Size(max = 100) String correo,
        @Pattern(regexp = "^[0-9]{9}$", message = "El telefono debe tener exactamente 9 digitos") String telefono,
        @Size(max = 150) String direccion,
        @Size(max = 100) String contactoEmergencia,
        @Pattern(regexp = "^[0-9]{8}$", message = "El DNI debe tener exactamente 8 digitos") String dni
) {}
