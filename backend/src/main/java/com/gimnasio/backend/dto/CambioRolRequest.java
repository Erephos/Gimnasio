package com.gimnasio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CambioRolRequest(
        @NotBlank @Pattern(regexp = "^(ADMINISTRADOR|RECEPCIONISTA)$",
                message = "El rol debe ser ADMINISTRADOR o RECEPCIONISTA") String rol
) {}
