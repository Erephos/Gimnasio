package com.gimnasio.backend.service;


import com.gimnasio.backend.dto.LoginRequest;
import com.gimnasio.backend.dto.LoginResponse;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest req) {
        Usuario usuario = usuarioRepository.findByCorreo(req.correo())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));
        if (!usuario.getActivo()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        if (!passwordEncoder.matches(req.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        String token = jwtService.generarToken(
                usuario.getId(), usuario.getCorreo(), usuario.getRol().getNombre());

        String nombreCompleto = usuario.getNombre() + " " + usuario.getApellido();
        return LoginResponse.de(token, usuario.getId(), nombreCompleto, usuario.getRol().getNombre());

    }

}
