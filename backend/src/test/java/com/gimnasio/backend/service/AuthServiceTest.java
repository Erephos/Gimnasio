package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.LoginRequest;
import com.gimnasio.backend.entity.Rol;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UsuarioRepository usuarioRepository;
    @Mock AuditoriaService auditoria;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService = new JwtService(
            "test-only-key-with-at-least-256-bits-0123456789", 60_000);
    private AuthService authService;

    @BeforeEach
    void configurar() {
        authService = new AuthService(usuarioRepository, passwordEncoder, jwtService, auditoria);
    }

    @Test
    void loginNormalizaCorreoValidaHashYEmiteToken() {
        Usuario usuario = new Usuario();
        usuario.setId(17L);
        usuario.setNombre("Socio");
        usuario.setApellido("Demo");
        usuario.setCorreo("socio.demo@example.test");
        usuario.setPasswordHash(passwordEncoder.encode("ClaveDemo2026!"));
        usuario.setActivo(true);
        Rol rol = new Rol();
        rol.setNombre("SOCIO");
        usuario.setRol(rol);
        when(usuarioRepository.findByCorreo("socio.demo@example.test")).thenReturn(Optional.of(usuario));

        var respuesta = authService.login(new LoginRequest("  SOCIO.DEMO@EXAMPLE.TEST ", "ClaveDemo2026!"));

        assertEquals("Bearer", respuesta.tokenType());
        assertEquals(17L, respuesta.usuarioId());
        assertEquals("Socio Demo", respuesta.nombre());
        assertEquals("SOCIO", respuesta.rol());
        assertNotNull(jwtService.validarToken(respuesta.token()));
        verify(auditoria).registrar(usuario, "INICIAR_SESION", "USUARIO", 17L, "Inicio de sesion exitoso");
    }

    @Test
    void loginRechazaCuentaInactiva() {
        Usuario usuario = new Usuario();
        usuario.setCorreo("socio.demo@example.test");
        usuario.setActivo(false);
        when(usuarioRepository.findByCorreo("socio.demo@example.test")).thenReturn(Optional.of(usuario));

        assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("socio.demo@example.test", "ClaveDemo2026!")));
        verifyNoInteractions(auditoria);
    }
}
