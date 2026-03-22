package com.grota.backend.web.rest;

import com.grota.backend.service.AuthService;
import com.grota.backend.service.dto.AuthRegisterRequestDTO;
import com.grota.backend.service.dto.DealerAdminRegisterResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/auth")
@Tag(name = "Grota Financiamentos Auth", description = "Authentication and registration for Grota Financiamentos")
public class AuthRegisterResource {

    private final AuthService authService;

    public AuthRegisterResource(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar Lojista", description = "Cadastra um Lojista no banco de dados")
    @ApiResponses(
        value = {
            @ApiResponse(responseCode = "201", description = "Lojista cadastrada com sucesso", content = @Content(schema = @Schema(implementation = DealerAdminRegisterResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Not Found"),
            @ApiResponse(responseCode = "409", description = "Conflict"),
            @ApiResponse(responseCode = "410", description = "Gone"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor"),
        }
    )
    public Mono<DealerAdminRegisterResponseDTO> register(@Valid @RequestBody AuthRegisterRequestDTO request) {
        return authService.registerDealer(request);
    }
}
