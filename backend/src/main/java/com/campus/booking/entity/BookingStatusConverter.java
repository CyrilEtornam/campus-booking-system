package com.campus.booking.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BookingStatusConverter implements AttributeConverter<Booking.Status, String> {

    @Override
    public String convertToDatabaseColumn(Booking.Status status) {
        return status == null ? null : status.name().toLowerCase();
    }

    @Override
    public Booking.Status convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Booking.Status.valueOf(dbData.toUpperCase());
    }
}
