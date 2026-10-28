package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Asistencia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    boolean existsBySocioIdAndFecha(Long socioId, LocalDate fecha);

    Page<Asistencia> findByFecha(LocalDate fecha, Pageable pageable);

    @Query("select a from Asistencia a where a.fecha = :fecha and (:filtro is null "
            + "or lower(a.socio.dni) like lower(concat('%', :filtro, '%')) "
            + "or lower(a.socio.usuario.nombre) like lower(concat('%', :filtro, '%')) "
            + "or lower(a.socio.usuario.apellido) like lower(concat('%', :filtro, '%'))) ")
    Page<Asistencia> buscarPorFecha(@Param("fecha") LocalDate fecha, @Param("filtro") String filtro, Pageable pageable);

    Page<Asistencia> findBySocioId(Long socioId, Pageable pageable);

    long countByFechaBetween(LocalDate desde, LocalDate hasta);
}
