package com.example.BackEnd_Rip_Off.controllers;

import com.example.BackEnd_Rip_Off.models.User;
import com.example.BackEnd_Rip_Off.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class RegisterController {

    @Autowired
    private UserService userService;

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new User());
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@ModelAttribute("user") User user, Model model) {
        userService.registerUser(user);
        model.addAttribute("success", "Registro exitoso! Ahora puedes iniciar sesión.");
        return "login";  // Redirigimos al formulario de login después del registro exitoso
    }
}
