package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.ReporteResumenResponse;
import com.gimnasio.backend.repository.AsistenciaRepository;
import com.gimnasio.backend.repository.MembresiaRepository;
import com.gimnasio.backend.repository.PagoRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.util.Err;
import com.gimnasio.backend.util.Fechas;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class ReporteService {
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final MembresiaRepository membresiaRepository;
    private final SocioRepository socioRepository;

    public ReporteService(PagoRepository pagoRepository, AsistenciaRepository asistenciaRepository,
                          MembresiaRepository membresiaRepository, SocioRepository socioRepository) {
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.membresiaRepository = membresiaRepository;
        this.socioRepository = socioRepository;
    }

    @Transactional(readOnly = true)
    public ReporteResumenResponse resumen(LocalDate desde, LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : Fechas.hoy().withDayOfMonth(1);
        LocalDate fin = hasta != null ? hasta : Fechas.hoy();
        if (inicio.isAfter(fin)) throw Err.invalido("La fecha desde no puede ser posterior a hasta");
        if (fin.isAfter(Fechas.hoy())) throw Err.invalido("La fecha hasta no puede estar en el futuro");
        var inicioUtc = inicio.atStartOfDay(Fechas.LIMA).toOffsetDateTime();
        var finUtcExclusivo = fin.plusDays(1).atStartOfDay(Fechas.LIMA).toOffsetDateTime();
        return new ReporteResumenResponse(inicio, fin,
                pagoRepository.sumarRegistradosEntre(inicioUtc, finUtcExclusivo),
                pagoRepository.countByEstadoAndFechaPagoGreaterThanEqualAndFechaPagoLessThan(
                        "REGISTRADO", inicioUtc, finUtcExclusivo),
                asistenciaRepository.countByFechaBetween(inicio, fin),
                membresiaRepository.contarVigentes(fin),
                membresiaRepository.contarVencidas(fin),
                socioRepository.contarNuevos(inicioUtc, finUtcExclusivo));
    }
}
