package org.example.server.modules.vehicle.repository;

import org.example.server.modules.vehicle.model.Vehicle;
import org.example.server.modules.vehicle.model.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByDealerId(Long id);
    List<Vehicle> findByDealerIdAndStatus(Long id, VehicleStatus status);
    long countByDealerIdAndStatus(Long id, VehicleStatus status);
}

