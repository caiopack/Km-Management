package com.kmmanagement.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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
import com.kmmanagement.model.User;
import com.kmmanagement.repository.ClienteRepository;
import com.kmmanagement.repository.TaskRepository;
import com.kmmanagement.repository.UserRepository;

@RestController
@RequestMapping("/api/tarefas")
public class TaskController {

    @Autowired
    private TaskRepository repository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UserRepository userRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // Método auxiliar para pegar o nome do usuário logado via Token
    private String getUsuarioLogado() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof User user) {
                return user.getName();
            }
        } catch (Exception e) {
            // Fallback caso algo dê errado no contexto de segurança
        }
        return "Sistema";
    }

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
                t.getQuantidadePessoas()
        );
    }

    private Task toEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTitulo(dto.getTitulo());
        task.setDescricao(dto.getDescricao());
        task.setStatus(dto.getStatus());
        task.setPrioridade(dto.getPrioridade());
        // O setCriadoPor será tratado especificamente nos métodos POST/PUT
        task.setValorPago(dto.getValorPago());
        task.setValorTotal(dto.getValorTotal());
        task.setQuantidadePessoas(dto.getQuantidadePessoas());

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
        Task novaTarefa = toEntity(dto);
        // --- AQUI: Força o usuário logado como criador ---
        novaTarefa.setCriadoPor(getUsuarioLogado());
        
        return toDTO(repository.save(novaTarefa));
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
            task.setValorPago(nova.getValorPago()); 
            task.setValorTotal(nova.getValorTotal());
            task.setQuantidadePessoas(nova.getQuantidadePessoas());

            // Na edição, MANTEMOS quem criou originalmente.
            // Se quiser mudar para "quem editou pela última vez", troque para:
            // task.setCriadoPor(getUsuarioLogado());
            // Mas o padrão geralmente é manter o criador original.
            if (task.getCriadoPor() == null) {
                task.setCriadoPor(getUsuarioLogado());
            }

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