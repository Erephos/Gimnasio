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
@Table(name = "auditoria")
@Getter
@Setter
@NoArgsConstructor
public class Auditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 30)
    private String accion;

    @Column(nullable = false, length = 30)
    private String entidad;

    private Long entidadId;

    @Column(length = 500)
    private String detalle;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime fecha;
}
