package com.campus.booking.repository;

import com.campus.booking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndIsActiveTrue(String email);

    Optional<User> findByIdAndIsActiveTrue(Long id);

    boolean existsByEmail(String email);
}
