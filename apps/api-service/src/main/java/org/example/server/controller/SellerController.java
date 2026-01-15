package org.example.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.server.dto.seller.SellerRequestDTO;
import org.example.server.dto.seller.SellerResponseDTO;
import org.example.server.model.User;
import org.example.server.service.SellerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/grota-financiamentos/sellers")
@Tag(name = "Seller", description = "Seller management")
public class SellerController {

        private final SellerService sellerService;

        public SellerController(SellerService sellerService) {
                this.sellerService = sellerService;
        }

        @PostMapping
        @Operation(summary = "Cadastrar vendedor", description = "Cadastra um vendedor no banco de dados")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Vendedor cadastrado com sucesso"),
                        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
        })
        public ResponseEntity<SellerResponseDTO> create(@AuthenticationPrincipal User user,
                        @Valid @RequestBody SellerRequestDTO sellerRequestDTO) {
                SellerResponseDTO seller = sellerService.create(user, sellerRequestDTO);
                return ResponseEntity.ok(seller);
        }

        @GetMapping
        @Operation(summary = "Listar Vendedores", description = "Retorna uma lista de Vendedores, ordenada por nome (10 por página)")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de Vendedores retornada com sucesso"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde.")
        })
        public ResponseEntity<List<SellerResponseDTO>> findAll(@RequestParam(required = false) Long dealerId) {
                List<SellerResponseDTO> selles = sellerService.findAll(dealerId);
                return ResponseEntity.ok().body(selles);
        }

        @GetMapping("/{id}")
        @Operation(summary = "Obter Vendedor por ID", description = "Retorna os dados de um vendedor com base no ID informado.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Vendedor encontrado com sucesso"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado"),
                        @ApiResponse(responseCode = "404", description = "Vendedor não encontrado para o ID fornecido"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor. Tente novamente mais tarde.")
        })
        public ResponseEntity<SellerResponseDTO> findById(@PathVariable Long id) {
                SellerResponseDTO selle = sellerService.findById(id);
                return ResponseEntity.ok().body(selle);
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Remover vendedor", description = "Remove definitivamente um vendedor e seu usuário associado.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Vendedor removido com sucesso"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado"),
                        @ApiResponse(responseCode = "404", description = "Vendedor não encontrado")
        })
        public ResponseEntity<Void> delete(
                        @PathVariable Long id,
                        @AuthenticationPrincipal User user) {
                sellerService.delete(user, id);
                return ResponseEntity.noContent().build();
        }

        @PatchMapping("/{id}/dealer")
        @Operation(summary = "Reatribuir vendedor para outra loja", description = "Atualiza o dealer associado ao vendedor.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Vínculo atualizado com sucesso"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado"),
                        @ApiResponse(responseCode = "404", description = "Vendedor ou lojista não encontrados")
        })
        public ResponseEntity<SellerResponseDTO> updateDealer(
                        @PathVariable Long id,
                        @RequestParam(required = false) Long dealerId,
                        @AuthenticationPrincipal User user) {
                SellerResponseDTO updated = sellerService.updateDealer(user, id, dealerId);
                return ResponseEntity.ok(updated);
        }

        @PutMapping("/{id}")
        @Operation(summary = "Atualizar Vendedor por ID", description = "Atualiza os dados de um vendedor com base no ID informado.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Vendedor atualizado com sucesso"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado"),
                        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
        })
        public ResponseEntity<SellerResponseDTO> update(@PathVariable Long id,
                        @Valid @RequestBody SellerRequestDTO sellerRequestDTO) {
                SellerResponseDTO selle = sellerService.update(id, sellerRequestDTO);
                return ResponseEntity.ok().body(selle);
        }

        @GetMapping("/operator-panel")
        @Operation(summary = "Listar vendedores para painel do operador", description = "Retorna vendedores das lojas vinculadas ao operador. Admin vê todos.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de vendedores retornada"),
                        @ApiResponse(responseCode = "403", description = "Acesso negado - operador não vinculado à loja"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado")
        })
        public ResponseEntity<List<SellerResponseDTO>> findForOperatorPanel(
                        @AuthenticationPrincipal User user,
                        @RequestParam(required = false) Long dealerId) {
                List<SellerResponseDTO> sellers = sellerService.findForOperatorPanel(user, dealerId);
                return ResponseEntity.ok(sellers);
        }

        @GetMapping("/manager-panel")
        @Operation(summary = "Listar vendedores para painel do gestor", description = "Retorna vendedores da loja do gestor. Admin vê todos.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de vendedores retornada"),
                        @ApiResponse(responseCode = "422", description = "Gestor sem loja vinculada"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado")
        })
        public ResponseEntity<List<SellerResponseDTO>> findForManagerPanel(
                        @AuthenticationPrincipal User user) {
                List<SellerResponseDTO> sellers = sellerService.findForManagerPanel(user);
                return ResponseEntity.ok(sellers);
        }
}
