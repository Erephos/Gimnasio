package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreo(String correo);

    org.springframework.data.domain.Page<Usuario> findByRolNombre(String rol, org.springframework.data.domain.Pageable pageable);

}
