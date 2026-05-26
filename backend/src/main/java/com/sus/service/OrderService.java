package com.sus.service;

import com.sus.dto.*;
import com.sus.entity.*;
import com.sus.entity.enums.OrderStatus;
import com.sus.entity.enums.PaymentStatus;
import com.sus.exception.ResourceNotFoundException;
import com.sus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SchoolRepository schoolRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductionTrackingRepository productionTrackingRepository;
    private final SchoolService schoolService;
    private final OrderCountHistoryRepository countHistoryRepository;
    private final ProductService productService;
    private final OrderAdminEditRepository adminEditRepository;

    public List<OrderSummaryDTO> getAll() {
        return orderRepository.findAll().stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    public List<OrderSummaryDTO> getByStatus(String status) {
        return orderRepository.findByStatus(OrderStatus.valueOf(status))
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    public OrderSummaryDTO getById(Long id) {
        return toSummaryDTO(findById(id));
    }

    public OrderSummaryDTO getByToken(String token) {
        Order order = orderRepository.findByOrderToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with token: " + token));
        if (!order.getSchool().isActive()) {
            throw new IllegalStateException("School is inactive. Please contact your administrator.");
        }
        return toSummaryDTO(order);
    }

    @Transactional
    public OrderSummaryDTO createOrder(Long schoolId) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        Order order = Order.builder()
                .school(school)
                .orderToken(token)
                .status(OrderStatus.DRAFT)
                .build();

        return toSummaryDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderSummaryDTO getOrCreateDraftOrder(Long schoolId) {
        // Return the most recent active order if one exists (not cancelled or delivered)
        List<OrderStatus> terminal = List.of(OrderStatus.CANCELLED, OrderStatus.DELIVERED);
        return orderRepository.findBySchoolIdAndStatusNotInOrderByCreatedAtDesc(schoolId, terminal)
                .stream().findFirst()
                .map(this::toSummaryDTO)
                .orElseGet(() -> createOrder(schoolId));
    }

    @Transactional
    public OrderSummaryDTO submitOrder(String token, CreateOrderRequest request) {
        Order order = orderRepository.findByOrderToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with token: " + token));

        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new IllegalArgumentException("Order already submitted");
        }

        order.setNotes(request.getNotes());
        order.getItems().clear();

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (OrderItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

                BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : product.getFinalPrice();

                OrderItem item = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .unitPrice(unitPrice)
                        .notes(itemReq.getNotes())
                        .build();

                int qty = 0;
                if (itemReq.getClassStudentCounts() != null) {
                    for (ClassStudentCountDTO csc : itemReq.getClassStudentCounts()) {
                        ClassStudentCount count = ClassStudentCount.builder()
                                .orderItem(item)
                                .className(csc.getClassName())
                                .boysCount(csc.getBoysCount())
                                .girlsCount(csc.getGirlsCount())
                                .remarks(csc.getRemarks())
                                .build();
                        count.computeTotal();
                        qty += count.getTotalCount();
                        item.getClassStudentCounts().add(count);
                    }
                }

                item.setTotalQuantity(qty);
                item.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP));
                order.getItems().add(item);

                BigDecimal itemGst = product.getBasePrice()
                        .multiply(product.getGstPercent())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(qty));

                total = total.add(item.getTotalPrice());
                totalGst = totalGst.add(itemGst);
            }
        }

        order.setTotalAmount(total);
        order.setGstAmount(totalGst);
        order.setGrandTotal(total);
        order.setRemainingAmount(total);
        order.setStatus(OrderStatus.SUBMITTED);
        order.setSubmittedAt(LocalDateTime.now());
        order.setOrderNumber("ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + token.substring(0, 6));

        productionTrackingRepository.save(ProductionTracking.builder()
                .order(order).status(OrderStatus.SUBMITTED).notes("Order submitted by school").build());

        return toSummaryDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderSummaryDTO updateStatus(Long id, UpdateOrderStatusRequest request) {
        Order order = findById(id);
        OrderStatus newStatus = OrderStatus.valueOf(request.getStatus());
        order.setStatus(newStatus);

        productionTrackingRepository.save(ProductionTracking.builder()
                .order(order).status(newStatus).notes(request.getNotes()).build());

        return toSummaryDTO(orderRepository.save(order));
    }

    private Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    public OrderSummaryDTO toSummaryDTO(Order o) {
        List<OrderItemDTO> itemDTOs = o.getItems().stream().map(item -> {
            String imgUrl = item.getProduct().getImages().isEmpty() ? null
                    : item.getProduct().getImages().get(0).getImageUrl();
            List<ClassStudentCountDTO> cscs = item.getClassStudentCounts().stream()
                    .map(c -> ClassStudentCountDTO.builder()
                            .id(c.getId()).className(c.getClassName())
                            .boysCount(c.getBoysCount()).girlsCount(c.getGirlsCount())
                            .totalCount(c.getTotalCount()).remarks(c.getRemarks())
                            .build())
                    .collect(Collectors.toList());
            Long catId = item.getProduct().getCategory() != null ? item.getProduct().getCategory().getId() : null;
            String catName = item.getProduct().getCategory() != null ? item.getProduct().getCategory().getName() : null;
            Long subCatId = item.getProduct().getSubCategory() != null ? item.getProduct().getSubCategory().getId() : null;
            String subCatName = item.getProduct().getSubCategory() != null ? item.getProduct().getSubCategory().getName() : null;
            return OrderItemDTO.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .productSku(item.getProduct().getSku())
                    .productImageUrl(imgUrl)
                    .categoryId(catId)
                    .categoryName(catName)
                    .subCategoryId(subCatId)
                    .subCategoryName(subCatName)
                    .totalQuantity(item.getTotalQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .notes(item.getNotes())
                    .classStudentCounts(cscs)
                    .build();
        }).collect(Collectors.toList());

        List<AdminEditDTO> editHistory = adminEditRepository.findByOrderIdOrderByEditedAtDesc(o.getId())
                .stream()
                .map(e -> AdminEditDTO.builder()
                        .id(e.getId())
                        .editedBy(e.getEditedBy())
                        .editedAt(e.getEditedAt())
                        .summary(e.getSummary())
                        .build())
                .collect(Collectors.toList());

        return OrderSummaryDTO.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .orderToken(o.getOrderToken())
                .status(o.getStatus().name())
                .paymentStatus(o.getPaymentStatus().name())
                .school(schoolService.toDTO(o.getSchool()))
                .items(itemDTOs)
                .totalAmount(o.getTotalAmount())
                .gstAmount(o.getGstAmount())
                .specialDiscount(o.getSpecialDiscount())
                .grandTotal(o.getGrandTotal())
                .advanceAmount(o.getAdvanceAmount())
                .remainingAmount(o.getRemainingAmount())
                .notes(o.getNotes())
                .locked(o.isLocked())
                .submittedAt(o.getSubmittedAt())
                .createdAt(o.getCreatedAt())
                .adminEdits(editHistory)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getAlternativeProducts(Long itemId) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", itemId));
        Product product = item.getProduct();
        if (product.getCategory() == null) {
            return productRepository.findAll().stream()
                    .filter(Product::isActive)
                    .map(productService::toDTO)
                    .collect(Collectors.toList());
        }
        return productRepository.findByCategoryIdAndActiveTrue(product.getCategory().getId())
                .stream()
                .map(productService::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderSummaryDTO adminEditOrder(Long id, AdminEditOrderRequest request) {
        Order order = findById(id);
        String editor = SecurityContextHolder.getContext().getAuthentication().getName();
        List<String> changes = new ArrayList<>();

        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
            changes.add("Updated notes");
        }

        if (request.getPaymentStatus() != null) {
            PaymentStatus newPs = PaymentStatus.valueOf(request.getPaymentStatus());
            if (newPs != order.getPaymentStatus()) {
                changes.add("Payment status: " + order.getPaymentStatus().name() + " → " + newPs.name());
                order.setPaymentStatus(newPs);
            }
        }

        if (request.getAdvanceAmount() != null) {
            BigDecimal prev = order.getAdvanceAmount();
            if (prev.compareTo(request.getAdvanceAmount()) != 0) {
                changes.add("Advance amount: ₹" + prev + " → ₹" + request.getAdvanceAmount());
            }
            order.setAdvanceAmount(request.getAdvanceAmount());
            order.setRemainingAmount(order.getGrandTotal().subtract(request.getAdvanceAmount()).max(BigDecimal.ZERO));
        }

        if (request.getSpecialDiscount() != null) {
            BigDecimal prev = order.getSpecialDiscount();
            if (prev.compareTo(request.getSpecialDiscount()) != 0) {
                changes.add("Special discount: ₹" + prev + " → ₹" + request.getSpecialDiscount());
            }
            order.setSpecialDiscount(request.getSpecialDiscount());
            BigDecimal newGrand = order.getTotalAmount().subtract(request.getSpecialDiscount()).max(BigDecimal.ZERO);
            order.setGrandTotal(newGrand);
            order.setRemainingAmount(newGrand.subtract(order.getAdvanceAmount()).max(BigDecimal.ZERO));
        }

        if (request.getGstPercent() != null) {
            BigDecimal newGst = order.getTotalAmount()
                    .multiply(request.getGstPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            changes.add("GST: " + request.getGstPercent() + "% → ₹" + newGst);
            order.setGstAmount(newGst);
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            Map<Long, AdminEditOrderRequest.EditOrderItemRequest> editMap = request.getItems().stream()
                    .collect(Collectors.toMap(AdminEditOrderRequest.EditOrderItemRequest::getId, i -> i));

            BigDecimal total = BigDecimal.ZERO;
            BigDecimal totalGst = BigDecimal.ZERO;

            for (OrderItem item : order.getItems()) {
                AdminEditOrderRequest.EditOrderItemRequest edit = editMap.get(item.getId());
                if (edit != null) {
                    if (edit.getNewProductId() != null && !edit.getNewProductId().equals(item.getProduct().getId())) {
                        Product newProduct = productRepository.findById(edit.getNewProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product", edit.getNewProductId()));
                        Long currentCatId = item.getProduct().getCategory() != null ? item.getProduct().getCategory().getId() : null;
                        Long newCatId = newProduct.getCategory() != null ? newProduct.getCategory().getId() : null;
                        if (currentCatId == null || !currentCatId.equals(newCatId)) {
                            throw new IllegalArgumentException("Product '" + newProduct.getName() + "' is not in the same category as the current item.");
                        }
                        changes.add("Item '" + item.getProduct().getName() + "' → '" + newProduct.getName() + "'");
                        item.setProduct(newProduct);
                        if (edit.getUnitPrice() == null) {
                            item.setUnitPrice(newProduct.getFinalPrice());
                        }
                    }
                    if (edit.getUnitPrice() != null && edit.getUnitPrice().compareTo(item.getUnitPrice()) != 0) {
                        changes.add("Item '" + item.getProduct().getName() + "' unit price: ₹" + item.getUnitPrice() + " → ₹" + edit.getUnitPrice());
                        item.setUnitPrice(edit.getUnitPrice());
                    }
                    if (edit.getNotes() != null) {
                        item.setNotes(edit.getNotes());
                    }
                    if (edit.getClassStudentCounts() != null) {
                        int prevQty = item.getTotalQuantity();
                        Map<String, int[]> oldCounts = item.getClassStudentCounts().stream()
                                .collect(Collectors.toMap(
                                        ClassStudentCount::getClassName,
                                        c -> new int[]{c.getBoysCount(), c.getGirlsCount()}
                                ));
                        item.getClassStudentCounts().clear();
                        int qty = 0;
                        for (ClassStudentCountDTO csc : edit.getClassStudentCounts()) {
                            ClassStudentCount count = ClassStudentCount.builder()
                                    .orderItem(item)
                                    .className(csc.getClassName())
                                    .boysCount(csc.getBoysCount())
                                    .girlsCount(csc.getGirlsCount())
                                    .remarks(csc.getRemarks())
                                    .build();
                            count.computeTotal();
                            qty += count.getTotalCount();
                            item.getClassStudentCounts().add(count);
                        }
                        item.setTotalQuantity(qty);
                        if (prevQty != qty) {
                            StringBuilder sb = new StringBuilder();
                            sb.append("Item '").append(item.getProduct().getName())
                              .append("' quantities updated (").append(prevQty).append(" → ").append(qty).append(" pcs):");
                            for (ClassStudentCountDTO csc : edit.getClassStudentCounts()) {
                                int[] old = oldCounts.getOrDefault(csc.getClassName(), new int[]{0, 0});
                                if (old[0] != csc.getBoysCount() || old[1] != csc.getGirlsCount()) {
                                    int oldTotal = old[0] + old[1];
                                    int newTotal = csc.getBoysCount() + csc.getGirlsCount();
                                    sb.append("\n  ").append(csc.getClassName())
                                      .append(": Boys ").append(old[0]).append("→").append(csc.getBoysCount())
                                      .append(", Girls ").append(old[1]).append("→").append(csc.getGirlsCount())
                                      .append(" (").append(oldTotal).append("→").append(newTotal).append(")");
                                }
                            }
                            changes.add(sb.toString());
                        }
                    }
                    item.setTotalPrice(item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(item.getTotalQuantity()))
                            .setScale(2, RoundingMode.HALF_UP));

                    BigDecimal itemGst = item.getProduct().getBasePrice()
                            .multiply(item.getProduct().getGstPercent())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(item.getTotalQuantity()));
                    totalGst = totalGst.add(itemGst);
                }
                total = total.add(item.getTotalPrice());
                if (editMap.get(item.getId()) == null) {
                    BigDecimal itemGst = item.getProduct().getBasePrice()
                            .multiply(item.getProduct().getGstPercent())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(item.getTotalQuantity()));
                    totalGst = totalGst.add(itemGst);
                }
            }

            BigDecimal newGrand = total.subtract(order.getSpecialDiscount()).max(BigDecimal.ZERO);
            order.setTotalAmount(total);
            order.setGstAmount(totalGst);
            order.setGrandTotal(newGrand);
            order.setRemainingAmount(newGrand.subtract(order.getAdvanceAmount()).max(BigDecimal.ZERO));
        }

        if (!changes.isEmpty()) {
            adminEditRepository.save(OrderAdminEdit.builder()
                    .order(order)
                    .editedBy(editor)
                    .summary(String.join("\n", changes))
                    .build());
        }

        return toSummaryDTO(orderRepository.save(order));
    }

    @Transactional
    public void lockOrder(Long id, boolean lock) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        order.setLocked(lock);
        orderRepository.save(order);
    }

    @Transactional
    public void saveCounts(String token, SaveCountsRequest request) {
        Order order = orderRepository.findByOrderToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Order", 0L));
        if (order.isLocked()) {
            throw new IllegalStateException("Order is locked and cannot be modified");
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String json = mapper.writeValueAsString(request.getCounts());
            OrderCountHistory history = OrderCountHistory.builder()
                    .order(order)
                    .countsJson(json)
                    .build();
            countHistoryRepository.save(history);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save count history", e);
        }
    }

    public List<CountHistoryDTO> getCountHistory(String token) {
        Order order = orderRepository.findByOrderToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Order", 0L));
        return countHistoryRepository.findByOrderIdOrderBySavedAtDesc(order.getId())
                .stream()
                .map(h -> new CountHistoryDTO(h.getId(), h.getSavedAt(), h.getCountsJson()))
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderSummaryDTO createNewOrderFromToken(String token) {
        Order oldOrder = orderRepository.findByOrderToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with token: " + token));
        if (!oldOrder.isLocked() && oldOrder.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot place a new order while the current order is active and not locked.");
        }
        return createOrder(oldOrder.getSchool().getId());
    }
}
