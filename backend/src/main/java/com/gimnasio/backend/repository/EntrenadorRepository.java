package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntrenadorRepository extends JpaRepository<Entrenador, Long> {

    boolean existsByDni(String dni);
}
