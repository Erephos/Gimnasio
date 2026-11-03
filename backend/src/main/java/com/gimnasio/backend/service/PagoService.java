package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.AnularPagoRequest;
import com.gimnasio.backend.dto.PagoRequest;
import com.gimnasio.backend.dto.PagoResponse;
import com.gimnasio.backend.entity.Membresia;
import com.gimnasio.backend.entity.Pago;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.MembresiaRepository;
import com.gimnasio.backend.repository.PagoRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final MembresiaRepository membresiaRepository;
    private final AuditoriaService auditoria;
    private final UsuarioActual usuarioActual;

    public PagoService(PagoRepository pagoRepository, MembresiaRepository membresiaRepository,
                       AuditoriaService auditoria, UsuarioActual usuarioActual) {
        this.pagoRepository = pagoRepository;
        this.membresiaRepository = membresiaRepository;
        this.auditoria = auditoria;
        this.usuarioActual = usuarioActual;
    }

    @Transactional
    public PagoResponse registrar(PagoRequest req) {
        Membresia membresia = membresiaRepository.buscarPorIdParaActualizar(req.membresiaId())
                .orElseThrow(() -> Err.noEncontrado("Membresia no encontrada"));

        BigDecimal pagado = pagoRepository.sumaRegistrados(membresia.getId());
        BigDecimal saldo = membresia.getPrecioPagado().subtract(pagado);
        if (req.monto().compareTo(saldo) > 0) {
            throw Err.conflicto("El monto excede el saldo pendiente de la membresia (S/ " + saldo + ")");
        }

        Usuario quien = usuarioActual.obtener();
        Pago pago = new Pago();
        pago.setSocio(membresia.getSocio());
        pago.setMembresia(membresia);
        pago.setMonto(req.monto());
        pago.setMetodo(req.metodo());
        pago.setRegistradoPor(quien);
        pago = pagoRepository.save(pago);

        auditoria.registrar(quien, "REGISTRAR", "PAGO", pago.getId(),
                "S/ " + req.monto() + " " + req.metodo() + ", membresia " + membresia.getId());
        return PagoResponse.desde(pago);
    }

    @Transactional
    public PagoResponse anular(Long id, AnularPagoRequest req) {
        Pago pago = pagoRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Pago no encontrado"));
        if ("ANULADO".equals(pago.getEstado())) {
            throw Err.conflicto("El pago ya fue anulado");
        }
        Usuario quien = usuarioActual.obtener();
        pago.setEstado("ANULADO");
        pago.setAnuladoPor(quien);
        pago.setAnuladoEn(OffsetDateTime.now());
        pago.setMotivoAnulacion(req.motivo().trim());

        auditoria.registrar(quien, "ANULAR", "PAGO", id, "Motivo: " + req.motivo().trim());
        return PagoResponse.desde(pago);
    }

    @Transactional(readOnly = true)
    public Page<PagoResponse> listar(int pagina, int tamanio, Long socioId, String filtro, String estado) {
        String consulta = filtro == null || filtro.isBlank() ? "" : filtro.trim();
        String estadoFiltro = estado == null || estado.isBlank() ? null : estado.trim().toUpperCase();
        if (estadoFiltro != null && !List.of("REGISTRADO", "ANULADO").contains(estadoFiltro)) {
            throw Err.invalido("El estado debe ser REGISTRADO o ANULADO");
        }
        return pagoRepository.buscar(socioId, consulta, estadoFiltro,
                        PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 50)),
                                Sort.by(Sort.Direction.DESC, "fechaPago")))
                .map(PagoResponse::desde);
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> listarPorMembresia(Long membresiaId) {
        return pagoRepository.findByMembresiaIdOrderByFechaPagoDesc(membresiaId)
                .stream().map(PagoResponse::desde).toList();
    }
}
