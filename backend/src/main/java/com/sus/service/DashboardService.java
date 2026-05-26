package com.sus.service;

import com.sus.dto.DashboardStatsDTO;
import com.sus.entity.enums.OrderStatus;
import com.sus.repository.OrderRepository;
import com.sus.repository.ProductRepository;
import com.sus.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SchoolRepository schoolRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public DashboardStatsDTO getStats() {
        return DashboardStatsDTO.builder()
                .totalSchools(schoolRepository.count())
                .totalProducts(productRepository.count())
                .pendingOrders(orderRepository.countByStatus(OrderStatus.SUBMITTED))
                .activeOrders(orderRepository.countByStatus(OrderStatus.APPROVED) +
                              orderRepository.countByStatus(OrderStatus.CUTTING) +
                              orderRepository.countByStatus(OrderStatus.STITCHING) +
                              orderRepository.countByStatus(OrderStatus.PACKING))
                .inProductionOrders(orderRepository.countByStatus(OrderStatus.CUTTING) +
                                    orderRepository.countByStatus(OrderStatus.STITCHING) +
                                    orderRepository.countByStatus(OrderStatus.PACKING))
                .deliveredOrders(orderRepository.countByStatus(OrderStatus.DELIVERED))
                .totalRevenue(orderRepository.sumTotalRevenue())
                .build();
    }
}
