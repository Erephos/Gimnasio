package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.RecuperacionToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.time.OffsetDateTime;

public interface RecuperacionTokenRepository extends JpaRepository<RecuperacionToken, Long> {

    Optional<RecuperacionToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RecuperacionToken t set t.usadoEn = :ahora where t.usuario.id = :usuarioId and t.usadoEn is null")
    int invalidarPendientes(@Param("usuarioId") Long usuarioId, @Param("ahora") OffsetDateTime ahora);
}
