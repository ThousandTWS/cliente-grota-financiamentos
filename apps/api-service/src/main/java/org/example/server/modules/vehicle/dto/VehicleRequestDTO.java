package org.example.server.modules.vehicle.dto;

import jakarta.validation.constraints.*;
import org.example.server.modules.vehicle.model.VehicleCondition;
import org.example.server.modules.vehicle.model.VehicleTransmission;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehicleRequestDTO(
        @NotBlank(message = "O nome é obrigatório")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres")
        String name,

        @NotBlank(message = "A cor é obrigatória")
        @Size(min = 2, max = 50, message = "A cor deve ter entre 2 e 50 caracteres")
        String color,

        @NotBlank(message = "A placa é obrigatória")
        @Size(min=7, max=8, message = "A placa deve ter entre 7 e 8 caracteres")
        String plate,

        @NotNull(message = "O ano do modelo é obrigatório")
        LocalDate modelYear,

        @NotNull(message = "A quilometragem é obrigatória")
        @Min(value = 0, message = "A quilometragem não pode ser negativa")
        @Max(value = 1000000, message = "A quilometragem não pode exceder 1.000.000 km")
        Integer km,

        @NotNull(message = "A condição é obrigatória")
        VehicleCondition vehicleCondition,

        @NotNull(message = "O tipo de transmissão é obrigatório")
        VehicleTransmission vehicleTransmission,

        @NotNull(message = "O preço é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "O preço deve ser maior que zero")
        BigDecimal price
) {}


