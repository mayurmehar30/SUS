package com.sus.repository;

import com.sus.entity.Order;
import com.sus.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderToken(String orderToken);
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findBySchoolId(Long schoolId);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByStatusNotOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findBySchoolIdAndStatus(Long schoolId, OrderStatus status);
    List<Order> findBySchoolIdAndStatusNotInOrderByCreatedAtDesc(Long schoolId, List<OrderStatus> statuses);
    long countByStatus(OrderStatus status);

    @Query(value = "SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status NOT IN ('DRAFT','CANCELLED')", nativeQuery = true)
    BigDecimal sumTotalRevenue();
}
