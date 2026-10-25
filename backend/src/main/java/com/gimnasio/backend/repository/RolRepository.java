package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolRepository extends JpaRepository<Rol, Long> {

    java.util.Optional<Rol> findByNombre(String nombre);

}
