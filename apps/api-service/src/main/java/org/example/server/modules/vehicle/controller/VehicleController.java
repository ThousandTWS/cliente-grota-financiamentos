package org.example.server.modules.vehicle.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.server.modules.vehicle.dto.VehicleRequestDTO;
import org.example.server.modules.vehicle.dto.VehicleResponseDTO;
import org.example.server.modules.vehicle.dto.VehicleStatusUpdateDTO;
import org.example.server.modules.user.model.User;
import org.example.server.modules.vehicle.service.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/vehicles")
@Tag(name = "Vehicle", description = "vehicle management")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    @Operation(
            summary = "Cadastrar novo veículo",
            description = "Permite o registro de um novo veículo no sistema."
    )
    @ApiResponses (value = {
            @ApiResponse(responseCode = "201", description = "Veículo cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Requisição inválida: dados do veículo incorretos ou ausentes."),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<VehicleResponseDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VehicleRequestDTO vehicleRequestDTO)
    {
        VehicleResponseDTO vehicleResponseDTO = vehicleService.create(user, vehicleRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleResponseDTO);
    }

    @GetMapping
    @Operation(
            summary = "Listar todos os veículos",
            description = "Retorna uma lista contendo todos os veículos registrados no sistema."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de veículos retornada com sucesso."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
    })
    public ResponseEntity<java.util.List<VehicleResponseDTO>> findAll(){
        java.util.List<VehicleResponseDTO> vehicleResponseDTO = vehicleService.findAll();
        return ResponseEntity.ok().body(vehicleResponseDTO);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Buscar veículo por ID",
            description = "Retorna os detalhes de um veículo específico utilizando seu identificador único (ID)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Veículo encontrado e retornado com sucesso."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "404", description = "Veículo não encontrado para o ID fornecido."),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
    })
    public ResponseEntity<VehicleResponseDTO> findById(@PathVariable Long id){
        VehicleResponseDTO vehicleResponseDTO = vehicleService.findById(id);
        return ResponseEntity.ok().body(vehicleResponseDTO);
    }

    @PutMapping("/{vehicleId}")
    @Operation(
            summary = "Atualizar dados do veículo",
            description = "Permite a alteração dos dados de um veículo."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Veículo atualizado com sucesso."),
            @ApiResponse(responseCode = "400", description = "Requisição inválida: dados do veículo incorretos ou ausentes."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "404", description = "Veículo não encontrado para o ID fornecido."),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
    })
    public ResponseEntity<VehicleResponseDTO> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long vehicleId,
            @Valid
            @RequestBody VehicleRequestDTO vehicleRequestDTO)
    {
        VehicleResponseDTO vehicleUpdated = vehicleService.update(user, vehicleId, vehicleRequestDTO);
        return ResponseEntity.ok().body(vehicleUpdated);
    }

    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Atualizar status do veículo",
            description = "Altera o status de um veículo (DISPONÍVEL, VENDIDO, INATIVO, etc.)"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status inválido"),
            @ApiResponse(responseCode = "404", description = "Veículo não encontrado"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<VehicleResponseDTO> updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody VehicleStatusUpdateDTO request)
    {
        VehicleResponseDTO vehicleUpdate = vehicleService.updateStatus(user, id, request.status());
        return ResponseEntity.ok(vehicleUpdate);
    }
}


