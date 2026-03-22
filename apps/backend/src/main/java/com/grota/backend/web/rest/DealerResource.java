package com.grota.backend.web.rest;

import com.grota.backend.security.AuthoritiesConstants;
import com.grota.backend.service.DealerService;
import com.grota.backend.service.dto.DealerAdminRegisterRequestDTO;
import com.grota.backend.service.dto.DealerAdminRegisterResponseDTO;
import com.grota.backend.service.dto.DealerDetailsResponseDTO;
import com.grota.backend.service.dto.DealerDocumentResponseDTO;
import com.grota.backend.service.dto.DealerProfileUpdateRequestDTO;
import com.grota.backend.service.dto.DealerProfileUpdateResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/dealers")
@Tag(name = "Grota Financiamentos Dealers", description = "Dealer management for Grota Financiamentos")
public class DealerResource {

    private final DealerService dealerService;

    public DealerResource(DealerService dealerService) {
        this.dealerService = dealerService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Listar Lojistas", description = "Retorna uma lista de Lojistas, ordenada por nome (10 por página)")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lista de Lojistas retornada com sucesso", content = @Content(schema = @Schema(implementation = DealerAdminRegisterResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde."),
        }
    )
    public Mono<java.util.List<DealerAdminRegisterResponseDTO>> listDealers() {
        return dealerService.listDealers().collectList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Obter Lojistas por ID", description = "Retorna os dados de um Lojista com base no ID informado.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lojista encontrado com sucesso", content = @Content(schema = @Schema(implementation = DealerAdminRegisterResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<DealerAdminRegisterResponseDTO> getDealerById(@PathVariable Long id) {
        return dealerService.getDealerById(id);
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Perfil completo do lojista", description = "Retorna o perfil completo do lojista.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Perfil completo retornado com sucesso", content = @Content(schema = @Schema(implementation = DealerDetailsResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<DealerDetailsResponseDTO> getDealerDetailsById(@PathVariable Long id) {
        return dealerService.getDealerDetailsById(id);
    }

    @GetMapping("/me/details")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.USER + "')")
    @Operation(summary = "Perfil completo do lojista autenticado", description = "Retorna o perfil completo do lojista vinculado ao usuário autenticado.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Perfil completo retornado com sucesso", content = @Content(schema = @Schema(implementation = DealerDetailsResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o usuário autenticado"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<DealerDetailsResponseDTO> getCurrentDealerDetails() {
        return dealerService.getCurrentDealerDetails();
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Obter documentos", description = "Retorna todos os documentos do lojista.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lista de documentos retornado com sucesso", content = @Content(schema = @Schema(implementation = DealerDocumentResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<java.util.List<DealerDocumentResponseDTO>> getDealerDocuments(@PathVariable Long id) {
        return dealerService.listDealerDocuments(id).collectList();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Deletar logista por ID", description = "Operação de deleção de logistas por ID")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Logista deletado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não Autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Lojista não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<Void> deleteDealerById(@PathVariable Long id) {
        return dealerService.deleteDealerById(id);
    }

    @PostMapping("/admin-register")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Cadastro de Lojista (admin)", description = "Permite ao admin cadastrar um lojista com endereço completo e dados dos sócios.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "201", description = "Lojista cadastrado com sucesso", content = @Content(schema = @Schema(implementation = DealerAdminRegisterResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<DealerAdminRegisterResponseDTO> adminRegister(@Valid @RequestBody DealerAdminRegisterRequestDTO request) {
        return dealerService.adminRegister(request);
    }

    @PatchMapping("/profile/update")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.USER + "')")
    @Operation(summary = "Atualizar perfil do lojista", description = "Permite ao lojista alterar seus dados de perfil (empresa, CNPJ, endereço, etc).")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Perfil do lojista atualizado com sucesso", content = @Content(schema = @Schema(implementation = DealerProfileUpdateResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<DealerProfileUpdateResponseDTO> updateProfile(@Valid @RequestBody DealerProfileUpdateRequestDTO request) {
        return dealerService.updateCurrentDealerProfile(request);
    }
}
