package com.innotrader.holding.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link HoldingJpaEntity}.
 */
public interface HoldingJpaRepository extends JpaRepository<HoldingJpaEntity, UUID> {

    List<HoldingJpaEntity> findByUserIdAndAccountNoOrderBySymbolAsc(UUID userId, String accountNo);
}
