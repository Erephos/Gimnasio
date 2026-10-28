package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.SocioRegistroRequest;
import com.gimnasio.backend.dto.SocioResponse;
import com.gimnasio.backend.dto.SocioActualizacionRequest;
import com.gimnasio.backend.service.SocioService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/socios")
public class SocioController {

    private final SocioService socioService;

    public SocioController(SocioService socioService) {
        this.socioService = socioService;
    }

    @PostMapping
    public ResponseEntity<SocioResponse> registrar(@Valid @RequestBody SocioRegistroRequest request) {
        SocioResponse creado = socioService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public Page<SocioResponse> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean activo) {
        return socioService.listar(page, size, q, activo);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA', 'SOCIO')")
    public SocioResponse obtener(@PathVariable Long id) {
        return socioService.obtener(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA', 'SOCIO')")
    public SocioResponse actualizar(@PathVariable Long id, @Valid @RequestBody SocioActualizacionRequest request) {
        return socioService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        socioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
