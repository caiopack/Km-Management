package com.kmmanagement.controller;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kmmanagement.dto.DashboardStatsDTO;
import com.kmmanagement.dto.TaskDTO;
import com.kmmanagement.model.Cliente;
import com.kmmanagement.model.Task;
import com.kmmanagement.model.User;
import com.kmmanagement.repository.ClienteRepository;
import com.kmmanagement.repository.TaskRepository;

@RestController
@RequestMapping("/tarefas")
public class TaskController {

    @Autowired
    private TaskRepository repository;

    @Autowired
    private ClienteRepository clienteRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate anchorDate = (date != null) ? date : LocalDate.now();
        
        LocalDateTime start;
        LocalDateTime end;

        if ("day".equalsIgnoreCase(period)) {
            start = LocalDateTime.of(anchorDate, LocalTime.MIN);
            end = LocalDateTime.of(anchorDate, LocalTime.MAX);
        } else if ("week".equalsIgnoreCase(period)) {
            start = LocalDateTime.of(anchorDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), LocalTime.MIN);
            end = LocalDateTime.of(anchorDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)), LocalTime.MAX);
        } else { 
            start = LocalDateTime.of(anchorDate.with(TemporalAdjusters.firstDayOfMonth()), LocalTime.MIN);
            end = LocalDateTime.of(anchorDate.with(TemporalAdjusters.lastDayOfMonth()), LocalTime.MAX);
        }

        // MANTIDO O FILTRO ORIGINAL: Só mostra tarefas que têm cliente
        List<Task> tarefasPeriodo = repository.findByDataServicoBetween(start, end).stream()
                .filter(t -> t.getCliente() != null)
                .collect(Collectors.toList());

        long totalAgendamentos = tarefasPeriodo.size();

        BigDecimal valorEsperado = tarefasPeriodo.stream()
                .map(t -> {
                    Double val = t.getValorTotal();
                    return val != null ? BigDecimal.valueOf(val) : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal valorRecebido = tarefasPeriodo.stream()
                .map(t -> {
                    if ("PAGO".equalsIgnoreCase(t.getStatus())) {
                        Double val = t.getValorPago();
                        return val != null ? BigDecimal.valueOf(val) : BigDecimal.ZERO;
                    } 
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal valorAPagar = tarefasPeriodo.stream()
                .map(t -> {
                     Double totalObj = t.getValorTotal();
                     Double pagoObj = t.getValorPago();
                     double total = totalObj != null ? totalObj : 0.0;
                     double pago = pagoObj != null ? pagoObj : 0.0;

                     if ("PAGO".equalsIgnoreCase(t.getStatus())) {
                        return BigDecimal.valueOf(Math.max(0, total - pago));
                     } else if ("A_PAGAR".equalsIgnoreCase(t.getStatus())) {
                        return BigDecimal.valueOf(total);
                     }
                     return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long clientesNovos = tarefasPeriodo.stream()
                .filter(t -> t.getPrioridade() != null && t.getPrioridade() == 1)
                .count();

        long clientesRecorrentes = tarefasPeriodo.stream()
                .filter(t -> t.getPrioridade() != null && t.getPrioridade() == 2)
                .count();

        return ResponseEntity.ok(new DashboardStatsDTO(
            totalAgendamentos,
            clientesNovos,
            clientesRecorrentes,
            valorEsperado,
            valorRecebido,
            valorAPagar
        ));
    }

    private String getUsuarioLogado() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof User user) return user.getName();
        } catch (Exception e) {}
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
        return repository.findById(id).map(task -> ResponseEntity.ok(toDTO(task))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TaskDTO criar(@RequestBody TaskDTO dto) {
        if (dto.getDataServico() != null && !dto.getDataServico().isEmpty()) {
            String cleanDate = dto.getDataServico().replace("T", " ");
            LocalDateTime novaData = LocalDateTime.parse(cleanDate, DATE_TIME_FORMATTER);
            
            if (repository.existsByDataServico(novaData)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um agendamento para este horário.");
            }
        }

        Task novaTarefa = toEntity(dto);
        novaTarefa.setCriadoPor(getUsuarioLogado());
        return toDTO(repository.save(novaTarefa));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> atualizar(@PathVariable Long id, @RequestBody TaskDTO dados) {
        return repository.findById(id).map(task -> {
            if (dados.getDataServico() != null && !dados.getDataServico().isEmpty()) {
                String cleanDate = dados.getDataServico().replace("T", " ");
                LocalDateTime novaData = LocalDateTime.parse(cleanDate, DATE_TIME_FORMATTER);

                if (repository.existsByDataServicoAndIdNot(novaData, id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Horário indisponível. Já existe outro agendamento.");
                }
            }

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