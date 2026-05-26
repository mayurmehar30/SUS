package com.sus.repository;

import com.sus.entity.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    List<SubCategory> findByCategoryIdAndActiveTrue(Long categoryId);
    List<SubCategory> findByCategoryId(Long categoryId);
}
