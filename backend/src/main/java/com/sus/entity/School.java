package com.sus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "schools")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // Contact person 1
    private String contactPerson;
    private String contactPersonRole;
    private String mobile;
    private String email;

    // Contact person 2
    @Column(name = "contact_person_2_name")
    private String contactPerson2Name;

    @Column(name = "contact_person_2_role")
    private String contactPerson2Role;

    @Column(name = "contact_person_2_mobile")
    private String contactPerson2Mobile;

    @Column(name = "contact_person_2_email")
    private String contactPerson2Email;

    @Column(name = "class_names", columnDefinition = "TEXT")
    private String classNamesRaw;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(unique = true, nullable = false)
    private String schoolCode;

    private String logoUrl;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
