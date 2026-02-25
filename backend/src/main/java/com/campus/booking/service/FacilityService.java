package com.campus.booking.service;

import com.campus.booking.dto.request.FacilityRequest;
import com.campus.booking.dto.response.FacilityResponse;
import com.campus.booking.entity.Facility;
import com.campus.booking.exception.ResourceNotFoundException;
import com.campus.booking.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public List<FacilityResponse> getAll(String type, String search,
                                          Integer minCapacity, Integer maxCapacity) {

        Specification<Facility> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (StringUtils.hasText(type))
                predicates.add(cb.equal(root.get("facilityType"), type));

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("location")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            if (minCapacity != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            if (maxCapacity != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("capacity"), maxCapacity));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return facilityRepository.findAll(spec).stream()
                .map(FacilityResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacilityResponse getById(Long id) {
        Facility f = facilityRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + id));
        return FacilityResponse.from(f);
    }

    @Transactional
    public FacilityResponse create(FacilityRequest req) {
        Facility f = Facility.builder()
                .name(req.getName())
                .location(req.getLocation())
                .capacity(req.getCapacity())
                .description(req.getDescription())
                .amenities(req.getAmenities() != null ? req.getAmenities() : List.of())
                .facilityType(req.getFacilityType())
                .imageUrl(req.getImageUrl())
                .requiresApproval(req.isRequiresApproval())
                .isActive(true)
                .build();
        return FacilityResponse.from(facilityRepository.save(f));
    }

    @Transactional
    public FacilityResponse update(Long id, FacilityRequest req) {
        Facility f = facilityRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + id));

        if (StringUtils.hasText(req.getName()))     f.setName(req.getName());
        if (StringUtils.hasText(req.getLocation())) f.setLocation(req.getLocation());
        if (req.getCapacity() > 0)                  f.setCapacity(req.getCapacity());
        if (req.getDescription() != null)           f.setDescription(req.getDescription());
        if (req.getAmenities() != null)             f.setAmenities(req.getAmenities());
        if (req.getFacilityType() != null)          f.setFacilityType(req.getFacilityType());
        if (req.getImageUrl() != null)              f.setImageUrl(req.getImageUrl());
        f.setRequiresApproval(req.isRequiresApproval());

        return FacilityResponse.from(facilityRepository.save(f));
    }

    @Transactional
    public void delete(Long id) {
        Facility f = facilityRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + id));
        f.setActive(false);
        facilityRepository.save(f);
    }
}
