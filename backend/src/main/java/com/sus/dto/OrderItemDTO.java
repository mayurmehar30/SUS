package com.sus.dto;

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
public class OrderItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String productImageUrl;
    private List<String> productImages;
    private Long productVariantId;
    private Long categoryId;
    private String categoryName;
    private Long subCategoryId;
    private String subCategoryName;
    private int totalQuantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String notes;
    private List<ClassStudentCountDTO> classStudentCounts;
}
