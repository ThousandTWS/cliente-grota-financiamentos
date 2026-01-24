package org.example.server.modules.user.dto;

import org.example.server.modules.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserRequestDTO dto) {
        User user = new User();
        user.setFullName(dto.fullName());
        user.setEmail(dto.email());
        user.setPassword(dto.password());
        return user;
    }

    public UserResponseDTO toDto(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getVerificationStatus(),
                user.getRole().name(),
                user.getCreatedAt(),
                user.getDealer() != null ? user.getDealer().getId() : null
        );
    }
}


