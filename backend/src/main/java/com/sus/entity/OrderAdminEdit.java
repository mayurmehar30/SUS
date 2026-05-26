package com.sus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_admin_edits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderAdminEdit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String editedBy;

    @CreationTimestamp
    private LocalDateTime editedAt;

    @Column(columnDefinition = "TEXT")
    private String summary;
}
