package com.sus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_tracking")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    private String trackingNumber;
    private String carrier;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
