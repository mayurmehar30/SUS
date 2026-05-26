package com.sus.repository;

import com.sus.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);

    @Query("SELECT p FROM Product p WHERE (:active IS NULL OR p.active = :active) AND (:categoryId IS NULL OR p.category.id = :categoryId) AND (:subCategoryId IS NULL OR p.subCategory.id = :subCategoryId)")
    Page<Product> findByFilter(@Param("active") Boolean active, @Param("categoryId") Long categoryId, @Param("subCategoryId") Long subCategoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE (:active IS NULL OR p.active = :active) AND (:categoryId IS NULL OR p.category.id = :categoryId) AND (:subCategoryId IS NULL OR p.subCategory.id = :subCategoryId) AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> findByFilterAndSearch(@Param("active") Boolean active, @Param("categoryId") Long categoryId, @Param("subCategoryId") Long subCategoryId,
                                        @Param("search") String search, Pageable pageable);
}
