package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.AsistenciaRequest;
import com.gimnasio.backend.dto.AsistenciaResponse;
import com.gimnasio.backend.service.AsistenciaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/asistencias")
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService) {
        this.asistenciaService = asistenciaService;
    }

    @PostMapping
    public ResponseEntity<AsistenciaResponse> registrar(@Valid @RequestBody AsistenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(asistenciaService.registrar(request));
    }

    /** ?fecha=2026-11-03 (si se omite, hoy en hora de Lima) */
    @GetMapping
    public Page<AsistenciaResponse> listarPorFecha(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return asistenciaService.listarPorFecha(fecha, page, size, q);
    }

    @GetMapping("/socio/{socioId}")
    public Page<AsistenciaResponse> listarPorSocio(@PathVariable Long socioId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        return asistenciaService.listarPorSocio(socioId, page, size);
    }
}
