package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.AuditoriaResponse;
import com.gimnasio.backend.entity.Auditoria;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.AuditoriaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    /** Se une a la transaccion del que la llama: si la operacion falla, la auditoria tambien se revierte. */
    @Transactional
    public void registrar(Usuario usuario, String accion, String entidad, Long entidadId, String detalle) {
        Auditoria a = new Auditoria();
        a.setUsuario(usuario);
        a.setAccion(accion);
        a.setEntidad(entidad);
        a.setEntidadId(entidadId);
        a.setDetalle(detalle != null && detalle.length() > 500 ? detalle.substring(0, 500) : detalle);
        auditoriaRepository.save(a);
    }

    @Transactional(readOnly = true)
    public Page<AuditoriaResponse> listar(int pagina, int tamanio) {
        return auditoriaRepository.findAllByOrderByFechaDesc(
                        PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 100))))
                .map(AuditoriaResponse::desde);
    }
}
