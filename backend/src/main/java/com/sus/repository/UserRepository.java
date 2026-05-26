package com.sus.repository;

import com.sus.entity.User;
import com.sus.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleAndActiveTrue(UserRole role);
    boolean existsByEmail(String email);
}
