package com.gimnasio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AsistenciaRequest(
        @NotBlank @Pattern(regexp = "^[0-9]{8}$", message = "El DNI debe tener exactamente 8 digitos") String dni
) {}
