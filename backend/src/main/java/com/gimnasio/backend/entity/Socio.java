package com.gimnasio.backend.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "socios")
@Getter
@Setter
@NoArgsConstructor
public class Socio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 8)
    private String dni;

    @Column(length = 9)
    private String telefono;

    @Column(nullable = false, length = 10)
    private String genero;

    @Column(length = 150)
    private String direccion;

    @Column(length = 100)
    private String contactoEmergencia;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
