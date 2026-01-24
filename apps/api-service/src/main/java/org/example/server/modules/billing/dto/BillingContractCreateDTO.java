package org.example.server.modules.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.example.server.modules.billing.model.BillingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BillingContractCreateDTO(
        @NotBlank(message = "O numero do contrato e obrigatorio")
        String contractNumber,

        Long proposalId,

        @NotNull(message = "O status e obrigatorio")
        BillingStatus status,

        @NotNull(message = "A data de pagamento e obrigatoria")
        LocalDate paidAt,

        @NotNull(message = "A data base e obrigatoria")
        LocalDate startDate,

        @NotNull(message = "O valor financiado e obrigatorio")
        @DecimalMin(value = "0.0", message = "O valor financiado deve ser positivo")
        BigDecimal financedValue,

        @NotNull(message = "O valor da parcela e obrigatorio")
        @DecimalMin(value = "0.0", message = "O valor da parcela deve ser positivo")
        BigDecimal installmentValue,

        @NotNull(message = "O total de parcelas e obrigatorio")
        @Min(value = 1, message = "O total de parcelas deve ser maior que zero")
        Integer installmentsTotal,

        LocalDate firstDueDate,

        @NotBlank(message = "O nome do cliente e obrigatorio")
        String customerName,

        @NotBlank(message = "O documento do cliente e obrigatorio")
        String customerDocument,

        LocalDate customerBirthDate,
        String customerEmail,
        String customerPhone,
        String customerAddress,
        String customerCity,
        String customerState,

        String professionalEnterprise,
        String professionalFunction,
        LocalDate professionalAdmissionDate,
        BigDecimal professionalIncome,
        BigDecimal professionalOtherIncomes,
        String professionalMaritalStatus,

        String vehicleBrand,
        String vehicleModel,
        Integer vehicleYear,
        String vehiclePlate,
        String vehicleRenavam,
        Boolean dutIssued,

        @Valid
        List<BillingInstallmentInputDTO> installments
) {
}


