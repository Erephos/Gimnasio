package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocioRepository extends JpaRepository<Socio, Long> {

    boolean existsByDni(String dni);

}
