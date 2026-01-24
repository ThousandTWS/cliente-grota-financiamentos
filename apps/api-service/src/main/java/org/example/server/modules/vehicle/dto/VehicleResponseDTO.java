package org.example.server.modules.vehicle.dto;

import org.example.server.modules.vehicle.model.VehicleStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehicleResponseDTO(
        Long id,
        String name,
        String color,
        String plate,
        LocalDate modelYear,
        Integer km,
        String condition,
        String transmission,
        BigDecimal price,
        VehicleStatus status,
        Long dealer
) {}


