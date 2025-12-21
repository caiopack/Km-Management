package com.kmmanagement.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kmmanagement.dto.ClienteDTO;
import com.kmmanagement.model.Cliente;
import com.kmmanagement.repository.ClienteRepository;

@RestController
// CORREÇÃO: Removemos o "/api" para alinhar com o Frontend
@RequestMapping("/clientes")
@CrossOrigin(origins = "*") // Pode manter ou remover, já que o CorsConfig global trata isso
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    private ClienteDTO toDTO(Cliente c) {
        return new ClienteDTO(
                c.getId(), c.getNome(), c.getTelefone(),
                c.getEndereco(), c.getEmail(), c.getNotas()
        );
    }

    private Cliente toEntity(ClienteDTO dto) {
        Cliente c = new Cliente();
        c.setNome(dto.getNome());
        c.setTelefone(dto.getTelefone());
        c.setEndereco(dto.getEndereco());
        c.setEmail(dto.getEmail());
        c.setNotas(dto.getNotas());
        return c;
    }

    @GetMapping
    public List<ClienteDTO> listarTodos() {
        return clienteRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> buscarPorId(@PathVariable Long id) {
        return clienteRepository.findById(id)
                .map(c -> ResponseEntity.ok(toDTO(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody ClienteDTO dto) {
        Map<String, String> errors = new HashMap<>();
        if (dto.getNome() == null || dto.getNome().isBlank()) {
            errors.put("nome", "O nome é obrigatório");
        }
        if (dto.getTelefone() == null || dto.getTelefone().isBlank()) {
            errors.put("telefone", "O telefone é obrigatório");
        }
        if (dto.getEndereco() == null || dto.getEndereco().isBlank()) {
            errors.put("endereco", "O endereço é obrigatório");
        }
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(errors);
        }

        Cliente salvo = clienteRepository.save(toEntity(dto));
        return ResponseEntity.ok(toDTO(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody ClienteDTO dto
    ) {
        Map<String, String> errors = new HashMap<>();
        if (dto.getNome() == null || dto.getNome().isBlank()) {
            errors.put("nome", "O nome é obrigatório");
        }
        if (dto.getTelefone() == null || dto.getTelefone().isBlank()) {
            errors.put("telefone", "O telefone é obrigatório");
        }
        if (dto.getEndereco() == null || dto.getEndereco().isBlank()) {
            errors.put("endereco", "O endereço é obrigatório");
        }
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(errors);
        }

        return clienteRepository.findById(id)
                .map(c -> {
                    c.setNome(dto.getNome());
                    c.setTelefone(dto.getTelefone());
                    c.setEndereco(dto.getEndereco());
                    c.setEmail(dto.getEmail());
                    c.setNotas(dto.getNotas());
                    Cliente atualizado = clienteRepository.save(c);
                    return ResponseEntity.ok(toDTO(atualizado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        return clienteRepository.findById(id)
                .map(c -> {
                    clienteRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}