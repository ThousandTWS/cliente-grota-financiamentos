package org.example.server.modules.billing.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.server.modules.billing.dto.*;
import org.example.server.modules.billing.model.BillingStatus;
import org.example.server.core.exception.generic.DataAlreadyExistsException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.billing.model.BillingContract;
import org.example.server.modules.billing.model.BillingInstallment;
import org.example.server.modules.billing.model.BillingOccurrence;
import org.example.server.modules.proposal.model.Proposal;
import org.example.server.modules.billing.repository.BillingContractRepository;
import org.example.server.modules.billing.repository.BillingInstallmentRepository;
import org.example.server.modules.billing.repository.BillingOccurrenceRepository;
import org.example.server.modules.proposal.repository.ProposalRepository;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BillingService {

    private final BillingContractRepository contractRepository;
    private final BillingInstallmentRepository installmentRepository;
    private final BillingOccurrenceRepository occurrenceRepository;
    private final ProposalRepository proposalRepository;
    private final DealerRepository dealerRepository;
    private final ObjectMapper objectMapper;

    public BillingService(
            BillingContractRepository contractRepository,
            BillingInstallmentRepository installmentRepository,
            BillingOccurrenceRepository occurrenceRepository,
            ProposalRepository proposalRepository,
            DealerRepository dealerRepository,
            ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.installmentRepository = installmentRepository;
        this.occurrenceRepository = occurrenceRepository;
        this.proposalRepository = proposalRepository;
        this.dealerRepository = dealerRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public BillingContractDetailsDTO createContract(BillingContractCreateDTO dto) {
        if (contractRepository.findByContractNumber(dto.contractNumber()).isPresent()) {
            throw new DataAlreadyExistsException("Contrato ja cadastrado na cobranca");
        }
        BillingContract contract = new BillingContract();
        applyContractData(contract, dto);

        List<BillingInstallment> installments = buildInstallments(contract, dto);
        contract.setInstallments(installments);
        BillingContract saved = contractRepository.save(contract);

        return toDetails(saved, installments, List.of());
    }

    @Transactional
    public BillingContractDetailsDTO createFromPaidProposal(Proposal proposal) {
        if (proposal == null || proposal.getId() == null) {
            throw new RecordNotFoundException("Proposta nao encontrada para cobranca");
        }

        Optional<BillingContract> existing = contractRepository.findByProposalId(proposal.getId());
        if (existing.isPresent()) {
            BillingContract current = existing.get();
            List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(current);
            List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(current);
            return toDetails(current, installments, occurrences);
        }

        Map<String, Object> metadata = parseMetadata(proposal.getMetadata());
        String contractNumber = resolveContractNumber(metadata, proposal.getId());

        BillingContract contract = new BillingContract();
        contract.setContractNumber(contractNumber);
        contract.setProposalId(proposal.getId());
        contract.setStatus(BillingStatus.EM_ABERTO);

        LocalDate paidAt = resolveDate(metadata, "paidAt", "paymentDate");
        if (paidAt == null) {
            paidAt = LocalDate.now();
        }
        LocalDate startDate = resolveDate(metadata, "startDate", "dataBase");
        if (startDate == null) {
            startDate = paidAt;
        }
        contract.setPaidAt(paidAt);
        contract.setStartDate(startDate);

        // Priorizar valor do metadata (vem do modal), senão usar valor da proposta
        BigDecimal metadataFinancedValue = resolveBigDecimal(metadata, "financedValue");
        BigDecimal financedValue = metadataFinancedValue != null
                ? metadataFinancedValue
                : proposal.getFinancedValue() != null
                        ? proposal.getFinancedValue()
                        : BigDecimal.ZERO;

        // Priorizar quantidade de parcelas do metadata (vem do modal)
        Integer metadataInstallments = resolveInteger(metadata, "installmentsTotal", "parcelas");
        Integer installmentsTotal = metadataInstallments != null && metadataInstallments > 0
                ? metadataInstallments
                : proposal.getTermMonths() != null && proposal.getTermMonths() > 0
                        ? proposal.getTermMonths()
                        : 1;

        // Priorizar valor da parcela do metadata (vem do modal)
        BigDecimal installmentValue = resolveBigDecimal(metadata, "installmentValue", "parcelaValor");
        if (installmentValue == null) {
            if (installmentsTotal != null && installmentsTotal > 0 && financedValue != null) {
                installmentValue = financedValue.divide(
                        BigDecimal.valueOf(installmentsTotal),
                        2,
                        RoundingMode.HALF_UP);
            } else {
                installmentValue = BigDecimal.ZERO;
            }
        }

        contract.setFinancedValue(financedValue);
        contract.setInstallmentValue(installmentValue);
        contract.setInstallmentsTotal(installmentsTotal);

        contract.setCustomerName(proposal.getCustomerName());
        contract.setCustomerDocument(proposal.getCustomerCpf());
        contract.setCustomerBirthDate(proposal.getCustomerBirthDate());
        contract.setCustomerEmail(proposal.getCustomerEmail());
        contract.setCustomerPhone(proposal.getCustomerPhone());
        contract.setCustomerAddress(
                buildAddress(proposal.getAddress(), proposal.getAddressNumber(), proposal.getAddressComplement()));
        contract.setCustomerCity(proposal.getCity());
        contract.setCustomerState(proposal.getUf());

        contract.setProfessionalEnterprise(resolveString(metadata, "enterprise", "empresa", "professionalEnterprise"));
        contract.setProfessionalFunction(resolveString(metadata, "enterpriseFunction", "funcao", "function", "cargo"));
        contract.setProfessionalAdmissionDate(resolveDate(metadata, "admissionDate", "dataAdmissao", "admissao"));
        contract.setProfessionalIncome(proposal.getIncome());
        contract.setProfessionalOtherIncomes(proposal.getOtherIncomes());
        contract.setProfessionalMaritalStatus(proposal.getMaritalStatus());

        contract.setVehicleBrand(proposal.getVehicleBrand());
        contract.setVehicleModel(proposal.getVehicleModel());
        contract.setVehicleYear(proposal.getVehicleYear());
        contract.setVehiclePlate(proposal.getVehiclePlate());
        contract.setVehicleRenavam(resolveString(metadata, "vehicleRenavam", "renavam", "renavan"));
        contract.setDutIssued(resolveBoolean(metadata, "dutIssued", "dutEmitido", "dut"));

        LocalDate firstDueDate = resolveDate(metadata, "firstDueDate", "vencimento");
        if (firstDueDate == null) {
            firstDueDate = startDate;
        }

        List<BillingInstallment> installments = buildInstallments(contract, installmentValue, installmentsTotal,
                firstDueDate);
        contract.setInstallments(installments);
        BillingContract saved = contractRepository.save(contract);

        return toDetails(saved, installments, List.of());
    }

    @Transactional(readOnly = true)
    public List<BillingContractSummaryDTO> listContracts(
            Optional<String> name,
            Optional<String> document,
            Optional<String> contractNumber,
            Optional<BillingStatus> status) {
        String nameFilter = normalizeFilter(name.orElse(null));
        String documentFilter = normalizeFilter(document.orElse(null));
        String contractFilter = normalizeFilter(contractNumber.orElse(null));
        BillingStatus statusFilter = status.orElse(null);

        Specification<BillingContract> spec = (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (nameFilter != null) {
                String normalized = "%" + nameFilter.toLowerCase() + "%";
                predicates.add(
                        builder.like(
                                builder.lower(root.get("customerName").as(String.class)),
                                normalized));
            }
            if (documentFilter != null) {
                predicates.add(
                        builder.like(
                                root.get("customerDocument").as(String.class),
                                "%" + documentFilter + "%"));
            }
            if (contractFilter != null) {
                predicates.add(
                        builder.like(
                                root.get("contractNumber").as(String.class),
                                "%" + contractFilter + "%"));
            }
            if (statusFilter != null) {
                predicates.add(builder.equal(root.get("status"), statusFilter));
            }
            return predicates.isEmpty()
                    ? builder.conjunction()
                    : builder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        List<BillingContract> contracts = contractRepository.findAll(
                spec,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return contracts.stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public BillingContractDetailsDTO getContractDetails(String contractNumber) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(contract);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(contract);
        return toDetails(contract, installments, occurrences);
    }

    @Transactional
    public BillingOccurrenceDTO addOccurrence(String contractNumber, BillingOccurrenceRequestDTO dto) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        BillingOccurrence occurrence = new BillingOccurrence();
        occurrence.setContract(contract);
        occurrence.setDate(dto.date());
        occurrence.setContact(dto.contact());
        occurrence.setNote(dto.note());
        BillingOccurrence saved = occurrenceRepository.save(occurrence);
        return toOccurrence(saved);
    }

    @Transactional
    public BillingContractDetailsDTO updateContract(String contractNumber, BillingContractUpdateDTO dto) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        if (dto.paidAt() != null) {
            contract.setPaidAt(dto.paidAt());
        }

        if (dto.startDate() != null) {
            contract.setStartDate(dto.startDate());
        }

        syncContractStatus(contract);
        BillingContract saved = contractRepository.save(contract);
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(saved);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(saved);
        return toDetails(saved, installments, occurrences);
    }

    @Transactional
    public BillingContractDetailsDTO updateVehicle(String contractNumber, BillingVehicleUpdateDTO dto) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        if (dto.plate() != null) {
            contract.setVehiclePlate(dto.plate());
        }
        if (dto.renavam() != null) {
            contract.setVehicleRenavam(dto.renavam());
        }
        if (dto.dutIssued() != null) {
            contract.setDutIssued(dto.dutIssued());
        }
        if (dto.dutPaid() != null) {
            contract.setDutPaid(dto.dutPaid());
        }
        if (dto.dutPaidDate() != null) {
            contract.setDutPaidDate(dto.dutPaidDate());
        }

        BillingContract saved = contractRepository.save(contract);
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(saved);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(saved);
        return toDetails(saved, installments, occurrences);
    }

    @Transactional
    public BillingInstallmentDTO updateInstallmentDueDate(
            String contractNumber,
            Integer installmentNumber,
            BillingInstallmentDueDateUpdateDTO dto) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        BillingInstallment installment = installmentRepository.findByContractAndNumber(contract, installmentNumber)
                .orElseThrow(() -> new RecordNotFoundException("Parcela nao encontrada"));

        installment.setDueDate(dto.dueDate());
        BillingInstallment saved = installmentRepository.save(installment);

        syncContractStatus(contract);
        contractRepository.save(contract);

        return toInstallment(saved);
    }

    @Transactional
    public BillingInstallmentDTO updateInstallment(
            String contractNumber,
            Integer installmentNumber,
            BillingInstallmentUpdateDTO dto) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        BillingInstallment installment = installmentRepository.findByContractAndNumber(contract, installmentNumber)
                .orElseThrow(() -> new RecordNotFoundException("Parcela nao encontrada"));

        boolean paid = Boolean.TRUE.equals(dto.paid());
        installment.setPaid(paid);
        if (paid) {
            installment.setPaidAt(dto.paidAt() != null ? dto.paidAt() : LocalDate.now());
        } else {
            installment.setPaidAt(null);
        }
        BillingInstallment saved = installmentRepository.save(installment);

        contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        List<BillingInstallment> updatedInstallments = installmentRepository.findByContractOrderByNumberAsc(contract);
        syncContractStatusWithInstallments(contract, updatedInstallments);
        contractRepository.save(contract);

        return toInstallment(saved);
    }

    private void syncContractStatus(BillingContract contract) {
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(contract);
        syncContractStatusWithInstallments(contract, installments);
    }

    private void syncContractStatusWithInstallments(BillingContract contract, List<BillingInstallment> installments) {
        if (installments == null || installments.isEmpty()) {
            contract.setStatus(BillingStatus.EM_ABERTO);
            return;
        }

        boolean allPaid = installments.stream().allMatch(BillingInstallment::isPaid);
        if (allPaid) {
            contract.setStatus(BillingStatus.PAGO);
            return;
        }

        LocalDate today = LocalDate.now();
        boolean hasOverdue = installments.stream()
                .filter(inst -> !inst.isPaid())
                .anyMatch(inst -> inst.getDueDate() != null && inst.getDueDate().isBefore(today));

        if (hasOverdue) {
            contract.setStatus(BillingStatus.EM_ATRASO);
        } else {
            contract.setStatus(BillingStatus.EM_ABERTO);
        }
    }

    @Transactional
    public BillingContractDetailsDTO updateContractNumber(String currentContractNumber,
            BillingContractNumberUpdateDTO dto) {
        BillingContract contract = contractRepository.findByContractNumber(currentContractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        String newContractNumber = dto.contractNumber();
        if (newContractNumber == null || newContractNumber.isBlank()) {
            throw new IllegalArgumentException("Numero do contrato nao pode ser vazio");
        }

        if (contractRepository.findByContractNumber(newContractNumber).isPresent()) {
            throw new DataAlreadyExistsException("Numero de contrato ja existe");
        }

        contract.setContractNumber(newContractNumber);
        BillingContract saved = contractRepository.save(contract);
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(saved);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(saved);
        return toDetails(saved, installments, occurrences);
    }

    @Transactional
    public void deleteContract(String contractNumber) {
        BillingContract contract = contractRepository.findByContractNumber(contractNumber)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        contractRepository.delete(contract);
    }

    @Transactional(readOnly = true)
    public BillingContractDetailsDTO getContractDetailsById(Long id) {
        BillingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(contract);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(contract);
        return toDetails(contract, installments, occurrences);
    }

    @Transactional
    public BillingContractDetailsDTO updateContractById(Long id, BillingContractUpdateDTO dto) {
        BillingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        if (dto.paidAt() != null) {
            contract.setPaidAt(dto.paidAt());
        }

        if (dto.startDate() != null) {
            contract.setStartDate(dto.startDate());
        }

        syncContractStatus(contract);
        BillingContract saved = contractRepository.save(contract);
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(saved);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(saved);
        return toDetails(saved, installments, occurrences);
    }

    @Transactional
    public void deleteContractById(Long id) {
        BillingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        contractRepository.delete(contract);
    }

    @Transactional
    public BillingContractDetailsDTO updateVehicleById(Long id, BillingVehicleUpdateDTO dto) {
        BillingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        if (dto.plate() != null) {
            contract.setVehiclePlate(dto.plate());
        }
        if (dto.renavam() != null) {
            contract.setVehicleRenavam(dto.renavam());
        }
        if (dto.dutIssued() != null) {
            contract.setDutIssued(dto.dutIssued());
        }
        if (dto.dutPaid() != null) {
            contract.setDutPaid(dto.dutPaid());
        }
        if (dto.dutPaidDate() != null) {
            contract.setDutPaidDate(dto.dutPaidDate());
        }

        BillingContract saved = contractRepository.save(contract);
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(saved);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(saved);
        return toDetails(saved, installments, occurrences);
    }

    @Transactional
    public BillingInstallmentDTO updateInstallmentById(Long contractId, Integer installmentNumber,
            BillingInstallmentUpdateDTO dto) {
        BillingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        BillingInstallment installment = installmentRepository.findByContractAndNumber(contract, installmentNumber)
                .orElseThrow(() -> new RecordNotFoundException("Parcela nao encontrada"));

        boolean paid = Boolean.TRUE.equals(dto.paid());
        installment.setPaid(paid);
        if (dto.paidAt() != null) {
            installment.setPaidAt(dto.paidAt());
        } else if (!paid) {
            installment.setPaidAt(null);
        }

        BillingInstallment saved = installmentRepository.save(installment);
        contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        List<BillingInstallment> updatedInstallments = installmentRepository.findByContractOrderByNumberAsc(contract);
        syncContractStatusWithInstallments(contract, updatedInstallments);

        return toInstallment(saved);
    }

    @Transactional
    public BillingInstallmentDTO updateInstallmentDueDateById(Long contractId, Integer installmentNumber,
            BillingInstallmentDueDateUpdateDTO dto) {
        BillingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        BillingInstallment installment = installmentRepository.findByContractAndNumber(contract, installmentNumber)
                .orElseThrow(() -> new RecordNotFoundException("Parcela nao encontrada"));

        installment.setDueDate(dto.dueDate());
        BillingInstallment saved = installmentRepository.save(installment);
        return toInstallment(saved);
    }

    @Transactional
    public BillingContractDetailsDTO updateContractNumberById(Long id, BillingContractNumberUpdateDTO dto) {
        BillingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        String newContractNumber = dto.contractNumber();
        if (newContractNumber == null || newContractNumber.isBlank()) {
            throw new IllegalArgumentException("Numero do contrato nao pode ser vazio");
        }

        if (contractRepository.findByContractNumber(newContractNumber).isPresent()) {
            throw new DataAlreadyExistsException("Numero de contrato ja existe");
        }

        contract.setContractNumber(newContractNumber);
        BillingContract saved = contractRepository.save(contract);
        List<BillingInstallment> installments = installmentRepository.findByContractOrderByNumberAsc(saved);
        List<BillingOccurrence> occurrences = occurrenceRepository.findByContractOrderByDateDesc(saved);
        return toDetails(saved, installments, occurrences);
    }

    @Transactional
    public BillingOccurrenceDTO addOccurrenceById(Long id, BillingOccurrenceRequestDTO dto) {
        BillingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));
        BillingOccurrence occurrence = new BillingOccurrence();
        occurrence.setContract(contract);
        occurrence.setDate(dto.date());
        occurrence.setContact(dto.contact());
        occurrence.setNote(dto.note());
        BillingOccurrence saved = occurrenceRepository.save(occurrence);
        return toOccurrence(saved);
    }

    private void applyContractData(BillingContract contract, BillingContractCreateDTO dto) {
        contract.setContractNumber(dto.contractNumber());
        contract.setProposalId(dto.proposalId());
        contract.setStatus(dto.status());
        contract.setPaidAt(dto.paidAt());
        contract.setStartDate(dto.startDate());
        contract.setFinancedValue(dto.financedValue());
        contract.setInstallmentValue(dto.installmentValue());
        contract.setInstallmentsTotal(dto.installmentsTotal());
        contract.setCustomerName(dto.customerName());
        contract.setCustomerDocument(dto.customerDocument());
        contract.setCustomerBirthDate(dto.customerBirthDate());
        contract.setCustomerEmail(dto.customerEmail());
        contract.setCustomerPhone(dto.customerPhone());
        contract.setCustomerAddress(dto.customerAddress());
        contract.setCustomerCity(dto.customerCity());
        contract.setCustomerState(dto.customerState());
        contract.setProfessionalEnterprise(dto.professionalEnterprise());
        contract.setProfessionalFunction(dto.professionalFunction());
        contract.setProfessionalAdmissionDate(dto.professionalAdmissionDate());
        contract.setProfessionalIncome(dto.professionalIncome());
        contract.setProfessionalOtherIncomes(dto.professionalOtherIncomes());
        contract.setProfessionalMaritalStatus(dto.professionalMaritalStatus());
        contract.setVehicleBrand(dto.vehicleBrand());
        contract.setVehicleModel(dto.vehicleModel());
        contract.setVehicleYear(dto.vehicleYear());
        contract.setVehiclePlate(dto.vehiclePlate());
        contract.setVehicleRenavam(dto.vehicleRenavam());
        contract.setDutIssued(dto.dutIssued());
    }

    private List<BillingInstallment> buildInstallments(BillingContract contract, BillingContractCreateDTO dto) {
        if (dto.installments() != null && !dto.installments().isEmpty()) {
            List<BillingInstallment> custom = new ArrayList<>();
            for (BillingInstallmentInputDTO installment : dto.installments()) {
                BillingInstallment entity = new BillingInstallment();
                entity.setContract(contract);
                entity.setNumber(installment.number());
                entity.setDueDate(installment.dueDate());
                entity.setAmount(installment.amount());
                entity.setPaid(Boolean.TRUE.equals(installment.paid()));
                entity.setPaidAt(installment.paidAt());
                custom.add(entity);
            }
            return custom;
        }

        List<BillingInstallment> generated = new ArrayList<>();
        LocalDate firstDueDate = dto.firstDueDate() != null
                ? dto.firstDueDate()
                : dto.startDate();
        for (int i = 0; i < dto.installmentsTotal(); i++) {
            BillingInstallment installment = new BillingInstallment();
            installment.setContract(contract);
            installment.setNumber(i + 1);
            installment.setDueDate(firstDueDate.plusDays(30L * i));
            installment.setAmount(dto.installmentValue());
            installment.setPaid(false);
            generated.add(installment);
        }
        return generated;
    }

    private List<BillingInstallment> buildInstallments(
            BillingContract contract,
            BigDecimal installmentValue,
            Integer installmentsTotal,
            LocalDate firstDueDate) {
        int total = installmentsTotal != null && installmentsTotal > 0 ? installmentsTotal : 1;
        List<BillingInstallment> generated = new ArrayList<>();
        for (int i = 0; i < total; i++) {
            BillingInstallment installment = new BillingInstallment();
            installment.setContract(contract);
            installment.setNumber(i + 1);
            installment.setDueDate(firstDueDate.plusDays(30L * i));
            installment.setAmount(installmentValue);
            installment.setPaid(false);
            generated.add(installment);
        }
        return generated;
    }

    private BillingContractSummaryDTO toSummary(BillingContract contract) {
        return new BillingContractSummaryDTO(
                contract.getId(),
                contract.getContractNumber(),
                contract.getStatus(),
                contract.getPaidAt(),
                contract.getStartDate(),
                contract.getInstallmentValue(),
                contract.getInstallmentsTotal(),
                toCustomer(contract),
                contract.getCreatedAt());
    }

    private BillingContractDetailsDTO toDetails(
            BillingContract contract,
            List<BillingInstallment> installments,
            List<BillingOccurrence> occurrences) {
        BigDecimal outstandingBalance = calculateOutstandingBalance(contract, installments);
        BigDecimal remainingBalance = calculateRemainingBalance(outstandingBalance, installments);
        List<BillingContractSummaryDTO> otherContracts = contractRepository
                .findByCustomerDocumentAndContractNumberNot(contract.getCustomerDocument(),
                        contract.getContractNumber())
                .stream()
                .map(this::toSummary)
                .toList();

        return new BillingContractDetailsDTO(
                contract.getId(),
                contract.getContractNumber(),
                contract.getProposalId(),
                contract.getStatus(),
                contract.getPaidAt(),
                contract.getStartDate(),
                contract.getFinancedValue(),
                contract.getInstallmentValue(),
                contract.getInstallmentsTotal(),
                outstandingBalance,
                remainingBalance,
                toCustomer(contract),
                toProfessionalData(contract),
                toVehicle(contract),
                toDealer(contract),
                installments.stream().map(this::toInstallment).toList(),
                occurrences.stream().map(this::toOccurrence).toList(),
                otherContracts,
                contract.getCreatedAt(),
                contract.getUpdatedAt());
    }

    private BillingCustomerDTO toCustomer(BillingContract contract) {
        return new BillingCustomerDTO(
                contract.getCustomerName(),
                contract.getCustomerDocument(),
                contract.getCustomerBirthDate(),
                contract.getCustomerEmail(),
                contract.getCustomerPhone(),
                contract.getCustomerAddress(),
                contract.getCustomerCity(),
                contract.getCustomerState());
    }

    private BillingVehicleDTO toVehicle(BillingContract contract) {
        return new BillingVehicleDTO(
                contract.getVehicleBrand(),
                contract.getVehicleModel(),
                contract.getVehicleYear(),
                contract.getVehiclePlate(),
                contract.getVehicleRenavam(),
                contract.getDutIssued(),
                contract.getDutPaid(),
                contract.getDutPaidDate());
    }

    private BillingProfessionalDataDTO toProfessionalData(BillingContract contract) {
        return new BillingProfessionalDataDTO(
                contract.getProfessionalEnterprise(),
                contract.getProfessionalFunction(),
                contract.getProfessionalAdmissionDate(),
                contract.getProfessionalIncome(),
                contract.getProfessionalOtherIncomes(),
                contract.getProfessionalMaritalStatus());
    }

    private BillingDealerDTO toDealer(BillingContract contract) {
        if (contract.getProposalId() == null) {
            return null;
        }
        return proposalRepository.findById(contract.getProposalId())
                .map(proposal -> proposal.getDealer())
                .map(dealer -> new BillingDealerDTO(
                        dealer.getId(),
                        dealer.getEnterprise(),
                        dealer.getFullNameEnterprise(),
                        dealer.getCnpj(),
                        dealer.getPhone()))
                .orElse(null);
    }

    private BillingInstallmentDTO toInstallment(BillingInstallment installment) {
        return new BillingInstallmentDTO(
                installment.getNumber(),
                installment.getDueDate(),
                installment.getAmount(),
                installment.isPaid(),
                installment.getPaidAt(),
                calculateDaysLate(installment));
    }

    private BillingOccurrenceDTO toOccurrence(BillingOccurrence occurrence) {
        return new BillingOccurrenceDTO(
                occurrence.getId(),
                occurrence.getDate(),
                occurrence.getContact(),
                occurrence.getNote(),
                occurrence.getCreatedAt());
    }

    private String normalizeFilter(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Map<String, Object> parseMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(metadata, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }

    private String resolveContractNumber(Map<String, Object> metadata, Long proposalId) {
        String fromMetadata = resolveString(metadata, "contractNumber", "numeroContrato", "operacao", "numeroContrato");
        if (fromMetadata != null && !fromMetadata.isBlank()) {
            return fromMetadata;
        }

        SecureRandom random = new SecureRandom();
        String contractNumber;
        int attempts = 0;
        do {
            long randomNumber = 1000000000L + (long) (random.nextDouble() * 9000000000L);
            contractNumber = String.valueOf(randomNumber);
            attempts++;
            if (attempts > 100) {
                contractNumber = String.valueOf(System.currentTimeMillis() % 10000000000L);
                break;
            }
        } while (contractRepository.findByContractNumber(contractNumber).isPresent());

        return contractNumber;
    }

    private String resolveString(Map<String, Object> metadata, String... keys) {
        for (String key : keys) {
            Object value = metadata.get(key);
            if (value != null) {
                String str = String.valueOf(value).trim();
                if (!str.isEmpty()) {
                    return str;
                }
            }
        }
        return null;
    }

    private BigDecimal resolveBigDecimal(Map<String, Object> metadata, String... keys) {
        for (String key : keys) {
            Object value = metadata.get(key);
            if (value instanceof Number number) {
                return new BigDecimal(number.toString());
            }
            if (value instanceof String str && !str.isBlank()) {
                try {
                    return new BigDecimal(str);
                } catch (Exception ignored) {
                    // ignore parse error
                }
            }
        }
        return null;
    }

    private Integer resolveInteger(Map<String, Object> metadata, String... keys) {
        for (String key : keys) {
            Object value = metadata.get(key);
            if (value instanceof Number number) {
                return number.intValue();
            }
            if (value instanceof String str && !str.isBlank()) {
                try {
                    return Integer.parseInt(str);
                } catch (Exception ignored) {
                }
            }
        }
        return null;
    }

    private Boolean resolveBoolean(Map<String, Object> metadata, String... keys) {
        for (String key : keys) {
            Object value = metadata.get(key);
            if (value instanceof Boolean bool) {
                return bool;
            }
            if (value instanceof Number number) {
                return number.intValue() != 0;
            }
            if (value instanceof String str && !str.isBlank()) {
                String normalized = str.trim().toLowerCase();
                if (normalized.equals("true") || normalized.equals("sim") || normalized.equals("1")) {
                    return true;
                }
                if (normalized.equals("false") || normalized.equals("nao") || normalized.equals("0")) {
                    return false;
                }
            }
        }
        return null;
    }

    private LocalDate resolveDate(Map<String, Object> metadata, String... keys) {
        for (String key : keys) {
            Object value = metadata.get(key);
            if (value instanceof String str && !str.isBlank()) {
                LocalDate parsed = parseDate(str);
                if (parsed != null) {
                    return parsed;
                }
            }
        }
        return null;
    }

    private BigDecimal calculateOutstandingBalance(
            BillingContract contract,
            List<BillingInstallment> installments) {
        if (installments != null && !installments.isEmpty()) {
            BigDecimal total = BigDecimal.ZERO;
            for (BillingInstallment installment : installments) {
                if (installment.getAmount() != null) {
                    total = total.add(installment.getAmount());
                }
            }
            return total;
        }

        BigDecimal installmentValue = contract.getInstallmentValue();
        Integer installmentsTotal = contract.getInstallmentsTotal();
        if (installmentValue == null || installmentsTotal == null) {
            return BigDecimal.ZERO;
        }
        return installmentValue.multiply(BigDecimal.valueOf(installmentsTotal));
    }

    private BigDecimal calculateRemainingBalance(
            BigDecimal outstandingBalance,
            List<BillingInstallment> installments) {
        BigDecimal paidTotal = BigDecimal.ZERO;
        if (installments != null && !installments.isEmpty()) {
            for (BillingInstallment installment : installments) {
                if (installment.isPaid() && installment.getAmount() != null) {
                    paidTotal = paidTotal.add(installment.getAmount());
                }
            }
        }
        BigDecimal total = outstandingBalance != null ? outstandingBalance : BigDecimal.ZERO;
        BigDecimal remaining = total.subtract(paidTotal);
        return remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining;
    }

    private Integer calculateDaysLate(BillingInstallment installment) {
        if (installment == null || installment.getDueDate() == null) {
            return 0;
        }
        LocalDate referenceDate = installment.isPaid()
                ? (installment.getPaidAt() != null ? installment.getPaidAt() : LocalDate.now())
                : LocalDate.now();
        long daysLate = ChronoUnit.DAYS.between(installment.getDueDate(), referenceDate);
        return daysLate > 0 ? (int) daysLate : 0;
    }

    private LocalDate parseDate(String value) {
        List<DateTimeFormatter> formats = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        for (DateTimeFormatter formatter : formats) {
            try {
                return LocalDate.parse(value, formatter);
            } catch (Exception ignored) {
                // try next format
            }
        }
        return null;
    }

    private String buildAddress(String address, String number, String complement) {
        StringBuilder builder = new StringBuilder();
        if (address != null && !address.isBlank()) {
            builder.append(address.trim());
        }
        if (number != null && !number.isBlank()) {
            if (!builder.isEmpty())
                builder.append(", ");
            builder.append(number.trim());
        }
        if (complement != null && !complement.isBlank()) {
            if (!builder.isEmpty())
                builder.append(" ");
            builder.append(complement.trim());
        }
        return builder.length() == 0 ? null : builder.toString();
    }
}
