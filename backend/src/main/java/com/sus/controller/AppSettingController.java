package com.sus.controller;

import com.sus.dto.AppSettingDTO;
import com.sus.service.AppSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class AppSettingController {

    private final AppSettingService service;

    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublic() {
        return ResponseEntity.ok(service.getPublicSettings());
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AppSettingDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> updateAll(@RequestBody List<AppSettingDTO> dtos) {
        service.updateAll(dtos);
        return ResponseEntity.ok().build();
    }
}
