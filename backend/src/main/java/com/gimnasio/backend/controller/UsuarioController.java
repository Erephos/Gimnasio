package com.gimnasio.backend.controller;

import com.gimnasio.backend.dto.CambioPasswordRequest;
import com.gimnasio.backend.dto.CambioRolRequest;
import com.gimnasio.backend.dto.UsuarioPersonalRequest;
import com.gimnasio.backend.dto.UsuarioResponse;
import com.gimnasio.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> crearPersonal(@Valid @RequestBody UsuarioPersonalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crearPersonal(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public Page<UsuarioResponse> listar(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(required = false) String rol) {
        return usuarioService.listar(page, size, rol);
    }

    @PatchMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public UsuarioResponse cambiarRol(@PathVariable Long id, @Valid @RequestBody CambioRolRequest request) {
        return usuarioService.cambiarRol(id, request);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public UsuarioResponse cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        return usuarioService.cambiarEstado(id, activo);
    }

    /** Cualquier usuario autenticado cambia su propia contrasena. */
    @PatchMapping("/mi-password")
    public Map<String, String> cambiarPassword(@Valid @RequestBody CambioPasswordRequest request) {
        usuarioService.cambiarPassword(request);
        return Map.of("mensaje", "Contrasena actualizada correctamente");
    }
}
