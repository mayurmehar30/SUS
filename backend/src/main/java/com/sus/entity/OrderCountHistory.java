package com.sus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_count_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCountHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @CreationTimestamp
    private LocalDateTime savedAt;

    @Column(name = "counts_json", columnDefinition = "TEXT", nullable = false)
    private String countsJson;

    @Column(name = "saved_by")
    private String savedBy;
}
