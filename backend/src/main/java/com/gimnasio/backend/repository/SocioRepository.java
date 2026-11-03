package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;

import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface SocioRepository extends JpaRepository<Socio, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Socio s where s.id = :id")
    Optional<Socio> buscarPorIdParaActualizar(@Param("id") Long id);

    boolean existsByDni(String dni);

    Optional<Socio> findByDni(String dni);

    Optional<Socio> findByUsuarioId(Long usuarioId);

    boolean existsByDniAndIdNot(String dni, Long id);

    @Query("select s from Socio s where (:activo is null or s.usuario.activo = :activo) "
            + "and (:filtro = '' or lower(s.dni) like lower(concat('%', :filtro, '%')) "
            + "or lower(s.usuario.nombre) like lower(concat('%', :filtro, '%')) "
            + "or lower(s.usuario.apellido) like lower(concat('%', :filtro, '%')) "
            + "or lower(concat(s.usuario.nombre, ' ', s.usuario.apellido)) like lower(concat('%', :filtro, '%'))) ")
    Page<Socio> buscar(@Param("filtro") String filtro, @Param("activo") Boolean activo, Pageable pageable);

    @Query("select count(s) from Socio s where s.usuario.creadoEn >= :desde and s.usuario.creadoEn < :hasta")
    long contarNuevos(@Param("desde") OffsetDateTime desde, @Param("hasta") OffsetDateTime hasta);

}
