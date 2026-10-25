package com.gimnasio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.SQLInsert;

public record SocioRegistroRequest(
        @NotBlank @Size(max = 60) String nombre,
        @NotBlank @Size(max = 60) String apellido,
        @NotBlank @Email @Size(max = 100) String correo,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Pattern(regexp = "^[0-9]{8}$", message = "El DNI debe tener exactamente 8 digitos, jadjadj, obviamente pes") String dni,
        @Pattern(regexp = "^[0-9]{9}$", message = "El telefono debe tener exactamente 9 digitos pes, estas en Peruquistan") String telefono,
        @NotBlank @Pattern(regexp = "^(MASCULINO|FEMENINO)$", message = "El genero debe ser MASCULINO o FEMENINO") String genero,
        @Size(max = 150) String direccion,
        @Size(max = 100) String contactoEmergencia
) {}
