package org.example.server.modules.auth.dto;

import org.example.server.modules.user.model.UserRole;

import java.util.List;

public record UserResponseDTO(
                Long id,
                String email,
                String fullName,
                UserRole role,
                Boolean canView,
                Boolean canCreate,
                Boolean canUpdate,
                Boolean canDelete,
      
                Long dealerId,
         
                List<Long> allowedDealerIds,

                Integer allowedDealersCount) {
}


