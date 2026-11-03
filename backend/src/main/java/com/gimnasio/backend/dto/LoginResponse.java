package com.gimnasio.backend.dto;

public record LoginResponse(String token, String tokenType, Long usuarioId,
                            String nombre, String rol) {
    public static LoginResponse de(String token, Long usuarioId, String nombre,String rol) {
        return new LoginResponse(token, "Bearer", usuarioId, nombre, rol);
    }
}
