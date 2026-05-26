package com.sus.service;

import com.sus.dto.VendorDTO;
import com.sus.entity.Vendor;
import com.sus.exception.ResourceNotFoundException;
import com.sus.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;

    public List<VendorDTO> getAll() {
        return vendorRepository.findAllByOrderByNameAsc().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<VendorDTO> getActive() {
        return vendorRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public VendorDTO getById(Long id) {
        return toDTO(findById(id));
    }

    @Transactional
    public VendorDTO create(VendorDTO dto) {
        Vendor vendor = Vendor.builder()
                .name(dto.getName())
                .contactPerson(dto.getContactPerson())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .gstNumber(dto.getGstNumber())
                .active(dto.isActive())
                .build();
        return toDTO(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorDTO update(Long id, VendorDTO dto) {
        Vendor vendor = findById(id);
        vendor.setName(dto.getName());
        vendor.setContactPerson(dto.getContactPerson());
        vendor.setPhone(dto.getPhone());
        vendor.setEmail(dto.getEmail());
        vendor.setAddress(dto.getAddress());
        vendor.setGstNumber(dto.getGstNumber());
        vendor.setActive(dto.isActive());
        return toDTO(vendorRepository.save(vendor));
    }

    @Transactional
    public void toggleActive(Long id) {
        Vendor vendor = findById(id);
        vendor.setActive(!vendor.isActive());
        vendorRepository.save(vendor);
    }

    @Transactional
    public void delete(Long id) {
        vendorRepository.delete(findById(id));
    }

    private Vendor findById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", id));
    }

    public VendorDTO toDTO(Vendor v) {
        return VendorDTO.builder()
                .id(v.getId())
                .name(v.getName())
                .contactPerson(v.getContactPerson())
                .phone(v.getPhone())
                .email(v.getEmail())
                .address(v.getAddress())
                .gstNumber(v.getGstNumber())
                .active(v.isActive())
                .build();
    }
}
