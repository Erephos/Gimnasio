package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Membresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Membresia m where m.id = :id")
    Optional<Membresia> buscarPorIdParaActualizar(@Param("id") Long id);

    List<Membresia> findBySocioIdOrderByFechaInicioDesc(Long socioId);

    /** Hay solape si el periodo existente cruza [inicio, fin). fecha_fin es exclusiva. */
    @Query("select count(m) > 0 from Membresia m where m.socio.id = :socioId "
            + "and m.fechaInicio < :fin and m.fechaFin > :inicio")
    boolean existeSolape(@Param("socioId") Long socioId,
                         @Param("inicio") LocalDate inicio,
                         @Param("fin") LocalDate fin);

    @Query("select count(m) > 0 from Membresia m where m.socio.id = :socioId "
            + "and m.fechaInicio <= :fecha and m.fechaFin > :fecha")
    boolean existeVigente(@Param("socioId") Long socioId, @Param("fecha") LocalDate fecha);

    @Query("select m from Membresia m where m.socio.id = :socioId "
            + "and m.fechaInicio <= :fecha and m.fechaFin > :fecha order by m.fechaFin desc")
    List<Membresia> buscarVigentes(@Param("socioId") Long socioId, @Param("fecha") LocalDate fecha);

    @Query("select m from Membresia m where m.socio.usuario.activo = true "
            + "and m.fechaFin > :desde and m.fechaFin <= :hasta order by m.fechaFin asc")
    List<Membresia> buscarParaAlerta(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("select count(m) from Membresia m where m.fechaInicio <= :hoy and m.fechaFin > :hoy "
            + "and m.socio.usuario.activo = true")
    long contarVigentes(@Param("hoy") LocalDate hoy);

    @Query("select count(m) from Membresia m where m.fechaFin <= :hoy and m.socio.usuario.activo = true")
    long contarVencidas(@Param("hoy") LocalDate hoy);
}
