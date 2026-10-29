package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.AsistenciaRequest;
import com.gimnasio.backend.dto.AsistenciaResponse;
import com.gimnasio.backend.entity.Asistencia;
import com.gimnasio.backend.entity.Membresia;
import com.gimnasio.backend.entity.Socio;
import com.gimnasio.backend.repository.AsistenciaRepository;
import com.gimnasio.backend.repository.MembresiaRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import com.gimnasio.backend.util.Fechas;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepository;
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    public AsistenciaService(AsistenciaRepository asistenciaRepository, SocioRepository socioRepository,
                             MembresiaRepository membresiaRepository, UsuarioActual usuarioActual,
                             AuditoriaService auditoria) {
        this.asistenciaRepository = asistenciaRepository;
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioActual = usuarioActual;
        this.auditoria = auditoria;
    }

    @Transactional
    public AsistenciaResponse registrar(AsistenciaRequest req) {
        Socio socio = socioRepository.findByDni(req.dni())
                .orElseThrow(() -> Err.noEncontrado("No existe un socio con ese DNI"));
        if (!socio.getUsuario().getActivo()) {
            throw Err.conflicto("El socio esta inactivo");
        }

        LocalDate hoy = Fechas.hoy();
        Membresia vigente = membresiaRepository.buscarVigentes(socio.getId(), hoy).stream().findFirst()
                .orElseThrow(() -> Err.conflicto("El socio no tiene una membresia vigente"));
        if (asistenciaRepository.existsBySocioIdAndFecha(socio.getId(), hoy)) {
            throw Err.conflicto("El socio ya registro su asistencia hoy");
        }

        Asistencia a = new Asistencia();
        a.setSocio(socio);
        a.setFecha(hoy); // se envia explicito: Hibernate no usa el DEFAULT de la columna
        var actor = usuarioActual.obtener();
        a.setRegistradoPor(actor);
        a = asistenciaRepository.save(a);
        auditoria.registrar(actor, "REGISTRAR", "ASISTENCIA", a.getId(), "Socio " + socio.getId());
        return AsistenciaResponse.desde(a, vigente.getFechaFin());
    }

    @Transactional(readOnly = true)
    public Page<AsistenciaResponse> listarPorFecha(LocalDate fecha, int pagina, int tamanio, String filtro) {
        LocalDate dia = fecha != null ? fecha : Fechas.hoy();
        String consulta = filtro == null || filtro.isBlank() ? "" : filtro.trim();
        return asistenciaRepository.buscarPorFecha(dia, consulta,
                        PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 50)),
                                Sort.by(Sort.Direction.DESC, "horaEntrada")))
                .map(a -> AsistenciaResponse.desde(a, null));
    }

    @Transactional(readOnly = true)
    public Page<AsistenciaResponse> listarPorSocio(Long socioId, int pagina, int tamanio) {
        if (!socioRepository.existsById(socioId)) {
            throw Err.noEncontrado("Socio no encontrado");
        }
        return asistenciaRepository.findBySocioId(socioId,
                PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 50)),
                        Sort.by(Sort.Direction.DESC, "horaEntrada")))
                .map(a -> AsistenciaResponse.desde(a, null));
    }
}
