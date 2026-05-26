package com.sus.controller;

import com.sus.entity.Category;
import com.sus.entity.SubCategory;
import com.sus.exception.ResourceNotFoundException;
import com.sus.repository.CategoryRepository;
import com.sus.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Category> create(@RequestBody Map<String, String> body) {
        Category category = Category.builder()
                .name(body.get("name"))
                .active(true)
                .build();
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        if (body.containsKey("name")) category.setName((String) body.get("name"));
        if (body.containsKey("active")) category.setActive((Boolean) body.get("active"));
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        category.setActive(false);
        categoryRepository.save(category);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/subcategories")
    public ResponseEntity<List<SubCategory>> getSubCategories(@PathVariable Long id) {
        return ResponseEntity.ok(subCategoryRepository.findByCategoryId(id));
    }

    @PostMapping("/{id}/subcategories")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SubCategory> createSubCategory(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        SubCategory sub = SubCategory.builder()
                .name(body.get("name"))
                .category(category)
                .active(true)
                .build();
        return ResponseEntity.ok(subCategoryRepository.save(sub));
    }

    @PutMapping("/{id}/subcategories/{subId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SubCategory> updateSubCategory(@PathVariable Long id, @PathVariable Long subId,
                                                          @RequestBody Map<String, Object> body) {
        SubCategory sub = subCategoryRepository.findById(subId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", subId));
        if (body.containsKey("name")) sub.setName((String) body.get("name"));
        if (body.containsKey("active")) sub.setActive((Boolean) body.get("active"));
        return ResponseEntity.ok(subCategoryRepository.save(sub));
    }

    @DeleteMapping("/{id}/subcategories/{subId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteSubCategory(@PathVariable Long id, @PathVariable Long subId) {
        SubCategory sub = subCategoryRepository.findById(subId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", subId));
        sub.setActive(false);
        subCategoryRepository.save(sub);
        return ResponseEntity.noContent().build();
    }
}
