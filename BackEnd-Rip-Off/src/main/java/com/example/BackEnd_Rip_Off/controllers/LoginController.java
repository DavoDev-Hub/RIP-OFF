package com.example.BackEnd_Rip_Off.controllers;

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

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // Buscar usuario por correo
        User user = userService.findByCorreo(loginRequest.getCorreo());
        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Credenciales incorrectas");
        }

        // Generar el token JWT
        String userId = user.getId(); // Cambiado a String para UUID

        // Preparar la respuesta
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId); // Ahora devuelve UUID como userId
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
