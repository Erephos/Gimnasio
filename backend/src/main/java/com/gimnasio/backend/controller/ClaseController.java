package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.ClaseRequest;
import com.gimnasio.backend.dto.ClaseResponse;
import com.gimnasio.backend.service.ClaseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clases")
public class ClaseController {

    private final ClaseService claseService;

    public ClaseController(ClaseService claseService) {
        this.claseService = claseService;
    }

    /** Horario de clases proximas con cupos: cualquier usuario autenticado. */
    @GetMapping
    public List<ClaseResponse> proximas() {
        return claseService.listarProximas();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClaseResponse> crear(@Valid @RequestBody ClaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claseService.crear(request));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ClaseResponse cancelar(@PathVariable Long id) {
        return claseService.cancelar(id);
    }
}
