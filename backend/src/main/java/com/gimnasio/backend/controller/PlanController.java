package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.PlanRequest;
import com.gimnasio.backend.dto.PlanResponse;
import com.gimnasio.backend.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planes")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    /** Planes activos: cualquier usuario autenticado. */
    @GetMapping
    public List<PlanResponse> listarActivos() {
        return planService.listar(true);
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<PlanResponse> listarTodos() {
        return planService.listar(false);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PlanResponse> crear(@Valid @RequestBody PlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public PlanResponse actualizar(@PathVariable Long id, @Valid @RequestBody PlanRequest request) {
        return planService.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public PlanResponse cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        return planService.cambiarEstado(id, activo);
    }
}
