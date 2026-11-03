package com.gimnasio.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "recuperacion_tokens")
@Getter
@Setter
@NoArgsConstructor
public class RecuperacionToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private OffsetDateTime expiraEn;

    private OffsetDateTime usadoEn;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime creadoEn;
}
