package com.gimnasio.backend.security;

import com.gimnasio.backend.service.JwtService;
import com.gimnasio.backend.repository.UsuarioRepository;
import com.gimnasio.backend.entity.Usuario;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// SIN @Component: si Spring Boot lo registra como filtro global ademas de en la
// cadena de Security, el SecurityContextHolderFilter borra la autenticacion que
// este filtro guardo. Solo se instancia desde SecurityConfig.
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            Claims claims = jwtService.validarToken((header.substring(7)));

            if (claims != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String correo = claims.getSubject();
                String rolToken = claims.get("rol", String.class);
                if (correo != null && rolToken != null) {
                    usuarioRepository.findByCorreo(correo)
                            .filter(Usuario::getActivo)
                            .filter(usuario -> usuario.getRol().getNombre().equals(rolToken))
                            .ifPresent(usuario -> {
                                var autenticacion = new UsernamePasswordAuthenticationToken(
                                        correo,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + rolToken)));
                                autenticacion.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(autenticacion);
                            });
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
