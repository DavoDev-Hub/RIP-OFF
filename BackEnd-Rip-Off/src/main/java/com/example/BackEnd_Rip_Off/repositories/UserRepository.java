package com.example.BackEnd_Rip_Off.repositories;

import com.example.BackEnd_Rip_Off.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByCorreo(String correo);
}
