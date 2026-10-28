package com.gimnasio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RestablecerRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 100) String nuevaPassword
) {}
