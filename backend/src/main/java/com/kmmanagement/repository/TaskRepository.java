// backend/src/main/java/com/kmmanagement/repository/TaskRepository.java

package com.kmmanagement.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kmmanagement.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByDataServicoBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT t FROM Task t WHERE t.dataServico BETWEEN :start AND :end AND t.cliente IS NOT NULL")
    List<Task> findTasksForDashboard(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    List<Task> findByClienteId(Long clienteId);

    // --- NOVOS MÉTODOS ---
    boolean existsByDataServico(LocalDateTime dataServico);
    boolean existsByDataServicoAndIdNot(LocalDateTime dataServico, Long id);
}