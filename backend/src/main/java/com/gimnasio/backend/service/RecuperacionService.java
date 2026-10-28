package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.RestablecerRequest;
import com.gimnasio.backend.entity.RecuperacionToken;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.RecuperacionTokenRepository;
import com.gimnasio.backend.repository.UsuarioRepository;
import com.gimnasio.backend.util.Err;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RecuperacionService {

    private static final Logger log = LoggerFactory.getLogger(RecuperacionService.class);
    private static final int MINUTOS_VALIDEZ = 30;

    private final UsuarioRepository usuarioRepository;
    private final RecuperacionTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoria;
    private final CorreoService correoService;
    private final boolean correoConfigurado;
    private final SecureRandom random = new SecureRandom();

    public RecuperacionService(UsuarioRepository usuarioRepository, RecuperacionTokenRepository tokenRepository,
                               PasswordEncoder passwordEncoder, AuditoriaService auditoria,
                               CorreoService correoService,
                               @Value("${app.mail.enabled:false}") boolean correoConfigurado) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoria = auditoria;
        this.correoService = correoService;
        this.correoConfigurado = correoConfigurado;
    }

    /** Siempre termina igual exista o no el correo, para no revelar que correos estan registrados. */
    @Transactional
    public void solicitar(String correo) {
        if (!correoConfigurado) return;
        usuarioRepository.findByCorreo(correo.trim().toLowerCase())
                .filter(Usuario::getActivo)
                .ifPresent(usuario -> {
                    OffsetDateTime ahora = OffsetDateTime.now();
                    tokenRepository.invalidarPendientes(usuario.getId(), ahora);
                    byte[] bytes = new byte[32];
                    random.nextBytes(bytes);
                    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

                    RecuperacionToken t = new RecuperacionToken();
                    t.setUsuario(usuario);
                    t.setTokenHash(hash(token)); // en la BD solo se guarda el hash, nunca el token
                    t.setExpiraEn(ahora.plusMinutes(MINUTOS_VALIDEZ));
                    tokenRepository.save(t);
                    try {
                        correoService.enviarRecuperacion(usuario.getCorreo(), token);
                    } catch (RuntimeException ex) {
                        t.setUsadoEn(ahora);
                        log.warn("No se pudo entregar el correo de recuperacion ({})", ex.getClass().getSimpleName());
                    }
                });
    }

    @Transactional
    public void restablecer(RestablecerRequest req) {
        RecuperacionToken t = tokenRepository.findByTokenHash(hash(req.token()))
                .filter(x -> x.getUsadoEn() == null && x.getExpiraEn().isAfter(OffsetDateTime.now()))
                .orElseThrow(() -> Err.invalido("El token es invalido o ha expirado"));

        Usuario usuario = t.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(req.nuevaPassword()));
        usuarioRepository.save(usuario);
        t.setUsadoEn(OffsetDateTime.now());

        auditoria.registrar(usuario, "RESTABLECER", "USUARIO", usuario.getId(), "Cambio de contrasena por token");
    }

    private static String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
