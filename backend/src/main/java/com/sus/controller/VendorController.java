package com.sus.controller;

import com.sus.dto.VendorDTO;
import com.sus.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @GetMapping
    public ResponseEntity<List<VendorDTO>> getAll() {
        return ResponseEntity.ok(vendorService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<VendorDTO>> getActive() {
        return ResponseEntity.ok(vendorService.getActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<VendorDTO> create(@Valid @RequestBody VendorDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<VendorDTO> update(@PathVariable Long id, @Valid @RequestBody VendorDTO dto) {
        return ResponseEntity.ok(vendorService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        vendorService.toggleActive(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vendorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
