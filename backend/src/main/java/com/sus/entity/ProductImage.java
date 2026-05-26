package com.sus.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sus.entity.enums.ProductImageType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProductImageType imageType = ProductImageType.FRONT;

    @Builder.Default
    private int sortOrder = 0;
}
