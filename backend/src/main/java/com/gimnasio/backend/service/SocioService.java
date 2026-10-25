package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.SocioRegistroRequest;
import com.gimnasio.backend.dto.SocioResponse;
import com.gimnasio.backend.entity.Rol;
import com.gimnasio.backend.entity.Socio;
import com.gimnasio.backend.entity.Usuario;
import com.gimnasio.backend.repository.RolRepository;
import com.gimnasio.backend.repository.SocioRepository;
import com.gimnasio.backend.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public SocioService(SocioRepository socioRepository,
                        UsuarioRepository usuarioRepository,
                        RolRepository rolRepository,
                        PasswordEncoder passwordEncoder) {
        this.socioRepository = socioRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public SocioResponse registrar(SocioRegistroRequest req) {
        if (usuarioRepository.findByCorreo(req.correo()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado pes blothel");
        }
        if (socioRepository.existsByDni(req.dni())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El DNI ya esta registrado... nada mas");
        }

        Rol rolSocio = rolRepository.findByNombre("SOCIO")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "El rol SOCIO no existe en la base de datos"));
        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre());
        usuario.setApellido(req.apellido());
        usuario.setCorreo(req.correo());
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

        return SocioResponse.desde(socioRepository.save(socio));
    }

    public Page<SocioResponse> listar(int pagina, int tamanio) {
        return socioRepository.findAll(PageRequest.of(pagina, tamanio))
                .map(SocioResponse::desde);
    }

}
