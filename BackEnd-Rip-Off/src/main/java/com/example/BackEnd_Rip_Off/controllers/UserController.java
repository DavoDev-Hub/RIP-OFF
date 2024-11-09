package com.example.BackEnd_Rip_Off.controllers;

import com.example.BackEnd_Rip_Off.models.User;
import com.example.BackEnd_Rip_Off.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User newUser = userService.registerUser(user);
        return ResponseEntity.ok(newUser);
    }

    @GetMapping("/{correo}")
    public ResponseEntity<User> getUserByCorreo(@PathVariable String correo) {
        User user = userService.findByCorreo(correo);
        return ResponseEntity.ok(user);
    }
}
