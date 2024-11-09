package com.example.BackEnd_Rip_Off.controllers;

import com.example.BackEnd_Rip_Off.config.JwtUtil;
import com.example.BackEnd_Rip_Off.models.User;
import com.example.BackEnd_Rip_Off.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        User user = userService.findByCorreo(loginRequest.getCorreo());
        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Credenciales incorrectas");
        }

        // Generar el token JWT
        String token = jwtUtil.generateToken(user.getCorreo());
        Long userId = user.getId(); // Obtén el ID de usuario

        Map<String, Object> response = new HashMap<>(); // Cambiado a Map<String, Object>
        response.put("token", token);
        response.put("userId", userId); // userId ahora se puede almacenar como Long
        return ResponseEntity.ok(response);
    }
}

// Clase interna para manejar la solicitud de autenticación
class LoginRequest {
    private String correo;
    private String password;

    // Getters y setters
    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
