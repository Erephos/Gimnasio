package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.time.OffsetDateTime;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByMembresiaIdOrderByFechaPagoDesc(Long membresiaId);

    @Query("select coalesce(sum(p.monto), 0) from Pago p "
            + "where p.membresia.id = :membresiaId and p.estado = 'REGISTRADO'")
    BigDecimal sumaRegistrados(@Param("membresiaId") Long membresiaId);

    @Query("select coalesce(sum(p.monto), 0) from Pago p where p.estado = 'REGISTRADO' "
            + "and p.fechaPago >= :desde and p.fechaPago < :hasta")
    BigDecimal sumarRegistradosEntre(@Param("desde") OffsetDateTime desde, @Param("hasta") OffsetDateTime hasta);

    long countByEstadoAndFechaPagoGreaterThanEqualAndFechaPagoLessThan(
            String estado, OffsetDateTime desde, OffsetDateTime hasta);

    @Query("select p from Pago p where (:socioId is null or p.socio.id = :socioId) "
            + "and (:filtro = '' or lower(p.socio.dni) like lower(concat('%', :filtro, '%')) "
            + "or lower(p.socio.usuario.nombre) like lower(concat('%', :filtro, '%')) "
            + "or lower(p.socio.usuario.apellido) like lower(concat('%', :filtro, '%'))) "
            + "and (:estado is null or p.estado = :estado)")
    Page<Pago> buscar(@Param("socioId") Long socioId, @Param("filtro") String filtro,
                      @Param("estado") String estado, Pageable pageable);
}
