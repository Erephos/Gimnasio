package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.AnularPagoRequest;
import com.gimnasio.backend.dto.PagoRequest;
import com.gimnasio.backend.dto.PagoResponse;
import com.gimnasio.backend.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public ResponseEntity<PagoResponse> registrar(@Valid @RequestBody PagoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.registrar(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public Page<PagoResponse> listar(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int size,
                                     @RequestParam(required = false) Long socioId,
                                     @RequestParam(required = false) String q,
                                     @RequestParam(required = false) String estado) {
        return pagoService.listar(page, size, socioId, q, estado);
    }

    @GetMapping("/membresia/{membresiaId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public List<PagoResponse> porMembresia(@PathVariable Long membresiaId) {
        return pagoService.listarPorMembresia(membresiaId);
    }

    @PatchMapping("/{id}/anular")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public PagoResponse anular(@PathVariable Long id, @Valid @RequestBody AnularPagoRequest request) {
        return pagoService.anular(id, request);
    }
}
