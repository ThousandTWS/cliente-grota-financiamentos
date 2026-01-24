package org.example.server.modules.manager.repository;

import org.example.server.modules.manager.model.Manager;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManagerRepository extends JpaRepository<Manager, Long> {
    boolean existsByPhone(String phone);
    List<Manager> findByDealerId(Long dealerId);
    java.util.Optional<Manager> findByUserId(Long userId);
}


