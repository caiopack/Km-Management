package com.kmmanagement.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kmmanagement.dto.LoginRequestDTO;
import com.kmmanagement.dto.RegisterRequestDTO;
import com.kmmanagement.dto.ResponseDTO;
import com.kmmanagement.model.User;
import com.kmmanagement.repository.UserRepository;
import com.kmmanagement.security.TokenService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Value("${api.security.token.user}")
    private String userToken;

    @Value("${api.security.token.admin}")
    private String adminToken;

    public AuthController(UserRepository repository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody LoginRequestDTO body) {
        User user = repository.findByEmail(body.email())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (passwordEncoder.matches(body.password(), user.getPassword())) {
            String token = tokenService.generateToken(user);
            return ResponseEntity.ok(new ResponseDTO(user.getName(), token, user.getRole(), user.getId()));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody RegisterRequestDTO dto) {
        Optional<User> userOpt = repository.findByEmail(dto.email());
        if (userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Já existe usuário com este e-mail.");
        }

        User newUser = new User();
        newUser.setName(dto.name());
        newUser.setEmail(dto.email());
        newUser.setPassword(passwordEncoder.encode(dto.password()));

        if (dto.token().equals(adminToken)) {
            newUser.setRole("ADMIN");
        } else if (dto.token().equals(userToken)) {
            newUser.setRole("USER");
        } else {
            return ResponseEntity.status(403).body("Token de acesso inválido.");
        }

        repository.save(newUser);
        String token = tokenService.generateToken(newUser);
        
        return ResponseEntity.ok(new ResponseDTO(newUser.getName(), token, newUser.getRole(), newUser.getId()));
    }
}