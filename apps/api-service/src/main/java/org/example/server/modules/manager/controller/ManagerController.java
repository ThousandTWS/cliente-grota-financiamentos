package org.example.server.modules.manager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.server.modules.manager.dto.ManagerRequestDTO;
import org.example.server.modules.manager.dto.ManagerResponseDTO;
import org.example.server.modules.user.model.User;
import org.example.server.modules.manager.service.ManagerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/grota-financiamentos/managers")
@Tag(name = "Manager", description = "Manager management")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @PostMapping
    @Operation(
            summary = "Cadastrar gestor",
            description = "Cadastra um gestor no banco de dados"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Gestor cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<ManagerResponseDTO> create(@AuthenticationPrincipal User user, @Valid @RequestBody ManagerRequestDTO managerRequestDTO) {
        ManagerResponseDTO manager = managerService.create(user, managerRequestDTO);
        return ResponseEntity.ok(manager);
    }

    @GetMapping
    @Operation(
            summary = "Listar Gestores",
            description = "Retorna uma lista de Gestores, ordenada por nome (10 por página)"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de Gestores retornada com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde.")
    })
    public ResponseEntity<List<ManagerResponseDTO>> findAll(@RequestParam(required = false) Long dealerId){
        List<ManagerResponseDTO> managers = managerService.findAll(dealerId);
        return ResponseEntity.ok().body(managers);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Obter Gestor por ID",
            description = "Retorna os dados de um gestor com base no ID informado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Gestor encontrado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "404", description = "Gestor não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde.")
    })
    public ResponseEntity<ManagerResponseDTO> findById(@PathVariable Long id){
        ManagerResponseDTO manager = managerService.findById(id);
        return ResponseEntity.ok().body(manager);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Remover gestor",
            description = "Remove definitivamente um gestor e seu usuário associado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Gestor removido com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "404", description = "Gestor não encontrado")
    })
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        managerService.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/dealer")
    @Operation(
            summary = "Reatribuir gestor para outra loja",
            description = "Atualiza o dealer associado ao gestor."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vínculo atualizado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "404", description = "Gestor ou lojista não encontrados")
    })
    public ResponseEntity<ManagerResponseDTO> updateDealer(
            @PathVariable Long id,
            @RequestParam(required = false) Long dealerId,
            @AuthenticationPrincipal User user
    ) {
        ManagerResponseDTO updated = managerService.updateDealer(user, id, dealerId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Atualizar Gestor por ID",
            description = "Atualiza os dados de um gestor com base no ID informado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Gestor atualizado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<ManagerResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ManagerRequestDTO managerRequestDTO){
        ManagerResponseDTO manager = managerService.update(id, managerRequestDTO);
        return ResponseEntity.ok().body(manager);
    }
}


