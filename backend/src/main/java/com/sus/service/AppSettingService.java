package com.sus.service;

import com.sus.dto.AppSettingDTO;
import com.sus.entity.AppSetting;
import com.sus.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppSettingService {

    private final AppSettingRepository repository;

    public Map<String, String> getPublicSettings() {
        return repository.findAll().stream()
                .collect(Collectors.toMap(AppSetting::getKey, s -> s.getValue() != null ? s.getValue() : ""));
    }

    public List<AppSettingDTO> getAll() {
        return repository.findAll().stream()
                .map(s -> new AppSettingDTO(s.getKey(), s.getValue(), s.getLabel()))
                .collect(Collectors.toList());
    }

    public void updateAll(List<AppSettingDTO> dtos) {
        for (AppSettingDTO dto : dtos) {
            repository.findById(dto.getKey()).ifPresent(s -> {
                s.setValue(dto.getValue());
                repository.save(s);
            });
        }
    }
}
