package com.sus.controller;

import com.sus.dto.*;
import com.sus.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ── Admin endpoints (require auth) ───────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN','FACTORY_MANAGER')")
    public ResponseEntity<List<OrderSummaryDTO>> getAll(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(orderService.getByStatus(status));
        }
        return ResponseEntity.ok(orderService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN','FACTORY_MANAGER')")
    public ResponseEntity<OrderSummaryDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PostMapping("/create/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN')")
    public ResponseEntity<OrderSummaryDTO> createOrder(@PathVariable Long schoolId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(schoolId));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN','FACTORY_MANAGER')")
    public ResponseEntity<OrderSummaryDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request));
    }

    @GetMapping("/items/{itemId}/alternatives")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<ProductDTO>> getAlternativeProducts(@PathVariable Long itemId) {
        return ResponseEntity.ok(orderService.getAlternativeProducts(itemId));
    }

    @PutMapping("/{id}/edit")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<OrderSummaryDTO> adminEditOrder(
            @PathVariable Long id,
            @RequestBody AdminEditOrderRequest request) {
        return ResponseEntity.ok(orderService.adminEditOrder(id, request));
    }

    @PostMapping("/{id}/lock")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> lockOrder(@PathVariable Long id) {
        orderService.lockOrder(id, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> unlockOrder(@PathVariable Long id) {
        orderService.lockOrder(id, false);
        return ResponseEntity.ok().build();
    }

    // ── Public endpoints (no auth — school rep access) ───────────────────────

    @GetMapping("/public/{token}")
    public ResponseEntity<OrderSummaryDTO> getPublicOrder(@PathVariable String token) {
        return ResponseEntity.ok(orderService.getByToken(token));
    }

    @PostMapping("/public/{token}/submit")
    public ResponseEntity<OrderSummaryDTO> submitOrder(
            @PathVariable String token,
            @RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.submitOrder(token, request));
    }

    @PutMapping("/public/{token}/counts")
    public ResponseEntity<Void> saveCounts(
            @PathVariable String token,
            @RequestBody SaveCountsRequest request) {
        orderService.saveCounts(token, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/public/{token}/count-history")
    public ResponseEntity<List<CountHistoryDTO>> getCountHistory(@PathVariable String token) {
        return ResponseEntity.ok(orderService.getCountHistory(token));
    }

    @PostMapping("/public/{token}/new-order")
    public ResponseEntity<OrderSummaryDTO> createNewOrder(@PathVariable String token) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createNewOrderFromToken(token));
    }
}
