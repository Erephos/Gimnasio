package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.ReservaRequest;
import com.gimnasio.backend.dto.ReservaResponse;
import com.gimnasio.backend.entity.Clase;
import com.gimnasio.backend.entity.Reserva;
import com.gimnasio.backend.entity.Socio;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.ClaseRepository;
import com.gimnasio.backend.repository.MembresiaRepository;
import com.gimnasio.backend.repository.ReservaRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import com.gimnasio.backend.util.Fechas;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ReservaService {

    private static final String RESERVADA = "RESERVADA";
    private static final String CANCELADA = "CANCELADA";

    private final ReservaRepository reservaRepository;
    private final ClaseRepository claseRepository;
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    public ReservaService(ReservaRepository reservaRepository, ClaseRepository claseRepository,
                          SocioRepository socioRepository, MembresiaRepository membresiaRepository,
                          UsuarioActual usuarioActual, AuditoriaService auditoria) {
        this.reservaRepository = reservaRepository;
        this.claseRepository = claseRepository;
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioActual = usuarioActual;
        this.auditoria = auditoria;
    }

    @Transactional
    public ReservaResponse reservar(ReservaRequest req) {
        Usuario usuario = usuarioActual.obtener();
        Socio socio = resolverSocio(usuario, req.socioId());

        // Bloqueo de fila: serializa las reservas de una misma clase para respetar el aforo
        Clase clase = claseRepository.buscarConBloqueo(req.claseId())
                .orElseThrow(() -> Err.noEncontrado("Clase no encontrada"));

        if (!clase.getActiva()) {
            throw Err.conflicto("La clase esta cancelada");
        }
        if (!clase.getInicio().isAfter(OffsetDateTime.now())) {
            throw Err.conflicto("La clase ya comenzo");
        }
        if (reservaRepository.existsByClaseIdAndSocioIdAndEstado(clase.getId(), socio.getId(), RESERVADA)) {
            throw Err.conflicto("El socio ya tiene una reserva en esta clase");
        }
        if (!membresiaRepository.existeVigente(socio.getId(), Fechas.de(clase.getInicio()))) {
            throw Err.conflicto("El socio no tiene membresia vigente en la fecha de la clase");
        }
        if (reservaRepository.countByClaseIdAndEstado(clase.getId(), RESERVADA) >= clase.getAforo()) {
            throw Err.conflicto("La clase esta llena");
        }

        Reserva r = new Reserva();
        r.setClase(clase);
        r.setSocio(socio);
        r = reservaRepository.save(r);
        auditoria.registrar(usuario, "RESERVAR", "RESERVA", r.getId(), "Clase " + clase.getId() + ", socio " + socio.getId());
        return ReservaResponse.desde(r);
    }

    @Transactional
    public ReservaResponse cancelar(Long id) {
        Usuario usuario = usuarioActual.obtener();
        Reserva r = reservaRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Reserva no encontrada"));

        if (usuarioActual.tieneRol(usuario, "SOCIO")
                && !r.getSocio().getUsuario().getId().equals(usuario.getId())) {
            throw Err.prohibido("No puedes cancelar la reserva de otro socio");
        }
        if (!RESERVADA.equals(r.getEstado())) {
            throw Err.conflicto("La reserva ya esta cancelada");
        }
        if (!r.getClase().getInicio().isAfter(OffsetDateTime.now())) {
            throw Err.conflicto("No se puede cancelar una clase que ya comenzo");
        }
        r.setEstado(CANCELADA);
        auditoria.registrar(usuario, "CANCELAR", "RESERVA", id, "Reserva cancelada");
        return ReservaResponse.desde(r);
    }

    @Transactional
    public ReservaResponse marcarAsistencia(Long id) {
        Usuario usuario = usuarioActual.obtener();
        Reserva r = reservaRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Reserva no encontrada"));
        verificarEntrenador(usuario, r.getClase());

        if (!RESERVADA.equals(r.getEstado())) {
            throw Err.conflicto("No se puede marcar asistencia en una reserva cancelada");
        }
        if (r.getAsistioEn() != null) {
            throw Err.conflicto("La asistencia ya fue marcada");
        }
        r.setAsistioEn(OffsetDateTime.now());
        auditoria.registrar(usuario, "ASISTENCIA", "RESERVA", id, "Asistencia a clase registrada");
        return ReservaResponse.desde(r);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> mias() {
        Socio socio = socioRepository.findByUsuarioId(usuarioActual.obtener().getId())
                .orElseThrow(() -> Err.noEncontrado("Perfil de socio no encontrado"));
        return reservaRepository.findBySocioIdOrderByClaseInicioDesc(socio.getId())
                .stream().map(ReservaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> porClase(Long claseId) {
        Clase clase = claseRepository.findById(claseId).orElseThrow(() -> Err.noEncontrado("Clase no encontrada"));
        verificarEntrenador(usuarioActual.obtener(), clase);
        return reservaRepository.findByClaseIdAndEstado(claseId, RESERVADA)
                .stream().map(ReservaResponse::desde).toList();
    }

    private Socio resolverSocio(Usuario usuario, Long socioId) {
        if (usuarioActual.tieneRol(usuario, "SOCIO")) {
            return socioRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> Err.noEncontrado("Perfil de socio no encontrado"));
        }
        if (socioId == null) {
            throw Err.invalido("Debe indicar el socioId");
        }
        return socioRepository.findById(socioId).orElseThrow(() -> Err.noEncontrado("Socio no encontrado"));
    }

    /** Un ENTRENADOR solo gestiona sus propias clases; admin y recepcion no tienen esa restriccion. */
    private void verificarEntrenador(Usuario usuario, Clase clase) {
        if (usuarioActual.tieneRol(usuario, "ENTRENADOR")
                && !clase.getEntrenador().getUsuario().getId().equals(usuario.getId())) {
            throw Err.prohibido("Esta clase pertenece a otro entrenador");
        }
    }
}
