package com.example.BackEnd_Rip_Off.controllers;

import com.example.BackEnd_Rip_Off.models.User;
import com.example.BackEnd_Rip_Off.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // Registro de usuario
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User newUser = userService.registerUser(user);
        return ResponseEntity.ok(newUser); // Devuelve el usuario, incluyendo userId
    }

    // Obtener un usuario por su correo (solo si es necesario)
    @GetMapping("/correo/{correo}")
    public ResponseEntity<User> getUserByCorreo(@PathVariable String correo) {
        User user = userService.findByCorreo(correo);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/profile-picture")
    public ResponseEntity<?> updateProfilePicture(
            @PathVariable String id, // Cambiar de Long a String
            @RequestBody Map<String, String> payload) {
        String newProfilePictureUrl = payload.get("profilePictureUrl");
        if (newProfilePictureUrl == null || newProfilePictureUrl.isEmpty()) {
            return ResponseEntity.badRequest().body("La URL de la imagen no puede estar vacía.");
        }

        try {
            userService.updateProfilePicture(id, newProfilePictureUrl); // Aquí también usa String
            return ResponseEntity.ok().body("Imagen de perfil actualizada correctamente.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al actualizar la imagen de perfil.");
        }

    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("password");

        if (newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body("La contraseña no puede estar vacía.");
        }

        try {
            userService.updatePassword(id, newPassword);
            return ResponseEntity.ok().body("Contraseña actualizada correctamente.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al actualizar la contraseña.");
        }
    }

}
