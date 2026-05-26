package com.sus.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    @NotNull
    private Long productId;

    private Long productVariantId;
    private BigDecimal unitPrice;
    private String notes;

    private List<ClassStudentCountDTO> classStudentCounts;
}
