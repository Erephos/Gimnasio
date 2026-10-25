package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.SocioRegistroRequest;
import com.gimnasio.backend.dto.SocioResponse;
import com.gimnasio.backend.service.SocioService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public Page<SocioResponse> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return socioService.listar(page, Math.min(size, 50));
    }

}
