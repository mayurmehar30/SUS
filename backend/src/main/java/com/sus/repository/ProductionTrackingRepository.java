package com.sus.repository;

import com.sus.entity.ProductionTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionTrackingRepository extends JpaRepository<ProductionTracking, Long> {
    List<ProductionTracking> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
