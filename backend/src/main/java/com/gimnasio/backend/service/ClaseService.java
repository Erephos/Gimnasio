package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.ClaseRequest;
import com.gimnasio.backend.dto.ClaseResponse;
import com.gimnasio.backend.entity.Clase;
import com.gimnasio.backend.entity.Entrenador;
import com.gimnasio.backend.repository.ClaseRepository;
import com.gimnasio.backend.repository.EntrenadorRepository;
import com.gimnasio.backend.repository.ReservaRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ClaseService {

    private final ClaseRepository claseRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final ReservaRepository reservaRepository;
    private final AuditoriaService auditoria;
    private final UsuarioActual usuarioActual;

    public ClaseService(ClaseRepository claseRepository, EntrenadorRepository entrenadorRepository,
                        ReservaRepository reservaRepository, AuditoriaService auditoria,
                        UsuarioActual usuarioActual) {
        this.claseRepository = claseRepository;
        this.entrenadorRepository = entrenadorRepository;
        this.reservaRepository = reservaRepository;
        this.auditoria = auditoria;
        this.usuarioActual = usuarioActual;
    }

    @Transactional
    public ClaseResponse crear(ClaseRequest req) {
        Entrenador entrenador = entrenadorRepository.findById(req.entrenadorId())
                .orElseThrow(() -> Err.noEncontrado("Entrenador no encontrado"));
        if (!entrenador.getUsuario().getActivo()) {
            throw Err.conflicto("El entrenador esta inactivo");
        }
        if (!req.fin().isAfter(req.inicio())) {
            throw Err.invalido("La hora de fin debe ser posterior a la de inicio");
        }
        if (!req.inicio().isAfter(OffsetDateTime.now())) {
            throw Err.invalido("La clase debe empezar en el futuro");
        }
        if (claseRepository.existeSolapeEntrenador(entrenador.getId(), req.inicio(), req.fin())) {
            throw Err.conflicto("El entrenador ya tiene otra clase en ese horario");
        }
        String aula = req.aula().trim();
        if (claseRepository.existeSolapeAula(aula, req.inicio(), req.fin())) {
            throw Err.conflicto("El aula ya esta ocupada en ese horario");
        }

        Clase c = new Clase();
        c.setDisciplina(req.disciplina().trim());
        c.setEntrenador(entrenador);
        c.setAula(aula);
        c.setInicio(req.inicio());
        c.setFin(req.fin());
        c.setAforo(req.aforo());
        c = claseRepository.save(c);

        auditoria.registrar(usuarioActual.obtener(), "CREAR", "CLASE", c.getId(),
                c.getDisciplina() + " en " + aula + " " + c.getInicio());
        return ClaseResponse.desde(c, 0);
    }

    /** Clases activas que aun no terminan, con sus cupos disponibles. */
    @Transactional(readOnly = true)
    public List<ClaseResponse> listarProximas() {
        return claseRepository.findByActivaTrueAndFinAfterOrderByInicioAsc(OffsetDateTime.now()).stream()
                .map(c -> ClaseResponse.desde(c, reservaRepository.countByClaseIdAndEstado(c.getId(), "RESERVADA")))
                .toList();
    }

    @Transactional
    public ClaseResponse cancelar(Long id) {
        Clase c = claseRepository.buscarConBloqueo(id).orElseThrow(() -> Err.noEncontrado("Clase no encontrada"));
        if (!c.getActiva()) {
            throw Err.conflicto("La clase ya esta cancelada");
        }
        c.setActiva(false);
        int canceladas = reservaRepository.cancelarPorClase(id);
        auditoria.registrar(usuarioActual.obtener(), "CANCELAR", "CLASE", id, canceladas + " reservas canceladas");
        return ClaseResponse.desde(c, 0);
    }
}
