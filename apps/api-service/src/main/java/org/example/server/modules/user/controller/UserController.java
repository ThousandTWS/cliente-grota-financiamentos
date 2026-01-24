package org.example.server.modules.user.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.server.modules.user.dto.UserRequestDTO;
import org.example.server.modules.user.dto.UserResponseDTO;
import org.example.server.modules.user.dto.UserProfileUpdateDTO;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.service.UserService;
import org.example.server.modules.user.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/grota-financiamentos/users")
@Tag(name = "User", description = "User management")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @Operation(summary = "Criar Usuário", description = "Cria um novo usuário no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usúario criado com sucesso", content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos fornecidos"),
            @ApiResponse(responseCode = "404", description = "E-mail já cadastrado"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")

    })
    public ResponseEntity<UserResponseDTO> create(@Valid @RequestBody UserRequestDTO userRequestDTO){
        UserResponseDTO userResponseDTO =  userService.create(userRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponseDTO);
    }

    @GetMapping
    @Operation(summary = "Listar Usuários", description = "Retorna uma lista com todos os usuários do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de usuários retornada com sucesso", content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResponseDTO.class)))),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
            @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
    })
    public ResponseEntity<List<UserResponseDTO>> findAll(
            @RequestParam(name = "role", required = false) UserRole role
    ){
        List<UserResponseDTO> userResponseDTOs = userService.findAll(Optional.ofNullable(role));
        return ResponseEntity.ok(userResponseDTOs);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por ID")
    public ResponseEntity<UserResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PatchMapping("/{id}/dealer")
    @Operation(summary = "Atualizar vínculo do lojista", description = "Associa ou remove o usuário de um lojista")
    public ResponseEntity<UserResponseDTO> updateDealer(
            @PathVariable Long id,
            @RequestParam(name = "dealerId", required = false) Long dealerId
    ) {
        return ResponseEntity.ok(userService.updateDealer(id, dealerId));
    }

    @GetMapping("/me")
    @Operation(summary = "Obter perfil do usuário autenticado")
    public ResponseEntity<UserResponseDTO> getMe(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.findById(user.getId()));
    }

    @PutMapping("/me")
    @Operation(summary = "Atualizar perfil do usuário autenticado")
    public ResponseEntity<UserResponseDTO> updateMe(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserProfileUpdateDTO dto
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.updateProfile(user.getId(), dto));
    }
}


