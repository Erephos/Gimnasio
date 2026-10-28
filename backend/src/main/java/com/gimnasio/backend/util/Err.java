package com.gimnasio.backend.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Atajos para lanzar errores HTTP con mensaje: throw Err.conflicto("..."); */
public final class Err {
    private Err() {}

    public static ResponseStatusException noEncontrado(String msg) { return new ResponseStatusException(HttpStatus.NOT_FOUND, msg); }
    public static ResponseStatusException conflicto(String msg)    { return new ResponseStatusException(HttpStatus.CONFLICT, msg); }
    public static ResponseStatusException invalido(String msg)     { return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg); }
    public static ResponseStatusException prohibido(String msg)    { return new ResponseStatusException(HttpStatus.FORBIDDEN, msg); }
}
