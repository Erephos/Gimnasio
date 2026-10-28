package com.gimnasio.backend.util;

import com.gimnasio.backend.entity.Usuario;

public final class Nombres {
    private Nombres() {}

    public static String completo(Usuario u) {
        return u == null ? null : u.getNombre() + " " + u.getApellido();
    }
}
