package com.sus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEditDTO {
    private Long id;
    private String editedBy;
    private LocalDateTime editedAt;
    private String summary;
}
