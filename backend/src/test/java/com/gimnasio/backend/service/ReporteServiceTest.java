package com.gimnasio.backend.service;

import com.gimnasio.backend.repository.AsistenciaRepository;
import com.gimnasio.backend.repository.MembresiaRepository;
import com.gimnasio.backend.repository.PagoRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.util.Fechas;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {
    @Mock PagoRepository pagoRepository;
    @Mock AsistenciaRepository asistenciaRepository;
    @Mock MembresiaRepository membresiaRepository;
    @Mock SocioRepository socioRepository;
    @InjectMocks ReporteService reporteService;

    @Test
    void resumenIncluyeAmbosDiasYCombinaMetricas() {
        LocalDate hasta = Fechas.hoy();
        LocalDate desde = hasta.withDayOfMonth(1);
        when(pagoRepository.sumarRegistradosEntre(any(), any())).thenReturn(new BigDecimal("725.50"));
        when(pagoRepository.countByEstadoAndFechaPagoGreaterThanEqualAndFechaPagoLessThan(anyString(), any(), any()))
                .thenReturn(8L);
        when(asistenciaRepository.countByFechaBetween(desde, hasta)).thenReturn(42L);
        when(membresiaRepository.contarVigentes(hasta)).thenReturn(16L);
        when(membresiaRepository.contarVencidas(hasta)).thenReturn(5L);
        when(socioRepository.contarNuevos(any(), any())).thenReturn(3L);

        var reporte = reporteService.resumen(desde, hasta);

        assertEquals(desde, reporte.desde());
        assertEquals(hasta, reporte.hasta());
        assertEquals(new BigDecimal("725.50"), reporte.ingresosRegistrados());
        assertEquals(8, reporte.pagosRegistrados());
        assertEquals(42, reporte.asistencias());
        assertEquals(16, reporte.membresiasVigentes());
        assertEquals(5, reporte.membresiasVencidas());
        assertEquals(3, reporte.sociosNuevos());
        verify(pagoRepository).sumarRegistradosEntre(any(), any());
    }

    @Test
    void rechazaRangoInvertido() {
        assertThrows(ResponseStatusException.class, () -> reporteService.resumen(
                LocalDate.of(2026, 10, 20), LocalDate.of(2026, 10, 1)));
        verifyNoInteractions(pagoRepository, asistenciaRepository, membresiaRepository, socioRepository);
    }
}
