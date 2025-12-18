package com.csemanager.controller;

import com.csemanager.dto.LoginRequestDTO;
import com.csemanager.dto.RegisterRequestDTO;
import com.csemanager.dto.ResponseDTO;
import com.csemanager.model.User;
import com.csemanager.repository.UserRepository;
import com.csemanager.security.TokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Value("${registration.secret.key}")
    private String registrationSecretKey;

    public AuthController(
            UserRepository repository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO body) {
        User user = repository.findByEmail(body.email())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (passwordEncoder.matches(body.password(), user.getPassword())) {
            String token = tokenService.generateToken(user);
            
            // --- ALTERAÇÃO AQUI: Retorna o NOME (user.getName()) ---
            return ResponseEntity.ok(new ResponseDTO(user.getName(), token));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO dto) {
        if (!registrationSecretKey.equals(dto.secretKey())) {
            return ResponseEntity.status(403).body("Chave secreta inválida.");
        }

        Optional<User> userOpt = repository.findByEmail(dto.email());
        if (userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Já existe usuário com este e-mail.");
        }

        User newUser = new User();
        newUser.setName(dto.name());
        newUser.setEmail(dto.email());
        newUser.setPassword(passwordEncoder.encode(dto.password()));
        repository.save(newUser);

        String token = tokenService.generateToken(newUser);
        return ResponseEntity.ok(new ResponseDTO(newUser.getId(), token));
    }
}