package com.gimnasio.backend.dto;

import com.gimnasio.backend.entity.Pago;
import com.gimnasio.backend.util.Nombres;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PagoResponse(
        Long id, Long socioId, String socioNombre, Long membresiaId, BigDecimal monto, String metodo,
        String estado, OffsetDateTime fechaPago, String registradoPor,
        String anuladoPor, OffsetDateTime anuladoEn, String motivoAnulacion
) {
    public static PagoResponse desde(Pago p) {
        return new PagoResponse(p.getId(), p.getSocio().getId(), Nombres.completo(p.getSocio().getUsuario()),
                p.getMembresia().getId(), p.getMonto(), p.getMetodo(), p.getEstado(), p.getFechaPago(),
                Nombres.completo(p.getRegistradoPor()), Nombres.completo(p.getAnuladoPor()),
                p.getAnuladoEn(), p.getMotivoAnulacion());
    }
}
