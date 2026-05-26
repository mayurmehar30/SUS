package com.sus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CountHistoryDTO {
    private Long id;
    private LocalDateTime savedAt;
    private String countsJson;
}
