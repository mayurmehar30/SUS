package com.sus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDTO {
    private Long id;

    @NotBlank
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private boolean active;
}
