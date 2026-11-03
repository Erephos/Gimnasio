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
@Table(name = "pagos")
@Getter
@Setter
@NoArgsConstructor
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @ManyToOne(optional = false)
    @JoinColumn(name = "membresia_id", nullable = false)
    private Membresia membresia;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 15)
    private String metodo;

    @Column(nullable = false, length = 10)
    private String estado = "REGISTRADO";

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime fechaPago;

    @ManyToOne(optional = false)
    @JoinColumn(name = "registrado_por", nullable = false)
    private Usuario registradoPor;

    @ManyToOne
    @JoinColumn(name = "anulado_por")
    private Usuario anuladoPor;

    private OffsetDateTime anuladoEn;

    @Column(length = 200)
    private String motivoAnulacion;
}
