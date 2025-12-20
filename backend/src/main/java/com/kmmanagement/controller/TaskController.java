package com.kmmanagement.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kmmanagement.dto.TaskDTO;
import com.kmmanagement.model.Cliente;
import com.kmmanagement.model.Task;
import com.kmmanagement.repository.ClienteRepository;
import com.kmmanagement.repository.TaskRepository;

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
                t.getValorPago(),
                t.getValorTotal(),
                t.getQuantidadePessoas() // Novo campo
        );
    }

    private Task toEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTitulo(dto.getTitulo());
        task.setDescricao(dto.getDescricao());
        task.setStatus(dto.getStatus());
        task.setPrioridade(dto.getPrioridade());
        task.setCriadoPor(dto.getCriadoPor());
        task.setValorPago(dto.getValorPago());
        task.setValorTotal(dto.getValorTotal());
        task.setQuantidadePessoas(dto.getQuantidadePessoas()); // Novo campo

        // Cliente Opcional
        if (dto.getClienteId() != null && dto.getClienteId() > 0) {
            Optional<Cliente> cliente = clienteRepository.findById(dto.getClienteId());
            cliente.ifPresent(task::setCliente);
        } else {
            task.setCliente(null);
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
            task.setCriadoPor(nova.getCriadoPor());
            task.setValorPago(nova.getValorPago()); 
            task.setValorTotal(nova.getValorTotal());
            task.setQuantidadePessoas(nova.getQuantidadePessoas()); // Atualiza novo campo

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