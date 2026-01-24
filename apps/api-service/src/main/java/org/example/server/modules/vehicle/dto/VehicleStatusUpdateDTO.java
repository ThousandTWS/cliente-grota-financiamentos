package org.example.server.modules.vehicle.dto;

import jakarta.validation.constraints.NotNull;
import org.example.server.modules.vehicle.model.VehicleStatus;

public record VehicleStatusUpdateDTO(
        @NotNull(message = "O status do veículo é obrigatório.")
        VehicleStatus status
) {}


