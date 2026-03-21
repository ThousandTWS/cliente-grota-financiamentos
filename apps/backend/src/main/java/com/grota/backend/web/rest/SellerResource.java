package com.grota.backend.web.rest;

import com.grota.backend.security.AuthoritiesConstants;
import com.grota.backend.service.SellerService;
import com.grota.backend.service.dto.SellerResponseDTO;
import com.grota.backend.service.dto.SellerUpdateRequestDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/sellers")
@Tag(name = "Grota Financiamentos Sellers", description = "Seller management for Grota Financiamentos")
public class SellerResource {

    private final SellerService sellerService;

    public SellerResource(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Cadastrar vendedor", description = "Cadastra um vendedor no banco de dados")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "201", description = "Vendedor cadastrado com sucesso", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<SellerResponseDTO> create(@Valid @RequestBody SellerUpdateRequestDTO request) {
        return sellerService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Listar Vendedores", description = "Retorna uma lista de Vendedores, ordenada por nome (10 por página)")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lista de Vendedores retornada com sucesso", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde."),
        }
    )
    public Flux<SellerResponseDTO> findAll(@RequestParam(name = "dealerId", required = false) Long dealerId) {
        return sellerService.findAll(java.util.Optional.ofNullable(dealerId));
    }

    @GetMapping("/operator-panel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar vendedores para painel do operador", description = "Retorna vendedores das lojas vinculadas ao operador. Admin vê todos.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lista de vendedores retornada", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado - operador não vinculado à loja"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Flux<SellerResponseDTO> findAllForOperatorPanel(@RequestParam(name = "dealerId", required = false) Long dealerId) {
        return sellerService.findAllForOperatorPanel(java.util.Optional.ofNullable(dealerId));
    }

    @GetMapping("/manager-panel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar vendedores para painel do gestor", description = "Retorna vendedores da loja do gestor. Admin vê todos.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Lista de vendedores retornada", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "422", description = "Gestor sem loja vinculada"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Flux<SellerResponseDTO> findAllForManagerPanel() {
        return sellerService.findAllForManagerPanel();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Obter Vendedor por ID", description = "Retorna os dados de um vendedor com base no ID informado.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Vendedor encontrado com sucesso", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Vendedor não encontrado para o ID fornecido"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde."),
        }
    )
    public Mono<SellerResponseDTO> findById(@PathVariable Long id) {
        return sellerService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Atualizar Vendedor por ID", description = "Atualiza os dados de um vendedor com base no ID informado.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Vendedor atualizado com sucesso", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<SellerResponseDTO> update(@PathVariable Long id, @Valid @RequestBody SellerUpdateRequestDTO request) {
        return sellerService.update(id, request);
    }

    @PatchMapping("/{id}/dealer")
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Reatribuir vendedor para outra loja", description = "Atualiza o dealer associado ao vendedor.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "200", description = "Vínculo atualizado com sucesso", content = @Content(schema = @Schema(implementation = SellerResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Vendedor ou lojista não encontrados"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Mono<SellerResponseDTO> updateDealer(@PathVariable Long id, @RequestParam(name = "dealerId", required = false) Long dealerId) {
        return sellerService.updateDealer(id, dealerId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('" + AuthoritiesConstants.ADMIN + "')")
    @Operation(summary = "Remover vendedor", description = "Remove definitivamente um vendedor e seu usuário associado.")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "204", description = "Vendedor removido com sucesso"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Vendedor não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error"),
        }
    )
    public Mono<Void> delete(@PathVariable Long id) {
        return sellerService.delete(id);
    }
}
