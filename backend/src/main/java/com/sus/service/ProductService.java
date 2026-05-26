package com.sus.service;

import com.sus.dto.ProductDTO;
import com.sus.dto.ProductImageDTO;
import com.sus.dto.ProductVariantDTO;
import com.sus.entity.Category;
import com.sus.entity.Product;
import com.sus.entity.ProductImage;
import com.sus.entity.SubCategory;
import com.sus.entity.Vendor;
import com.sus.entity.enums.ProductImageType;
import com.sus.exception.ResourceNotFoundException;
import com.sus.repository.CategoryRepository;
import com.sus.repository.ProductRepository;
import com.sus.repository.SubCategoryRepository;
import com.sus.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final VendorRepository vendorRepository;

    @Transactional(readOnly = true)
    public Page<ProductDTO> getAll(Boolean active, Long categoryId, Long subCategoryId, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return productRepository.findByFilterAndSearch(active, categoryId, subCategoryId, search, pageable).map(this::toDTO);
        }
        return productRepository.findByFilter(active, categoryId, subCategoryId, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public ProductDTO getById(Long id) {
        return toDTO(findById(id));
    }

    @Transactional
    public ProductDTO create(ProductDTO dto) {
        if (dto.getSku() != null && productRepository.existsBySku(dto.getSku())) {
            throw new IllegalArgumentException("SKU already exists: " + dto.getSku());
        }

        Category category = dto.getCategoryId() != null
                ? categoryRepository.findById(dto.getCategoryId()).orElse(null) : null;
        SubCategory subCategory = dto.getSubCategoryId() != null
                ? subCategoryRepository.findById(dto.getSubCategoryId()).orElse(null) : null;
        Vendor vendor = dto.getVendorId() != null
                ? vendorRepository.findById(dto.getVendorId()).orElse(null) : null;

        Product product = Product.builder()
                .name(dto.getName())
                .category(category)
                .subCategory(subCategory)
                .vendor(vendor)
                .sku(dto.getSku())
                .description(dto.getDescription())
                .fabricType(dto.getFabricType())
                .color(dto.getColor())
                .gender(dto.getGender())
                .season(dto.getSeason())
                .basePrice(dto.getBasePrice() != null ? dto.getBasePrice() : BigDecimal.ZERO)
                .gstPercent(dto.getGstPercent() != null ? dto.getGstPercent() : BigDecimal.ZERO)
                .discountPercent(dto.getDiscountPercent() != null ? dto.getDiscountPercent() : BigDecimal.ZERO)
                .sizeOptions(dto.getSizeOptions())
                .active(dto.isActive())
                .build();

        product.setFinalPrice(computeFinalPrice(product));
        Product saved = productRepository.save(product);
        if (dto.getImages() != null) {
            for (int i = 0; i < dto.getImages().size(); i++) {
                ProductImageDTO imgDto = dto.getImages().get(i);
                ProductImage img = ProductImage.builder()
                        .product(saved)
                        .imageUrl(imgDto.getImageUrl())
                        .imageType(parseImageType(imgDto.getImageType()))
                        .sortOrder(i)
                        .build();
                saved.getImages().add(img);
            }
            productRepository.save(saved);
        }
        return toDTO(saved);
    }

    @Transactional
    public ProductDTO update(Long id, ProductDTO dto) {
        Product product = findById(id);

        Category category = dto.getCategoryId() != null
                ? categoryRepository.findById(dto.getCategoryId()).orElse(null) : null;
        SubCategory subCategory = dto.getSubCategoryId() != null
                ? subCategoryRepository.findById(dto.getSubCategoryId()).orElse(null) : null;
        Vendor vendor = dto.getVendorId() != null
                ? vendorRepository.findById(dto.getVendorId()).orElse(null) : null;

        product.setName(dto.getName());
        product.setCategory(category);
        product.setSubCategory(subCategory);
        product.setVendor(vendor);
        product.setDescription(dto.getDescription());
        product.setFabricType(dto.getFabricType());
        product.setColor(dto.getColor());
        product.setGender(dto.getGender());
        product.setSeason(dto.getSeason());
        product.setBasePrice(dto.getBasePrice() != null ? dto.getBasePrice() : BigDecimal.ZERO);
        product.setGstPercent(dto.getGstPercent() != null ? dto.getGstPercent() : BigDecimal.ZERO);
        product.setDiscountPercent(dto.getDiscountPercent() != null ? dto.getDiscountPercent() : BigDecimal.ZERO);
        product.setSizeOptions(dto.getSizeOptions());
        product.setActive(dto.isActive());
        product.setFinalPrice(computeFinalPrice(product));

        if (dto.getImages() != null) {
            product.getImages().clear();
            for (int i = 0; i < dto.getImages().size(); i++) {
                ProductImageDTO imgDto = dto.getImages().get(i);
                ProductImage img = ProductImage.builder()
                        .product(product)
                        .imageUrl(imgDto.getImageUrl())
                        .imageType(parseImageType(imgDto.getImageType()))
                        .sortOrder(i)
                        .build();
                product.getImages().add(img);
            }
        }
        return toDTO(productRepository.save(product));
    }

    public void toggleActive(Long id) {
        Product product = findById(id);
        product.setActive(!product.isActive());
        productRepository.save(product);
    }

    public void delete(Long id) {
        productRepository.delete(findById(id));
    }

    private ProductImageType parseImageType(String type) {
        try { return type != null ? ProductImageType.valueOf(type) : ProductImageType.FRONT; }
        catch (Exception e) { return ProductImageType.FRONT; }
    }

    private BigDecimal computeFinalPrice(Product p) {
        if (p.getBasePrice() == null || p.getBasePrice().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal price = p.getBasePrice();
        // Apply GST
        if (p.getGstPercent() != null && p.getGstPercent().compareTo(BigDecimal.ZERO) > 0) {
            price = price.add(price.multiply(p.getGstPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        // Apply discount
        if (p.getDiscountPercent() != null && p.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
            price = price.subtract(price.multiply(p.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        return price.setScale(2, RoundingMode.HALF_UP);
    }

    private Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public ProductDTO toDTO(Product p) {
        return ProductDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .subCategoryId(p.getSubCategory() != null ? p.getSubCategory().getId() : null)
                .subCategoryName(p.getSubCategory() != null ? p.getSubCategory().getName() : null)
                .sku(p.getSku())
                .description(p.getDescription())
                .fabricType(p.getFabricType())
                .color(p.getColor())
                .gender(p.getGender())
                .season(p.getSeason())
                .basePrice(p.getBasePrice())
                .gstPercent(p.getGstPercent())
                .discountPercent(p.getDiscountPercent())
                .finalPrice(p.getFinalPrice())
                .sizeOptions(p.getSizeOptions())
                .vendorId(p.getVendor() != null ? p.getVendor().getId() : null)
                .vendorName(p.getVendor() != null ? p.getVendor().getName() : null)
                .active(p.isActive())
                .images(p.getImages().stream().map(img -> ProductImageDTO.builder()
                        .id(img.getId()).imageUrl(img.getImageUrl())
                        .imageType(img.getImageType().name()).sortOrder(img.getSortOrder())
                        .build()).collect(Collectors.toList()))
                .variants(p.getVariants().stream().map(v -> ProductVariantDTO.builder()
                        .id(v.getId()).size(v.getSize()).color(v.getColor())
                        .price(v.getPrice()).stock(v.getStock()).active(v.isActive())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
