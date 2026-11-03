package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.EntrenadorRequest;
import com.gimnasio.backend.dto.EntrenadorResponse;
import com.gimnasio.backend.entity.Entrenador;
import com.gimnasio.backend.entity.Rol;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.EntrenadorRepository;
import com.gimnasio.backend.repository.RolRepository;
import com.gimnasio.backend.repository.UsuarioRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EntrenadorService {

    private final EntrenadorRepository entrenadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoria;
    private final UsuarioActual usuarioActual;

    public EntrenadorService(EntrenadorRepository entrenadorRepository, UsuarioRepository usuarioRepository,
                             RolRepository rolRepository, PasswordEncoder passwordEncoder,
                             AuditoriaService auditoria, UsuarioActual usuarioActual) {
        this.entrenadorRepository = entrenadorRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoria = auditoria;
        this.usuarioActual = usuarioActual;
    }

    @Transactional
    public EntrenadorResponse crear(EntrenadorRequest req) {
        String correo = req.correo().trim().toLowerCase();
        if (usuarioRepository.findByCorreo(correo).isPresent()) {
            throw Err.conflicto("El correo ya esta registrado");
        }
        if (entrenadorRepository.existsByDni(req.dni())) {
            throw Err.conflicto("El DNI ya esta registrado");
        }
        Rol rol = rolRepository.findByNombre("ENTRENADOR").orElseThrow(() -> new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "El rol ENTRENADOR no existe en la base de datos"));

        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre());
        usuario.setApellido(req.apellido());
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(req.password()));
        usuario.setRol(rol);
        usuario.setActivo(true);

        Entrenador e = new Entrenador();
        e.setUsuario(usuario);
        e.setDni(req.dni());
        e.setTelefono(req.telefono());
        e.setEspecialidad(req.especialidad());
        e = entrenadorRepository.save(e);

        auditoria.registrar(usuarioActual.obtener(), "CREAR", "ENTRENADOR", e.getId(), "DNI " + e.getDni());
        return EntrenadorResponse.desde(e);
    }

    @Transactional(readOnly = true)
    public Page<EntrenadorResponse> listar(int pagina, int tamanio) {
        return entrenadorRepository.findAll(PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 50))))
                .map(EntrenadorResponse::desde);
    }
}
