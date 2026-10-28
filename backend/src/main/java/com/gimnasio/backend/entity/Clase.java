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
@Table(name = "clases")
@Getter
@Setter
@NoArgsConstructor
public class Clase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String disciplina;

    @ManyToOne(optional = false)
    @JoinColumn(name = "entrenador_id", nullable = false)
    private Entrenador entrenador;

    @Column(nullable = false, length = 30)
    private String aula;

    @Column(nullable = false)
    private OffsetDateTime inicio;

    @Column(nullable = false)
    private OffsetDateTime fin;

    @Column(nullable = false)
    private Integer aforo;

    @Column(nullable = false)
    private Boolean activa = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime creadaEn;
}
