package com.sus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryDTO {
    private Long id;
    private String orderNumber;
    private String orderToken;
    private String status;
    private String paymentStatus;
    private SchoolDTO school;
    private List<OrderItemDTO> items;
    private BigDecimal totalAmount;
    private BigDecimal gstAmount;
    private BigDecimal specialDiscount;
    private BigDecimal grandTotal;
    private BigDecimal advanceAmount;
    private BigDecimal remainingAmount;
    private String notes;
    private boolean locked;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private List<AdminEditDTO> adminEdits;
}
