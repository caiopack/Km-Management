package com.csemanager.controller;

import com.csemanager.dto.TaskDTO;
import com.csemanager.model.Task;
import com.csemanager.model.Cliente;
import com.csemanager.repository.TaskRepository;
import com.csemanager.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tarefas")
public class TaskController {

    @Autowired
    private TaskRepository repository;

    @Autowired
    private ClienteRepository clienteRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private TaskDTO toDTO(Task t) {
        Cliente c = t.getCliente();
        return new TaskDTO(
                t.getId(),
                t.getTitulo(),
                t.getDescricao(),
                t.getStatus(),
                t.getPrioridade(),
                c != null ? c.getId() : null,
                c != null ? c.getNome() : null,
                c != null ? c.getEndereco() : null,
                t.getDataServico() != null ? t.getDataServico().format(DATE_TIME_FORMATTER) : null,
                t.getCriadoPor(),
                // Mapeia valor pago
                t.getValorPago() 
        );
    }

    private Task toEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTitulo(dto.getTitulo());
        task.setDescricao(dto.getDescricao());
        task.setStatus(dto.getStatus());
        task.setPrioridade(dto.getPrioridade());
        task.setCriadoPor(dto.getCriadoPor());
        
        // Mapeia valor pago
        task.setValorPago(dto.getValorPago());

        if (dto.getClienteId() != null) {
            Optional<Cliente> cliente = clienteRepository.findById(dto.getClienteId());
            cliente.ifPresent(task::setCliente);
        }
        
        if (dto.getDataServico() != null && !dto.getDataServico().isEmpty()) {
            String cleanDate = dto.getDataServico().replace("T", " ");
            task.setDataServico(LocalDateTime.parse(cleanDate, DATE_TIME_FORMATTER));
        }
        return task;
    }

    @GetMapping
    public List<TaskDTO> listar() {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> buscar(@PathVariable Long id) {
        return repository.findById(id).map(task -> ResponseEntity.ok(toDTO(task)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TaskDTO criar(@RequestBody TaskDTO dto) {
        return toDTO(repository.save(toEntity(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> atualizar(@PathVariable Long id, @RequestBody TaskDTO dados) {
        return repository.findById(id).map(task -> {
            Task nova = toEntity(dados);
            
            task.setTitulo(nova.getTitulo());
            task.setDescricao(nova.getDescricao());
            task.setStatus(nova.getStatus());
            task.setPrioridade(nova.getPrioridade());
            task.setCliente(nova.getCliente());
            task.setDataServico(nova.getDataServico());
            
            // Atualiza campos opcionais
            if (nova.getCriadoPor() != null) task.setCriadoPor(nova.getCriadoPor());
            task.setValorPago(nova.getValorPago()); 

            return ResponseEntity.ok(toDTO(repository.save(task)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}