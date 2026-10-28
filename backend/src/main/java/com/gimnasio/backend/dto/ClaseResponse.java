package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Clase;
import com.gimnasio.backend.util.Nombres;

import java.time.OffsetDateTime;

public record ClaseResponse(
        Long id, String disciplina, Long entrenadorId, String entrenadorNombre, String aula,
        OffsetDateTime inicio, OffsetDateTime fin, Integer aforo, long reservasActivas,
        long cuposDisponibles, Boolean activa
) {
    public static ClaseResponse desde(Clase c, long reservasActivas) {
        return new ClaseResponse(c.getId(), c.getDisciplina(), c.getEntrenador().getId(),
                Nombres.completo(c.getEntrenador().getUsuario()), c.getAula(), c.getInicio(), c.getFin(),
                c.getAforo(), reservasActivas, Math.max(0, c.getAforo() - reservasActivas), c.getActiva());
    }
}
