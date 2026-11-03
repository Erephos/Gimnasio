package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Plan;

import java.math.BigDecimal;

public record PlanResponse(Long id, String nombre, BigDecimal precio, Integer duracionDias, Boolean activo) {
    public static PlanResponse desde(Plan p) {
        return new PlanResponse(p.getId(), p.getNombre(), p.getPrecio(), p.getDuracionDias(), p.getActivo());
    }
}
