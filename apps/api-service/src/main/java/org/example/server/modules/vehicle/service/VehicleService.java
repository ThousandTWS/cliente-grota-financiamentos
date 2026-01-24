package org.example.server.modules.vehicle.service;

import org.example.server.modules.vehicle.dto.VehicleMapper;
import org.example.server.modules.vehicle.dto.VehicleRequestDTO;
import org.example.server.modules.vehicle.dto.VehicleResponseDTO;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.vehicle.model.VehicleStatus;
import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.user.model.User;
import org.example.server.modules.vehicle.model.Vehicle;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DealerRepository dealerRepository;
    private final VehicleMapper vehicleMapper;

    public VehicleService(VehicleRepository vehicleRepository, DealerRepository dealerRepository, VehicleMapper vehicleMapper) {
        this.vehicleRepository = vehicleRepository;
        this.dealerRepository = dealerRepository;
        this.vehicleMapper = vehicleMapper;
    }

    public VehicleResponseDTO create(User user, VehicleRequestDTO vehicleRequestDTO){
        Dealer dealer = dealerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RecordNotFoundException(user.getId()));

        Vehicle vehicle = vehicleMapper.toEntity(vehicleRequestDTO);
        vehicle.setDealer(dealer);
        dealer.addVehicle(vehicle);

        return vehicleMapper.toDTO(vehicleRepository.save(vehicle));
    }

    public java.util.List<VehicleResponseDTO> findAll() {
        return vehicleRepository.findAll().stream()
                .map(vehicleMapper::toDTO)
                .toList();
    }

    public VehicleResponseDTO findById(Long id) {
        return vehicleMapper.toDTO(vehicleRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id)));
    }

    public VehicleResponseDTO update(User user, Long vehicleId, VehicleRequestDTO vehicleRequestDTO) {
        Vehicle vehicleUpdate = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RecordNotFoundException(vehicleId));

        boolean isOwner = vehicleUpdate.getDealer().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin){
            throw new AccessDeniedException("Você não tem permissão para alterar este veículo");
        }

        vehicleUpdate.setName(vehicleRequestDTO.name());
        vehicleUpdate.setColor(vehicleRequestDTO.color());
        vehicleUpdate.setKm(vehicleRequestDTO.km());
        vehicleUpdate.setPlate(vehicleRequestDTO.plate());
        vehicleUpdate.setModelYear(vehicleRequestDTO.modelYear());
        vehicleUpdate.setPrice(vehicleRequestDTO.price());
        vehicleUpdate.setCondition(vehicleRequestDTO.vehicleCondition());
        vehicleUpdate.setTransmission(vehicleRequestDTO.vehicleTransmission());

        return vehicleMapper.toDTO(vehicleRepository.save(vehicleUpdate));
    }

    public java.util.List<VehicleResponseDTO> getVehicleByDealer(Long id) {
        return vehicleRepository.findByDealerId(id).stream()
                .map(vehicleMapper::toDTO)
                .toList();
    }

    public VehicleResponseDTO updateStatus(User user, Long id, VehicleStatus status) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        boolean isOwner = vehicle.getDealer().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isAdmin && !isOwner){
            throw new AccessDeniedException("Você não tem permissão para alterar este veículo");
        }

        vehicle.setStatus(status);
        return vehicleMapper.toDTO(vehicleRepository.save(vehicle));
    }

}


