package com.campus.booking.repository;

import com.campus.booking.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface FacilityRepository extends JpaRepository<Facility, Long>,
        JpaSpecificationExecutor<Facility> {

    Optional<Facility> findByIdAndIsActiveTrue(Long id);
}
