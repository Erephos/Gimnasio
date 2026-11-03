package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.AuditoriaResponse;
import com.gimnasio.backend.service.AuditoriaService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public Page<AuditoriaResponse> listar(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return auditoriaService.listar(page, Math.min(size, 100));
    }
}
