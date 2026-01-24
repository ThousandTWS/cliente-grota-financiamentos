package org.example.server.modules.operator.repository;

import org.example.server.modules.operator.model.Operator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OperatorRepository extends JpaRepository<Operator, Long> {
    boolean existsByPhone(String phone);
    List<Operator> findByDealerId(Long dealerId);
    java.util.Optional<Operator> findByUserId(Long userId);
}


