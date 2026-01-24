package org.example.server.modules.proposal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.server.modules.proposal.dto.ProposalEventResponseDTO;
import org.example.server.modules.proposal.dto.ProposalRequestDTO;
import org.example.server.modules.proposal.dto.ProposalResponseDTO;
import org.example.server.modules.proposal.dto.ProposalStatusUpdateDTO;
import org.example.server.modules.proposal.model.ProposalStatus;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.proposal.model.Proposal;
import org.example.server.modules.proposal.model.ProposalEvent;
import org.example.server.modules.seller.model.Seller;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.proposal.repository.ProposalEventRepository;
import org.example.server.modules.proposal.repository.ProposalRepository;
import org.example.server.modules.seller.repository.SellerRepository;
import org.example.server.modules.proposal.factory.ProposalEventFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final DealerRepository dealerRepository;
    private final SellerRepository sellerRepository;
    private final ProposalEventRepository proposalEventRepository;
    private final RealtimeBridgeClient realtimeBridgeClient;
    private final ObjectMapper objectMapper;
    private final ProposalEventFactory proposalEventFactory;
    private final BillingService billingService;

    private static final String REALTIME_CHANNEL = "proposals-bridge";
    private static final String REALTIME_SENDER = "api-service";

    public ProposalService(
            ProposalRepository proposalRepository,
            DealerRepository dealerRepository,
            SellerRepository sellerRepository,
            ProposalEventRepository proposalEventRepository,
            RealtimeBridgeClient realtimeBridgeClient,
            ObjectMapper objectMapper,
            ProposalEventFactory proposalEventFactory,
            BillingService billingService
    ) {
        this.proposalRepository = proposalRepository;
        this.dealerRepository = dealerRepository;
        this.sellerRepository = sellerRepository;
        this.proposalEventRepository = proposalEventRepository;
        this.realtimeBridgeClient = realtimeBridgeClient;
        this.objectMapper = objectMapper;
        this.proposalEventFactory = proposalEventFactory;
        this.billingService = billingService;
    }

    @Transactional
    public ProposalResponseDTO createProposal(ProposalRequestDTO dto, String originIp, String actor) {
        Proposal proposal = new Proposal();
        applyRequestData(proposal, dto);
        Proposal saved = proposalRepository.save(proposal);
        String payload = buildPayload(dto.metadata(), originIp, null);
        appendEvent(
                saved,
                "CREATED",
                null,
                saved.getStatus(),
                normalizeActor(actor),
                dto.notes(),
                payload
        );
        publishRealtime("PROPOSAL_CREATED", Map.of("proposal", toResponse(saved)));
        publishRealtime("PROPOSAL_EVENT_APPENDED", Map.of("proposalId", saved.getId()));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProposalResponseDTO> listProposals(Optional<Long> dealerId, Optional<ProposalStatus> status) {
        List<Proposal> proposals;
        if (dealerId.isPresent() && status.isPresent()) {
            @SuppressWarnings("null")
            Dealer dealer = dealerRepository.findById(dealerId.get())
                    .orElseThrow(() -> new RecordNotFoundException("Dealer não encontrado"));
            proposals = proposalRepository.findByDealerAndStatus(dealer, status.get());
        } else if (dealerId.isPresent()) {
            @SuppressWarnings("null")
            Dealer dealer = dealerRepository.findById(dealerId.get())
                    .orElseThrow(() -> new RecordNotFoundException("Dealer não encontrado"));
            proposals = proposalRepository.findByDealer(dealer);
        } else if (status.isPresent()) {
            proposals = proposalRepository.findByStatus(status.get());
        } else {
            proposals = proposalRepository.findAll();
        }
        return proposals.stream().map(this::toResponse).toList();
    }

    /**
     * Atualiza o status da proposta.
     * Permite mudanças livres entre qualquer status sem validações ou bloqueios.
     * Quando uma proposta muda para PAID, um contrato de cobrança é criado automaticamente (se não existir).
     * 
     * @param id ID da proposta
     * @param dto DTO com o novo status, notas e ator
     * @param originIp IP de origem da requisição
     * @return Proposta atualizada
     */
    @SuppressWarnings("null")
    @Transactional
    public ProposalResponseDTO updateStatus(Long id, ProposalStatusUpdateDTO dto, String originIp) {
        @SuppressWarnings("null")
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Proposta não encontrada"));
        ProposalStatus previousStatus = proposal.getStatus();
        
        if (dto.status() != null) {
            proposal.setStatus(dto.status());
        }
        if (dto.notes() != null) {
            proposal.setNotes(dto.notes());
        }
        
        if (dto.contractNumber() != null && !dto.contractNumber().isBlank() 
                && dto.status() == ProposalStatus.PAID) {
            String currentMetadata = proposal.getMetadata();
            try {
                Map<String, Object> metadataMap = new HashMap<>();
                if (currentMetadata != null && !currentMetadata.isBlank()) {
                    metadataMap = objectMapper.readValue(currentMetadata, 
                            objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
                }
                metadataMap.put("contractNumber", dto.contractNumber());
                proposal.setMetadata(objectMapper.writeValueAsString(metadataMap));
            } catch (JsonProcessingException e) {
            }
        }
        
        Proposal saved = proposalRepository.save(proposal);
        String payload = buildPayload(null, originIp, dto.actor());
        appendEvent(saved, "STATUS_UPDATED", previousStatus, saved.getStatus(), dto.actor(), dto.notes(), payload);
        publishRealtime("PROPOSAL_STATUS_UPDATED", Map.of("proposal", toResponse(saved), "source", dto.actor()));
        publishRealtime("PROPOSAL_EVENT_APPENDED", Map.of("proposalId", saved.getId(), "statusFrom", previousStatus, "statusTo", saved.getStatus(), "actor", dto.actor()));

        if (previousStatus != ProposalStatus.PAID && saved.getStatus() == ProposalStatus.PAID) {
            billingService.createFromPaidProposal(saved);
        }
        return toResponse(saved);
    }

    @Transactional
    public void deleteProposal(Long id) {
        @SuppressWarnings("null")
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Proposta nao encontrada"));
        proposalEventRepository.deleteAllByProposal(proposal);
        proposalRepository.delete(proposal);
    }

    @Transactional(readOnly = true)
    public List<ProposalEventResponseDTO> listEvents(Long proposalId) {
        @SuppressWarnings("null")
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RecordNotFoundException("Proposta não encontrada"));
        return proposalEventRepository.findByProposalOrderByCreatedAtAsc(proposal)
                .stream()
                .map(this::toEventResponse)
                .toList();
    }

    private void applyRequestData(Proposal proposal, ProposalRequestDTO dto) {
        if (dto.dealerId() != null) {
            @SuppressWarnings("null")
            Dealer dealer = dealerRepository.findById(dto.dealerId())
                    .orElseThrow(() -> new RecordNotFoundException("Dealer não encontrado"));
            proposal.setDealer(dealer);
        }
        if (dto.sellerId() != null) {
            @SuppressWarnings("null")
            Optional<Seller> sellerOpt = sellerRepository.findById(dto.sellerId());
            sellerOpt.ifPresent(proposal::setSeller);
        }
        proposal.setCustomerName(dto.customerName());
        proposal.setCustomerCpf(dto.customerCpf());
        proposal.setCustomerBirthDate(dto.customerBirthDate());

        proposal.setCustomerEmail(dto.customerEmail());
        proposal.setCustomerPhone(dto.customerPhone());
        proposal.setCnhCategory(dto.cnhCategory());
        proposal.setHasCnh(dto.hasCnh());
        proposal.setVehiclePlate(dto.vehiclePlate());
        proposal.setFipeCode(dto.fipeCode());
        proposal.setFipeValue(dto.fipeValue());
        proposal.setVehicleBrand(dto.vehicleBrand());
        proposal.setVehicleModel(dto.vehicleModel());
        proposal.setVehicleYear(dto.vehicleYear());
        proposal.setDownPaymentValue(dto.downPaymentValue());
        proposal.setFinancedValue(dto.financedValue());
        proposal.setTermMonths(dto.termMonths());
        proposal.setVehicle0km(Boolean.TRUE.equals(dto.vehicle0km()));
        proposal.setNotes(dto.notes());
        proposal.setMaritalStatus(dto.maritalStatus());
        proposal.setCep(dto.cep());
        proposal.setAddress(dto.address());
        proposal.setAddressNumber(dto.addressNumber());
        proposal.setAddressComplement(dto.addressComplement());
        proposal.setNeighborhood(dto.neighborhood());
        proposal.setUf(dto.uf());
        proposal.setCity(dto.city());
        proposal.setIncome(dto.income());
        proposal.setOtherIncomes(dto.otherIncomes());
        proposal.setMetadata(dto.metadata());
    }

    private ProposalResponseDTO toResponse(Proposal proposal) {
        return new ProposalResponseDTO(
                proposal.getId(),
                proposal.getDealer() != null ? proposal.getDealer().getId() : null,
                proposal.getSeller() != null ? proposal.getSeller().getId() : null,
                proposal.getCustomerName(),
                proposal.getCustomerCpf(),
                proposal.getCustomerBirthDate(),
                proposal.getCustomerEmail(),
                proposal.getCustomerPhone(),
                proposal.getCnhCategory(),
                proposal.isHasCnh(),
                proposal.getVehiclePlate(),
                proposal.getFipeCode(),
                proposal.getFipeValue(),
                proposal.getVehicleBrand(),
                proposal.getVehicleModel(),
                proposal.getVehicleYear(),
                proposal.getDownPaymentValue(),
                proposal.getFinancedValue(),
                proposal.getTermMonths(),
                proposal.getVehicle0km(),
                proposal.getStatus(),
                proposal.getNotes(),
                proposal.getMaritalStatus(),
                proposal.getCep(),
                proposal.getAddress(),
                proposal.getAddressNumber(),
                proposal.getAddressComplement(),
                proposal.getNeighborhood(),
                proposal.getUf(),
                proposal.getCity(),
                proposal.getIncome(),
                proposal.getOtherIncomes(),
                proposal.getMetadata(),
                proposal.getCreatedAt(),
                proposal.getUpdatedAt()
        );
    }

    private ProposalEventResponseDTO toEventResponse(ProposalEvent event) {
        return proposalEventFactory.toResponse(event);
    }

    private void appendEvent(
            Proposal proposal,
            String type,
            ProposalStatus statusFrom,
            ProposalStatus statusTo,
            String actor,
            String note,
            String payload
    ) {
        ProposalEvent event = proposalEventFactory.create(
                proposal,
                type,
                statusFrom,
                statusTo,
                normalizeActor(actor),
                note,
                payload
        );
        proposalEventRepository.save(event);
    }

    private String normalizeActor(String actor) {
        if (actor == null) {
            return null;
        }
        String trimmed = actor.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void publishRealtime(String event, Map<String, Object> payload) {
        realtimeBridgeClient.publish(event, payload, REALTIME_CHANNEL, REALTIME_SENDER);
    }

    private String buildPayload(String metadata, String ip, String actor) {
        Map<String, Object> map = new HashMap<>();
        if (metadata != null && !metadata.isBlank()) {
            map.put("metadata", metadata);
        }
        if (ip != null && !ip.isBlank()) {
            map.put("ip", ip);
        }
        if (actor != null && !actor.isBlank()) {
            map.put("actor", actor);
        }
        if (map.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            return map.toString();
        }
    }
}


