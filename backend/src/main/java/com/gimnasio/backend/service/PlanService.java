package com.gimnasio.backend.service;

import com.gimnasio.backend.dto.PlanRequest;
import com.gimnasio.backend.dto.PlanResponse;
import com.gimnasio.backend.entity.Plan;
import com.gimnasio.backend.repository.PlanRepository;
import com.gimnasio.backend.security.UsuarioActual;
import com.gimnasio.backend.util.Err;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlanService {

    private final PlanRepository planRepository;
    private final AuditoriaService auditoria;
    private final UsuarioActual usuarioActual;

    public PlanService(PlanRepository planRepository, AuditoriaService auditoria, UsuarioActual usuarioActual) {
        this.planRepository = planRepository;
        this.auditoria = auditoria;
        this.usuarioActual = usuarioActual;
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> listar(boolean soloActivos) {
        List<Plan> planes = soloActivos
                ? planRepository.findByActivoTrueOrderByPrecioAsc()
                : planRepository.findAllByOrderByPrecioAsc();
        return planes.stream().map(PlanResponse::desde).toList();
    }

    @Transactional
    public PlanResponse crear(PlanRequest req) {
        String nombre = req.nombre().trim();
        if (planRepository.existsByNombreIgnoreCase(nombre)) {
            throw Err.conflicto("Ya existe un plan con ese nombre");
        }
        Plan plan = new Plan();
        plan.setNombre(nombre);
        plan.setPrecio(req.precio());
        plan.setDuracionDias(req.duracionDias());
        plan = planRepository.save(plan);
        auditoria.registrar(usuarioActual.obtener(), "CREAR", "PLAN", plan.getId(), "Plan " + nombre);
        return PlanResponse.desde(plan);
    }

    @Transactional
    public PlanResponse actualizar(Long id, PlanRequest req) {
        Plan plan = planRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Plan no encontrado"));
        String nombre = req.nombre().trim();
        if (planRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw Err.conflicto("Ya existe otro plan con ese nombre");
        }
        plan.setNombre(nombre);
        plan.setPrecio(req.precio());
        plan.setDuracionDias(req.duracionDias());
        auditoria.registrar(usuarioActual.obtener(), "ACTUALIZAR", "PLAN", id, "Plan " + nombre);
        return PlanResponse.desde(plan);
    }

    @Transactional
    public PlanResponse cambiarEstado(Long id, boolean activo) {
        Plan plan = planRepository.findById(id).orElseThrow(() -> Err.noEncontrado("Plan no encontrado"));
        plan.setActivo(activo);
        auditoria.registrar(usuarioActual.obtener(), activo ? "ACTIVAR" : "DESACTIVAR", "PLAN", id, plan.getNombre());
        return PlanResponse.desde(plan);
    }
}
