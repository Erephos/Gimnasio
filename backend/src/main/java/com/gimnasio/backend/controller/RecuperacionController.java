package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.RecuperarRequest;
import com.gimnasio.backend.dto.RestablecerRequest;
import com.gimnasio.backend.service.RecuperacionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Rutas publicas (/api/auth/** ya esta en permitAll en SecurityConfig). */
@RestController
@RequestMapping("/api/auth")
public class RecuperacionController {

    private final RecuperacionService recuperacionService;

    public RecuperacionController(RecuperacionService recuperacionService) {
        this.recuperacionService = recuperacionService;
    }

    @PostMapping("/recuperar")
    public ResponseEntity<Map<String, String>> recuperar(@Valid @RequestBody RecuperarRequest request) {
        recuperacionService.solicitar(request.correo());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("mensaje", "Si el correo esta registrado, recibiras las instrucciones"));
    }

    @PostMapping("/restablecer")
    public Map<String, String> restablecer(@Valid @RequestBody RestablecerRequest request) {
        recuperacionService.restablecer(request);
        return Map.of("mensaje", "Contrasena actualizada correctamente");
    }
}
