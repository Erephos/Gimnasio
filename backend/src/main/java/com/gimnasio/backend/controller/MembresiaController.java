package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.MembresiaRequest;
import com.gimnasio.backend.dto.MembresiaResponse;
import com.gimnasio.backend.dto.MembresiaAlertaResponse;
import com.gimnasio.backend.service.MembresiaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membresias")
public class MembresiaController {

    private final MembresiaService membresiaService;

    public MembresiaController(MembresiaService membresiaService) {
        this.membresiaService = membresiaService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public ResponseEntity<MembresiaResponse> crear(@Valid @RequestBody MembresiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membresiaService.crear(request));
    }

    @GetMapping("/socio/{socioId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public List<MembresiaResponse> listarPorSocio(@PathVariable Long socioId) {
        return membresiaService.listarPorSocio(socioId);
    }

    @GetMapping("/socio/{socioId}/vigente")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public MembresiaResponse vigenteDe(@PathVariable Long socioId) {
        return membresiaService.vigenteDe(socioId);
    }

    /** Membresia vigente del socio que tiene la sesion iniciada. */
    @GetMapping("/mia/vigente")
    @PreAuthorize("hasRole('SOCIO')")
    public MembresiaResponse miVigente() {
        return membresiaService.miVigente();
    }

    @GetMapping("/mia")
    @PreAuthorize("hasRole('SOCIO')")
    public List<MembresiaResponse> misMembresias() {
        return membresiaService.misMembresias();
    }

    @GetMapping("/alertas")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public List<MembresiaAlertaResponse> alertas(@RequestParam(defaultValue = "7") int dias) {
        return membresiaService.alertas(dias);
    }
}
