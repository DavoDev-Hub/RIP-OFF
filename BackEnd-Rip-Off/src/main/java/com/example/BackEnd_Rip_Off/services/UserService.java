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

    public void updateProfilePicture(String userId, String newProfilePictureUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con el ID: " + userId));
        user.setProfilePictureUrl(newProfilePictureUrl);
        userRepository.save(user);
    }

    public User findById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public void updatePassword(String userId, String newPassword) {
        // Buscar el usuario por ID
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con el ID: " + userId));

        // Validar que la nueva contraseña cumpla con los requisitos mínimos (opcional)
        if (!isStrongPassword(newPassword)) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
        }

        // Encriptar la nueva contraseña
        String encryptedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encryptedPassword);

        // Guardar los cambios en la base de datos
        userRepository.save(user);
    }

    // Método opcional para validar la fortaleza de la contraseña
    private boolean isStrongPassword(String password) {
        return password.length() >= 8
                && password.matches(".*[A-Z].*") // Al menos una letra mayúscula
                && password.matches(".*[a-z].*") // Al menos una letra minúscula
                && password.matches(".*\\d.*"); // Al menos un número
    }

}
