package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    long countByClaseIdAndEstado(Long claseId, String estado);

    boolean existsByClaseIdAndSocioIdAndEstado(Long claseId, Long socioId, String estado);

    List<Reserva> findBySocioIdOrderByClaseInicioDesc(Long socioId);

    List<Reserva> findByClaseIdAndEstado(Long claseId, String estado);

    @Modifying(clearAutomatically = true)
    @Query("update Reserva r set r.estado = 'CANCELADA' where r.clase.id = :claseId and r.estado = 'RESERVADA'")
    int cancelarPorClase(@Param("claseId") Long claseId);
}
