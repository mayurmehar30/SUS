package com.sus.dto;

import lombok.Data;

import java.util.List;

@Data
public class SaveCountsRequest {
    private List<ClassCountDTO> counts;
    private String savedBy;

    @Data
    public static class ClassCountDTO {
        private String className;
        private int boysCount;
        private int girlsCount;
    }
}
