package com.sus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminEditOrderRequest {

    private String notes;
    private BigDecimal advanceAmount;
    private String paymentStatus;
    private BigDecimal specialDiscount;
    private BigDecimal gstPercent;
    private List<EditOrderItemRequest> items;
    private List<Long> removeItemIds;
    private List<NewOrderItemRequest> newItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EditOrderItemRequest {
        private Long id;
        private Long newProductId;
        private BigDecimal unitPrice;
        private String notes;
        private List<ClassStudentCountDTO> classStudentCounts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewOrderItemRequest {
        private Long productId;
        private BigDecimal unitPrice;
        private String notes;
        private Integer totalQuantity;
    }
}
