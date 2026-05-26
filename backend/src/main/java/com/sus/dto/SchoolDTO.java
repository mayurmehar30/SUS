package com.sus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolDTO {
    private Long id;

    @NotBlank
    private String name;

    // Contact person 1
    private String contactPerson;
    private String contactPersonRole;
    private String mobile;
    private String email;

    // Contact person 2
    private String contactPerson2Name;
    private String contactPerson2Role;
    private String contactPerson2Mobile;
    private String contactPerson2Email;

    private String address;

    @NotBlank
    private String schoolCode;

    private String logoUrl;
    private boolean active;
    private String createdAt;
    private List<String> classNames;
}
