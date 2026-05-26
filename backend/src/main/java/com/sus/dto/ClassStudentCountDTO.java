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
public class ClassStudentCountDTO {
    private Long id;

    @NotBlank
    private String className;

    private int boysCount;
    private int girlsCount;
    private int totalCount;
    private String remarks;
}
