package com.example.BackEnd_Rip_Off.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @Email(message = "Correo electrónico no es válido")
    @NotBlank(message = "El correo electrónico es obligatorio")
    private String correo;

    @Column(nullable = false)
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    @Column
    private String genero;

    @Column(name = "nombre_de_perfil")
    private String nombreDePerfil;
    
    @Column(name = "profile_picture_url", nullable = true)
    private String profilePictureUrl;

}
