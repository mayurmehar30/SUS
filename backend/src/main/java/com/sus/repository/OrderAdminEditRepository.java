package com.sus.repository;

import com.sus.entity.OrderAdminEdit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderAdminEditRepository extends JpaRepository<OrderAdminEdit, Long> {
    List<OrderAdminEdit> findByOrderIdOrderByEditedAtDesc(Long orderId);
}
