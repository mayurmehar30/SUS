package com.sus.repository;

import com.sus.entity.OrderCountHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderCountHistoryRepository extends JpaRepository<OrderCountHistory, Long> {
    List<OrderCountHistory> findByOrderIdOrderBySavedAtDesc(Long orderId);
}
