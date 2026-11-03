package com.gimnasio.backend.util;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public final class Fechas {
    public static final ZoneId LIMA = ZoneId.of("America/Lima");

    private Fechas() {}

    public static LocalDate hoy() {
        return LocalDate.now(LIMA);
    }

    public static LocalDate de(OffsetDateTime momento) {
        return momento.atZoneSameInstant(LIMA).toLocalDate();
    }
}
