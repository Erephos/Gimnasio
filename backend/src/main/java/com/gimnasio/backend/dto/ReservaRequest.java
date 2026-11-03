package com.gimnasio.backend.dto;

import jakarta.validation.constraints.NotNull;

/** socioId solo lo usa el personal (admin/recepcion); un SOCIO siempre reserva para si mismo. */
public record ReservaRequest(@NotNull Long claseId, Long socioId) {}
