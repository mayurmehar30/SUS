package com.sus.service;

import com.sus.dto.SchoolDTO;
import com.sus.entity.School;
import com.sus.exception.ResourceNotFoundException;
import com.sus.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchoolService {

    private final SchoolRepository schoolRepository;

    private static final String DEFAULT_CLASSES = "Nursery,Jr. KG,Sr. KG,1st,2nd,3rd,4th,5th,6th,7th,8th,9th,10th";

    private List<String> parseClassNames(String raw) {
        if (raw == null || raw.isBlank()) raw = DEFAULT_CLASSES;
        return java.util.Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String formatClassNames(List<String> names) {
        if (names == null || names.isEmpty()) return DEFAULT_CLASSES;
        return names.stream().map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.joining(","));
    }

    public List<SchoolDTO> getAll() {
        return schoolRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<SchoolDTO> search(String query) {
        return schoolRepository.findByNameContainingIgnoreCaseOrSchoolCodeContainingIgnoreCase(query, query)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public SchoolDTO getById(Long id) {
        return toDTO(findById(id));
    }

    public SchoolDTO create(SchoolDTO dto) {
        if (schoolRepository.existsBySchoolCode(dto.getSchoolCode())) {
            throw new IllegalArgumentException("School code already exists: " + dto.getSchoolCode());
        }
        School school = School.builder()
                .name(dto.getName())
                .contactPerson(dto.getContactPerson())
                .contactPersonRole(dto.getContactPersonRole())
                .mobile(dto.getMobile())
                .email(dto.getEmail())
                .contactPerson2Name(dto.getContactPerson2Name())
                .contactPerson2Role(dto.getContactPerson2Role())
                .contactPerson2Mobile(dto.getContactPerson2Mobile())
                .contactPerson2Email(dto.getContactPerson2Email())
                .address(dto.getAddress())
                .schoolCode(dto.getSchoolCode())
                .logoUrl(dto.getLogoUrl())
                .classNamesRaw(formatClassNames(dto.getClassNames()))
                .active(dto.isActive())
                .build();
        return toDTO(schoolRepository.save(school));
    }

    public SchoolDTO update(Long id, SchoolDTO dto) {
        School school = findById(id);
        school.setName(dto.getName());
        school.setContactPerson(dto.getContactPerson());
        school.setContactPersonRole(dto.getContactPersonRole());
        school.setMobile(dto.getMobile());
        school.setEmail(dto.getEmail());
        school.setContactPerson2Name(dto.getContactPerson2Name());
        school.setContactPerson2Role(dto.getContactPerson2Role());
        school.setContactPerson2Mobile(dto.getContactPerson2Mobile());
        school.setContactPerson2Email(dto.getContactPerson2Email());
        school.setAddress(dto.getAddress());
        school.setLogoUrl(dto.getLogoUrl());
        school.setClassNamesRaw(formatClassNames(dto.getClassNames()));
        school.setActive(dto.isActive());
        return toDTO(schoolRepository.save(school));
    }

    public void delete(Long id) {
        School school = findById(id);
        school.setActive(false);
        schoolRepository.save(school);
    }

    public String generateOrderToken(Long id) {
        School school = findById(id);
        return school.getSchoolCode() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private School findById(Long id) {
        return schoolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("School", id));
    }

    public SchoolDTO toDTO(School school) {
        return SchoolDTO.builder()
                .id(school.getId())
                .name(school.getName())
                .contactPerson(school.getContactPerson())
                .contactPersonRole(school.getContactPersonRole())
                .mobile(school.getMobile())
                .email(school.getEmail())
                .contactPerson2Name(school.getContactPerson2Name())
                .contactPerson2Role(school.getContactPerson2Role())
                .contactPerson2Mobile(school.getContactPerson2Mobile())
                .contactPerson2Email(school.getContactPerson2Email())
                .address(school.getAddress())
                .schoolCode(school.getSchoolCode())
                .logoUrl(school.getLogoUrl())
                .active(school.isActive())
                .createdAt(school.getCreatedAt() != null ? school.getCreatedAt().toString() : null)
                .classNames(parseClassNames(school.getClassNamesRaw()))
                .build();
    }
}
