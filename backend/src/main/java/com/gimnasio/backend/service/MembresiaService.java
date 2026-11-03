package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.MembresiaRequest;
import com.gimnasio.backend.dto.MembresiaResponse;
import com.gimnasio.backend.dto.MembresiaAlertaResponse;
import com.gimnasio.backend.entity.Membresia;
import com.gimnasio.backend.entity.Plan;
import com.gimnasio.backend.entity.Socio;
import com.gimnasio.backend.repository.MembresiaRepository;
import com.gimnasio.backend.repository.PlanRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import com.gimnasio.backend.util.Fechas;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.time.temporal.ChronoUnit;

/**
 * Regla de fechas: fecha_fin = fecha_inicio + duracion_dias y es EXCLUSIVA.
 * Un plan de 30 dias que empieza el 1/nov cubre del 1 al 30/nov y vence el 1/dic.
 */
@Service
public class MembresiaService {

    private final MembresiaRepository membresiaRepository;
    private final SocioRepository socioRepository;
    private final PlanRepository planRepository;
    private final AuditoriaService auditoria;
    private final UsuarioActual usuarioActual;

    public MembresiaService(MembresiaRepository membresiaRepository, SocioRepository socioRepository,
                            PlanRepository planRepository, AuditoriaService auditoria,
                            UsuarioActual usuarioActual) {
        this.membresiaRepository = membresiaRepository;
        this.socioRepository = socioRepository;
        this.planRepository = planRepository;
        this.auditoria = auditoria;
        this.usuarioActual = usuarioActual;
    }

    @Transactional
    public MembresiaResponse crear(MembresiaRequest req) {
        Socio socio = socioRepository.buscarPorIdParaActualizar(req.socioId())
                .orElseThrow(() -> Err.noEncontrado("Socio no encontrado"));
        Plan plan = planRepository.findById(req.planId())
                .orElseThrow(() -> Err.noEncontrado("Plan no encontrado"));
        if (!plan.getActivo()) {
            throw Err.conflicto("El plan seleccionado no esta activo");
        }
        if (!socio.getUsuario().getActivo()) {
            throw Err.conflicto("El socio esta inactivo");
        }

        LocalDate inicio = req.fechaInicio() != null ? req.fechaInicio() : Fechas.hoy();
        if (inicio.isBefore(Fechas.hoy())) {
            throw Err.invalido("La fecha de inicio no puede ser anterior a hoy");
        }
        LocalDate fin = inicio.plusDays(plan.getDuracionDias());

        if (membresiaRepository.existeSolape(socio.getId(), inicio, fin)) {
            throw Err.conflicto("El socio ya tiene una membresia que cubre parte de ese periodo");
        }

        Membresia m = new Membresia();
        m.setSocio(socio);
        m.setPlan(plan);
        m.setFechaInicio(inicio);
        m.setFechaFin(fin);
        m.setPrecioPagado(plan.getPrecio()); // se congela el precio de hoy
        m = membresiaRepository.save(m);

        auditoria.registrar(usuarioActual.obtener(), "CREAR", "MEMBRESIA", m.getId(),
                "Socio DNI " + socio.getDni() + ", plan " + plan.getNombre() + ", " + inicio + " a " + fin);
        return MembresiaResponse.desde(m);
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponse> listarPorSocio(Long socioId) {
        if (!socioRepository.existsById(socioId)) {
            throw Err.noEncontrado("Socio no encontrado");
        }
        return membresiaRepository.findBySocioIdOrderByFechaInicioDesc(socioId)
                .stream().map(MembresiaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public MembresiaResponse vigenteDe(Long socioId) {
        return membresiaRepository.buscarVigentes(socioId, Fechas.hoy()).stream().findFirst()
                .map(MembresiaResponse::desde)
                .orElseThrow(() -> Err.noEncontrado("El socio no tiene una membresia vigente"));
    }

    @Transactional(readOnly = true)
    public MembresiaResponse miVigente() {
        Socio socio = socioRepository.findByUsuarioId(usuarioActual.obtener().getId())
                .orElseThrow(() -> Err.noEncontrado("Perfil de socio no encontrado"));
        return vigenteDe(socio.getId());
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponse> misMembresias() {
        Socio socio = socioRepository.findByUsuarioId(usuarioActual.obtener().getId())
                .orElseThrow(() -> Err.noEncontrado("Perfil de socio no encontrado"));
        return listarPorSocio(socio.getId());
    }

    @Transactional(readOnly = true)
    public List<MembresiaAlertaResponse> alertas(int dias) {
        if (dias < 0 || dias > 90) throw Err.invalido("El rango de alerta debe estar entre 0 y 90 dias");
        LocalDate hoy = Fechas.hoy();
        return membresiaRepository.buscarParaAlerta(hoy.minusDays(30), hoy.plusDays(dias))
                .stream().map(m -> {
                    long restantes = ChronoUnit.DAYS.between(hoy, m.getFechaFin());
                    String estado = restantes <= 0 ? "VENCIDA" : "POR_VENCER";
                    return new MembresiaAlertaResponse(m.getId(), m.getSocio().getId(),
                            com.gimnasio.backend.util.Nombres.completo(m.getSocio().getUsuario()),
                            m.getSocio().getUsuario().getCorreo(), m.getSocio().getDni(),
                            m.getPlan().getNombre(), m.getFechaFin(), restantes, estado);
                }).toList();
    }
}
