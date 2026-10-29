package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.CambioPasswordRequest;
import com.gimnasio.backend.dto.CambioRolRequest;
import com.gimnasio.backend.dto.UsuarioPersonalRequest;
import com.gimnasio.backend.dto.UsuarioResponse;
import com.gimnasio.backend.entity.Rol;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.RolRepository;
import com.gimnasio.backend.repository.UsuarioRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

/**
 * Gestion de cuentas. Los permisos se validan en el servidor: el JwtAuthFilter revisa en cada
 * peticion que la cuenta siga activa y con el mismo rol que trae el token, asi que desactivar a
 * alguien o cambiarle el rol le invalida la sesion de inmediato.
 */
@Service
public class UsuarioService {

    private static final Set<String> ROLES_PERSONAL = Set.of("ADMINISTRADOR", "RECEPCIONISTA");

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                          PasswordEncoder passwordEncoder, UsuarioActual usuarioActual,
                          AuditoriaService auditoria) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioActual = usuarioActual;
        this.auditoria = auditoria;
    }

    @Transactional
    public UsuarioResponse crearPersonal(UsuarioPersonalRequest req) {
        String correo = req.correo().trim().toLowerCase();
        if (usuarioRepository.findByCorreo(correo).isPresent()) {
            throw Err.conflicto("El correo ya esta registrado");
        }
        Usuario u = new Usuario();
        u.setNombre(req.nombre().trim());
        u.setApellido(req.apellido().trim());
        u.setCorreo(correo);
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setRol(buscarRol(req.rol()));
        u.setActivo(true);
        u = usuarioRepository.save(u);

        auditoria.registrar(usuarioActual.obtener(), "CREAR", "USUARIO", u.getId(),
                "Cuenta " + req.rol() + " " + correo);
        return UsuarioResponse.desde(u);
    }

    @Transactional(readOnly = true)
    public Page<UsuarioResponse> listar(int pagina, int tamanio, String rol) {
        PageRequest pageable = PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 50)),
                Sort.by("apellido").ascending().and(Sort.by("nombre").ascending()));
        Page<Usuario> resultado = (rol == null || rol.isBlank())
                ? usuarioRepository.findAll(pageable)
                : usuarioRepository.findByRolNombre(rol.trim().toUpperCase(), pageable);
        return resultado.map(UsuarioResponse::desde);
    }

    @Transactional
    public UsuarioResponse cambiarRol(Long id, CambioRolRequest req) {
        Usuario actor = usuarioActual.obtener();
        Usuario u = usuarioRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Usuario no encontrado"));
        if (u.getId().equals(actor.getId())) {
            throw Err.prohibido("No puedes cambiar tu propio rol");
        }
        if (!ROLES_PERSONAL.contains(u.getRol().getNombre())) {
            throw Err.conflicto("Solo se puede cambiar el rol de administradores y recepcionistas");
        }
        if (u.getRol().getNombre().equals(req.rol())) {
            throw Err.conflicto("El usuario ya tiene ese rol");
        }
        String anterior = u.getRol().getNombre();
        u.setRol(buscarRol(req.rol()));
        auditoria.registrar(actor, "CAMBIAR_ROL", "USUARIO", id, anterior + " -> " + req.rol());
        return UsuarioResponse.desde(u);
    }

    @Transactional
    public UsuarioResponse cambiarEstado(Long id, boolean activo) {
        Usuario actor = usuarioActual.obtener();
        Usuario u = usuarioRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Usuario no encontrado"));
        if (u.getId().equals(actor.getId())) {
            throw Err.prohibido("No puedes desactivar tu propia cuenta");
        }
        if (u.getActivo().equals(activo)) {
            throw Err.conflicto(activo ? "La cuenta ya esta activa" : "La cuenta ya esta inactiva");
        }
        u.setActivo(activo);
        auditoria.registrar(actor, activo ? "ACTIVAR" : "DESACTIVAR", "USUARIO", id, u.getCorreo());
        return UsuarioResponse.desde(u);
    }

    @Transactional
    public void cambiarPassword(CambioPasswordRequest req) {
        Usuario u = usuarioActual.obtener();
        if (!passwordEncoder.matches(req.passwordActual(), u.getPasswordHash())) {
            throw Err.invalido("La contrasena actual es incorrecta");
        }
        if (passwordEncoder.matches(req.passwordNueva(), u.getPasswordHash())) {
            throw Err.invalido("La nueva contrasena debe ser distinta a la actual");
        }
        u.setPasswordHash(passwordEncoder.encode(req.passwordNueva()));
        auditoria.registrar(u, "CAMBIAR_PASSWORD", "USUARIO", u.getId(), "Cambio de contrasena por el propio usuario");
    }

    private Rol buscarRol(String nombre) {
        return rolRepository.findByNombre(nombre).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "El rol " + nombre + " no existe en la base de datos"));
    }
}
