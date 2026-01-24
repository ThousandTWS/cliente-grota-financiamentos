package org.example.server.modules.dealer.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.server.modules.dealer.dto.DealerAdminRegistrationRequestDTO;
import org.example.server.modules.dealer.dto.DealerDetailsResponseDTO;
import org.example.server.modules.dealer.dto.DealerLogoResponseDTO;
import org.example.server.modules.dealer.dto.DealerLogoUploadRequest;
import org.example.server.modules.dealer.dto.DealerProfileDTO;
import org.example.server.modules.dealer.dto.DealerRegistrationRequestDTO;
import org.example.server.modules.dealer.dto.DealerRegistrationResponseDTO;
import org.example.server.modules.document.dto.DocumentResponseDTO;
import org.example.server.modules.vehicle.dto.VehicleResponseDTO;
import org.example.server.modules.user.model.User;
import org.example.server.modules.dealer.service.DealerService;
import org.example.server.modules.dealer.service.DealerLogoService;
import org.example.server.modules.vehicle.service.VehicleService;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/dealers")
@Tag(name = "Dealer", description = "Dealer management")
public class DealerController {

    private final DealerService dealerService;
    private final VehicleService vehicleService;
    private final DealerLogoService dealerLogoService;

    public DealerController(DealerService dealerService, VehicleService vehicleService, DealerLogoService dealerLogoService) {
        this.dealerService = dealerService;
        this.vehicleService = vehicleService;
        this.dealerLogoService = dealerLogoService;
    }

    @PostMapping("/admin-register")
    @Operation(
            summary = "Cadastro de Lojista (admin)",
            description = "Permite ao admin cadastrar um lojista com endereço completo e dados dos sócios."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Lojista cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerRegistrationResponseDTO> createFromAdmin(
            @Valid @RequestBody DealerAdminRegistrationRequestDTO dto
    ) {
        DealerRegistrationResponseDTO responseDTO = dealerService.createFromAdmin(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
    }

    @GetMapping
    @Operation(
            summary = "Listar Lojistas",
            description = "Retorna uma lista de Lojistas, ordenada por nome (10 por página)"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de Lojistas retornada com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde.")
    })
    public ResponseEntity<List<DealerRegistrationResponseDTO>> findAll(){
        List<DealerRegistrationResponseDTO> dealerList = dealerService.findAll();
        return ResponseEntity.ok().body(dealerList);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Obter Lojistas por ID",
            description = "Retorna os dados de um Lojista com base no ID informado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lojista encontrado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerRegistrationResponseDTO> findById(@PathVariable Long id){
        DealerRegistrationResponseDTO dealer = dealerService.findById(id);
        return ResponseEntity.ok().body(dealer);
    }

    @GetMapping("/me/details")
    @Operation(
            summary = "Perfil completo do lojista autenticado",
            description = "Retorna o perfil completo do lojista vinculado ao usuário autenticado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil completo retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o usuário autenticado"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerDetailsResponseDTO> findDetailsDealerForCurrentUser(
            @AuthenticationPrincipal(expression = "id") Long userId
    ){
        DealerDetailsResponseDTO dealerDetails = dealerService.findDetailDealerByUserId(userId);
        return ResponseEntity.ok(dealerDetails);
    }

    @GetMapping("/{id}/documents")
    @Operation(
            summary = "Obter documentos",
            description = "Retorna todos os documentos do lojista."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de documentos retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<List<DocumentResponseDTO>> getDealerDocuments(@PathVariable Long id){
        List<DocumentResponseDTO> documentsList = dealerService.getDealerDocuments(id);
        return ResponseEntity.ok().body(documentsList);
    }

    @GetMapping("/{id}/vehicles")
    @Operation(
            summary = "Lista de de veiculos do lojista",
            description = "Retorna a lista de todos os veiculos do lojista."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de veiculos retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<List<VehicleResponseDTO>> getVehicleByDealer(@PathVariable Long id){
        List<VehicleResponseDTO> vehiclesDto = vehicleService.getVehicleByDealer(id);
        return ResponseEntity.ok().body(vehiclesDto);
    }

    @PutMapping("/me")
    @Operation(
            summary = "Atualizar Lojista por ID",
            description = "Atualiza os dados de um Lojista com base no ID informado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lojista atualizado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerRegistrationResponseDTO> update(
            @AuthenticationPrincipal(expression = "id") Long id,
            @Valid
            @RequestBody DealerRegistrationRequestDTO dealerRegistrationRequestDTO)
    {
        DealerRegistrationResponseDTO dealer = dealerService.update(id, dealerRegistrationRequestDTO);
        return ResponseEntity.ok().body(dealer);
    }

    @PutMapping("/profile/complete")
    @Operation(
            summary = "Completar perfil do lojista",
            description = "Permite ao lojista preencher informações adicionais após o registro inicial."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil completo com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerProfileDTO> completeProfile(
            @AuthenticationPrincipal(expression = "id") Long id,
            @Valid @RequestBody DealerProfileDTO dealerProfileDTO)
    {
        DealerProfileDTO profileDTO = dealerService.completeProfile(id, dealerProfileDTO);
        return ResponseEntity.ok(profileDTO);
    }

    @PatchMapping("/profile/update")
    @Operation(
            summary = "Atualizar perfil do lojista",
            description = "Permite ao lojista alterar seus dados de perfil (empresa, CNPJ, endereço, etc)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil do lojista atualizado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerProfileDTO> updateProfile(@AuthenticationPrincipal(expression = "id") Long userId, @Valid @RequestBody DealerProfileDTO dto) {
        DealerProfileDTO updated = dealerService.updateProfile(userId, dto);
        return ResponseEntity.ok(updated);
    }

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload da logomarca do lojista",
            description = "Permite ao lojista enviar uma nova logomarca para o painel.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @io.swagger.v3.oas.annotations.media.Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DealerLogoUploadRequest.class)
                    )
            )
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logomarca atualizada com sucesso",
                    content = @io.swagger.v3.oas.annotations.media.Content(
                            schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DealerLogoResponseDTO.class)
                    )),
            @ApiResponse(responseCode = "400", description = "Arquivo inválido"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Usuário sem permissão para alterar a logomarca"),
            @ApiResponse(responseCode = "500", description = "Erro ao enviar a imagem para o Cloudinary")
    })
    public ResponseEntity<DealerLogoResponseDTO> uploadLogo(
            @AuthenticationPrincipal User user,
            @ModelAttribute DealerLogoUploadRequest uploadRequest
    ) {
        DealerLogoResponseDTO response = dealerLogoService.uploadLogo(user, uploadRequest.getFile());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/details")
    @Operation(
            summary = "Perfil completo do lojista",
            description = "Retorna o perfil completo do lojista."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil completo retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<DealerDetailsResponseDTO> findDetailsDealer(@PathVariable Long id){
        DealerDetailsResponseDTO dealerDetails = dealerService.findDetailDealer(id);
        return ResponseEntity.ok(dealerDetails);
    }
    
    
    @DeleteMapping("/{id}")
        @Operation(
            summary = "Deletar logista por ID",
            description = "Operação de deleção de logistas por ID"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logista deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dealerService.delete(id);
        return ResponseEntity.noContent().build();
    }



}


