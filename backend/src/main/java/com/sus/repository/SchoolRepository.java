package com.sus.repository;

import com.sus.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {
    Optional<School> findBySchoolCode(String schoolCode);
    List<School> findByActiveTrue();
    List<School> findByNameContainingIgnoreCaseOrSchoolCodeContainingIgnoreCase(String name, String code);
    boolean existsBySchoolCode(String schoolCode);
    boolean existsByEmail(String email);
}
