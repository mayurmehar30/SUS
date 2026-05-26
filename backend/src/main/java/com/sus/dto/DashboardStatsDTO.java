package com.sus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalSchools;
    private long totalProducts;
    private long pendingOrders;
    private long activeOrders;
    private long inProductionOrders;
    private long deliveredOrders;
    private BigDecimal totalRevenue;
}
