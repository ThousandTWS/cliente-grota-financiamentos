package org.example.server.dto;

import org.example.server.enums.UserRole;

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
                /**
                 * Dealer ID for GESTOR role (manager's store).
                 */
                Long dealerId,
                /**
                 * List of allowed dealer IDs for OPERADOR role.
                 */
                List<Long> allowedDealerIds,
                /**
                 * Count of allowed dealers for OPERADOR role.
                 */
                Integer allowedDealersCount) {
}
