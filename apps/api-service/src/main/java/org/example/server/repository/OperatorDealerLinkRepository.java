package org.example.server.repository;

import org.example.server.model.OperatorDealerLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorDealerLinkRepository extends JpaRepository<OperatorDealerLink, Long> {

    List<OperatorDealerLink> findByOperatorId(Long operatorId);

    @Query("SELECT odl.dealer.id FROM OperatorDealerLink odl WHERE odl.operator.id = :operatorId")
    List<Long> findDealerIdsByOperatorId(@Param("operatorId") Long operatorId);

    @Query("SELECT odl.dealer.id FROM OperatorDealerLink odl WHERE odl.operator.user.id = :userId")
    List<Long> findDealerIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT odl.operator FROM OperatorDealerLink odl WHERE odl.dealer.id = :dealerId")
    List<org.example.server.model.Operator> findOperatorsByDealerId(@Param("dealerId") Long dealerId);

    void deleteByOperatorId(Long operatorId);

    boolean existsByOperatorIdAndDealerId(Long operatorId, Long dealerId);
}
