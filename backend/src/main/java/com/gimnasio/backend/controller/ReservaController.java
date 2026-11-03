package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.ReservaRequest;
import com.gimnasio.backend.dto.ReservaResponse;
import com.gimnasio.backend.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SOCIO', 'ADMINISTRADOR', 'RECEPCIONISTA')")
    public ResponseEntity<ReservaResponse> reservar(@Valid @RequestBody ReservaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.reservar(request));
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('SOCIO')")
    public List<ReservaResponse> mias() {
        return reservaService.mias();
    }

    @GetMapping("/clase/{claseId}")
    @PreAuthorize("hasAnyRole('ENTRENADOR', 'ADMINISTRADOR', 'RECEPCIONISTA')")
    public List<ReservaResponse> porClase(@PathVariable Long claseId) {
        return reservaService.porClase(claseId);
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SOCIO', 'ADMINISTRADOR', 'RECEPCIONISTA')")
    public ReservaResponse cancelar(@PathVariable Long id) {
        return reservaService.cancelar(id);
    }

    @PatchMapping("/{id}/asistencia")
    @PreAuthorize("hasAnyRole('ENTRENADOR', 'ADMINISTRADOR', 'RECEPCIONISTA')")
    public ReservaResponse marcarAsistencia(@PathVariable Long id) {
        return reservaService.marcarAsistencia(id);
    }
}
