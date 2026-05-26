package com.sus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_student_counts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudentCount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(nullable = false)
    private String className;

    @Builder.Default
    private int boysCount = 0;

    @Builder.Default
    private int girlsCount = 0;

    @Builder.Default
    private int totalCount = 0;

    private String remarks;

    @PrePersist
    @PreUpdate
    public void computeTotal() {
        this.totalCount = this.boysCount + this.girlsCount;
    }
}
