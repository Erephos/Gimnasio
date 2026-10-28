package com.gimnasio.backend.repository;

import com.gimnasio.backend.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    List<Plan> findByActivoTrueOrderByPrecioAsc();

    List<Plan> findAllByOrderByPrecioAsc();
}
