package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.EntrenadorRequest;
import com.gimnasio.backend.dto.EntrenadorResponse;
import com.gimnasio.backend.service.EntrenadorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/entrenadores")
public class EntrenadorController {

    private final EntrenadorService entrenadorService;

    public EntrenadorController(EntrenadorService entrenadorService) {
        this.entrenadorService = entrenadorService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EntrenadorResponse> crear(@Valid @RequestBody EntrenadorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entrenadorService.crear(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'RECEPCIONISTA')")
    public Page<EntrenadorResponse> listar(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return entrenadorService.listar(page, Math.min(size, 50));
    }
}
