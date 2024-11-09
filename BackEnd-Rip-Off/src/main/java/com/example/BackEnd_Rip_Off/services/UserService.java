package com.example.BackEnd_Rip_Off.services;

import com.example.BackEnd_Rip_Off.models.User;
import com.example.BackEnd_Rip_Off.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User findByCorreo(String correo) {
        return userRepository.findByCorreo(correo);
    }
}
