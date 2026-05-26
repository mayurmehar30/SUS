package com.sus.controller;

import com.sus.dto.OrderSummaryDTO;
import com.sus.dto.SchoolDTO;
import com.sus.service.OrderService;
import com.sus.service.SchoolService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<SchoolDTO>> getAll(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(schoolService.search(search));
        }
        return ResponseEntity.ok(schoolService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SchoolDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(schoolService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN')")
    public ResponseEntity<SchoolDTO> create(@Valid @RequestBody SchoolDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN')")
    public ResponseEntity<SchoolDTO> update(@PathVariable Long id, @Valid @RequestBody SchoolDTO dto) {
        return ResponseEntity.ok(schoolService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        schoolService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/generate-token")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SALESMAN')")
    public ResponseEntity<Map<String, String>> generateToken(@PathVariable Long id) {
        OrderSummaryDTO order = orderService.getOrCreateDraftOrder(id);
        String token = order.getOrderToken();
        return ResponseEntity.ok(Map.of("token", token,
                "orderUrl", "http://localhost:3000/order/" + token));
    }
}
