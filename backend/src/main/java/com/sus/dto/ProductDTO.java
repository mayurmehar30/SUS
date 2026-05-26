package com.sus.dto;

import jakarta.validation.constraints.NotBlank;
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
public class ProductDTO {
    private Long id;

    @NotBlank
    private String name;

    private Long categoryId;
    private String categoryName;
    private Long subCategoryId;
    private String subCategoryName;
    private String sku;
    private String description;
    private String fabricType;
    private String color;
    private String gender;
    private String season;
    private BigDecimal basePrice;
    private BigDecimal gstPercent;
    private BigDecimal discountPercent;
    private BigDecimal finalPrice;
    private String sizeOptions;
    private Long vendorId;
    private String vendorName;
    private boolean active;
    private List<ProductImageDTO> images;
    private List<ProductVariantDTO> variants;
}
