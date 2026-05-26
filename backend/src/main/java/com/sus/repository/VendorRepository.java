package com.sus.repository;

import com.sus.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findAllByOrderByNameAsc();
    List<Vendor> findByActiveTrueOrderByNameAsc();
}
