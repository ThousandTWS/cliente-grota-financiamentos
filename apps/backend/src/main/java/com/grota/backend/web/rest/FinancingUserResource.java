package com.grota.backend.web.rest;

import com.grota.backend.security.AuthoritiesConstants;
import com.grota.backend.service.FinancingUserService;
import com.grota.backend.domain.FinancingUserRole;
import com.grota.backend.service.dto.FinancingUserCreateRequestDTO;
import com.grota.backend.service.dto.FinancingUserProfileUpdateDTO;
import com.grota.backend.service.dto.FinancingUserResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/users")
@Tag(name = "Grota Financiamentos Users", description = "User management for Grota Financiamentos")
public class FinancingUserResource {

    private final FinancingUserService financingUserService;

    public FinancingUserResource(FinancingUserService financingUserService) {
        this.financingUserService = financingUserService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Criar Usuário", description = "Cria um novo usuário no sistema")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "201", description = "Usúario criado com sucesso", content = @Content(schema = @Schema(implementation = FinancingUserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos fornecidos"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "E-mail já cadastrado"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<FinancingUserResponseDTO> create(@Valid @RequestBody FinancingUserCreateRequestDTO request) {
        return financingUserService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Listar Usuários", description = "Retorna uma lista com todos os usuários do sistema")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lista de usuários retornada com sucesso", content = @Content(schema = @Schema(implementation = FinancingUserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Flux<FinancingUserResponseDTO> findAll(@RequestParam(name = "role", required = false) FinancingUserRole role) {
        return financingUserService.findAll(java.util.Optional.ofNullable(role));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obter perfil do usuário autenticado", description = "Retorna os dados do usuário autenticado")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = FinancingUserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Mono<FinancingUserResponseDTO> getMe() {
        return financingUserService.getCurrentUserProfile();
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Atualizar perfil do usuário autenticado", description = "Atualiza nome e e-mail do usuário autenticado")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = FinancingUserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Mono<FinancingUserResponseDTO> updateMe(@Valid @RequestBody FinancingUserProfileUpdateDTO request) {
        return financingUserService.updateCurrentUserProfile(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Buscar usuário por ID", description = "Busca um usuário pelo identificador")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = FinancingUserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Mono<FinancingUserResponseDTO> findById(@PathVariable Long id) {
        return financingUserService.findById(id);
    }

    @PatchMapping("/{id}/dealer")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Atualizar vínculo do lojista", description = "Associa ou remove o usuário de um lojista")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = FinancingUserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Mono<FinancingUserResponseDTO> updateDealer(@PathVariable Long id, @RequestParam(name = "dealerId", required = false) Long dealerId) {
        return financingUserService.updateDealer(id, dealerId);
    }
}
