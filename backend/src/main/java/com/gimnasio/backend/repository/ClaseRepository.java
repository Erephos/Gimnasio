package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Clase;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface ClaseRepository extends JpaRepository<Clase, Long> {

    List<Clase> findByActivaTrueAndFinAfterOrderByInicioAsc(OffsetDateTime ahora);

    /** Bloquea la fila de la clase para que dos reservas simultaneas no sobrepasen el aforo. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Clase c where c.id = :id")
    Optional<Clase> buscarConBloqueo(@Param("id") Long id);

    @Query("select count(c) > 0 from Clase c where c.activa = true and c.entrenador.id = :entrenadorId "
            + "and c.inicio < :fin and c.fin > :inicio")
    boolean existeSolapeEntrenador(@Param("entrenadorId") Long entrenadorId,
                                   @Param("inicio") OffsetDateTime inicio,
                                   @Param("fin") OffsetDateTime fin);

    @Query("select count(c) > 0 from Clase c where c.activa = true and lower(c.aula) = lower(:aula) "
            + "and c.inicio < :fin and c.fin > :inicio")
    boolean existeSolapeAula(@Param("aula") String aula,
                             @Param("inicio") OffsetDateTime inicio,
                             @Param("fin") OffsetDateTime fin);
}
