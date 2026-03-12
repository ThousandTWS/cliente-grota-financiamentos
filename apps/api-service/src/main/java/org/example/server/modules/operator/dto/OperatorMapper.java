package org.example.server.modules.operator.dto;

import org.example.server.shared.address.dto.AddressMapper;
import org.example.server.modules.operator.model.Operator;
import org.example.server.modules.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class OperatorMapper {

    private final AddressMapper addressMapper;

    public OperatorMapper(AddressMapper addressMapper) {
        this.addressMapper = addressMapper;
    }

    public OperatorResponseDTO toDTO(Operator operator) {
        return toDTO(operator, null);
    }

    /**
     * Maps Operator to DTO with optional generated password.
     * 
     * @param operator          the operator entity
     * @param generatedPassword the auto-generated password (only at creation time)
     */
    public OperatorResponseDTO toDTO(Operator operator, String generatedPassword) {
        if (operator == null) {
            return null;
        }

        User user = operator.getUser();

        return new OperatorResponseDTO(
                operator.getId(),
                operator.getDealer() != null ? operator.getDealer().getId() : null,
                operator.getDealerIds(),
                user.getFullName(),
                user.getEmail(),
                operator.getPhone(),
                operator.getCPF(),
                operator.getBirthData(),
                user.getVerificationStatus(),
                operator.getCreatedAt(),
                operator.getCanView(),
                operator.getCanCreate(),
                operator.getCanUpdate(),
                operator.getCanDelete(),
                operator.getCanChangeProposalStatus(),
                generatedPassword);
    }

    public Operator toEntity(OperatorRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        Operator operator = new Operator(
                dto.phone(),
                dto.CPF(),
                dto.birthData(),
                addressMapper.toEntity(dto.address()));
        return operator;
    }
}

