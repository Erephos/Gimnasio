package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.SocioRegistroRequest;
import com.gimnasio.backend.dto.SocioResponse;
import com.gimnasio.backend.dto.SocioActualizacionRequest;
import com.gimnasio.backend.entity.Rol;
import com.gimnasio.backend.entity.Socio;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.RolRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.repository.UsuarioRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioActual usuarioActual;
    private final AuditoriaService auditoria;

    public SocioService(SocioRepository socioRepository,
                        UsuarioRepository usuarioRepository,
                        RolRepository rolRepository,
                        PasswordEncoder passwordEncoder, UsuarioActual usuarioActual,
                        AuditoriaService auditoria) {
        this.socioRepository = socioRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioActual = usuarioActual;
        this.auditoria = auditoria;
    }

    @Transactional
    public SocioResponse registrar(SocioRegistroRequest req) {
        String correo = req.correo().trim().toLowerCase();
        if (usuarioRepository.findByCorreo(correo).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado");
        }
        if (socioRepository.existsByDni(req.dni())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El DNI ya esta registrado");
        }

        Rol rolSocio = rolRepository.findByNombre("SOCIO")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "El rol SOCIO no existe en la base de datos"));
        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre());
        usuario.setApellido(req.apellido());
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(req.password()));
        usuario.setRol(rolSocio);
        usuario.setActivo(true);

        Socio socio = new Socio();
        socio.setUsuario(usuario);
        socio.setDni(req.dni());
        socio.setTelefono(req.telefono());
        socio.setGenero(req.genero());
        socio.setDireccion(req.direccion());
        socio.setContactoEmergencia(req.contactoEmergencia());

        socio = socioRepository.save(socio);
        auditoria.registrar(usuario, "REGISTRAR", "SOCIO", socio.getId(), "Alta de socio");
        return SocioResponse.desde(socio);
    }

    public Page<SocioResponse> listar(int pagina, int tamanio, String filtro, Boolean activo) {
        String consulta = filtro == null || filtro.isBlank() ? null : filtro.trim();
        return socioRepository.buscar(consulta, activo,
                        PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanio, 50)),
                                Sort.by("usuario.apellido").ascending().and(Sort.by("usuario.nombre").ascending())))
                .map(SocioResponse::desde);
    }

    @Transactional(readOnly = true)
    public SocioResponse obtener(Long socioId) {
        Usuario actor = usuarioActual.obtener();
        Socio socio = socioRepository.findById(socioId).orElseThrow(() -> Err.noEncontrado("Socio no encontrado"));
        boolean staff = usuarioActual.tieneRol(actor, "ADMINISTRADOR") || usuarioActual.tieneRol(actor, "RECEPCIONISTA");
        if (!staff && !socio.getUsuario().getId().equals(actor.getId())) {
            throw Err.prohibido("No puedes consultar el perfil de otro socio");
        }
        return SocioResponse.desde(socio);
    }

    @Transactional
    public SocioResponse actualizar(Long socioId, SocioActualizacionRequest req) {
        if (req.correo() == null && req.telefono() == null && req.direccion() == null
                && req.contactoEmergencia() == null && req.dni() == null) {
            throw Err.invalido("Indica al menos un dato para actualizar");
        }
        Usuario actor = usuarioActual.obtener();
        Socio socio = socioRepository.findById(socioId).orElseThrow(() -> Err.noEncontrado("Socio no encontrado"));
        boolean admin = usuarioActual.tieneRol(actor, "ADMINISTRADOR");
        boolean staff = admin || usuarioActual.tieneRol(actor, "RECEPCIONISTA");
        if (!staff && !socio.getUsuario().getId().equals(actor.getId())) {
            throw Err.prohibido("No puedes modificar el perfil de otro socio");
        }
        if (req.correo() != null) {
            String correo = req.correo().trim().toLowerCase();
            usuarioRepository.findByCorreo(correo)
                    .filter(otro -> !otro.getId().equals(socio.getUsuario().getId()))
                    .ifPresent(otro -> { throw Err.conflicto("El correo ya esta registrado"); });
            socio.getUsuario().setCorreo(correo);
        }
        if (req.telefono() != null) socio.setTelefono(req.telefono());
        if (req.direccion() != null) socio.setDireccion(req.direccion().trim());
        if (req.contactoEmergencia() != null) socio.setContactoEmergencia(req.contactoEmergencia().trim());
        if (req.dni() != null) {
            if (!admin) throw Err.prohibido("Solo un administrador puede corregir el DNI");
            if (socioRepository.existsByDniAndIdNot(req.dni(), socioId)) throw Err.conflicto("El DNI ya esta registrado");
            socio.setDni(req.dni());
        }
        auditoria.registrar(actor, "ACTUALIZAR", "SOCIO", socioId, "Datos de contacto actualizados");
        return SocioResponse.desde(socio);
    }

    @Transactional
    public void desactivar(Long socioId) {
        Usuario actor = usuarioActual.obtener();
        Socio socio = socioRepository.findById(socioId).orElseThrow(() -> Err.noEncontrado("Socio no encontrado"));
        if (!usuarioActual.tieneRol(actor, "ADMINISTRADOR")) throw Err.prohibido("Solo un administrador puede dar de baja socios");
        if (!socio.getUsuario().getActivo()) throw Err.conflicto("El socio ya esta inactivo");
        socio.getUsuario().setActivo(false);
        auditoria.registrar(actor, "DESACTIVAR", "SOCIO", socioId, "Cuenta desactivada; historial preservado");
    }

}
