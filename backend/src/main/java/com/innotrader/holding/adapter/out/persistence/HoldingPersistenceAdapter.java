package com.innotrader.holding.adapter.out.persistence;

import com.innotrader.common.annotation.PersistenceAdapter;
import com.innotrader.holding.domain.model.Holding;
import com.innotrader.holding.domain.port.out.HoldingPort;

import java.util.List;
import java.util.UUID;

/**
 * Persistence adapter implementing {@link HoldingPort}.
 */
@PersistenceAdapter
public class HoldingPersistenceAdapter implements HoldingPort {

    private final HoldingJpaRepository repository;

    public HoldingPersistenceAdapter(HoldingJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Holding> findByAccount(UUID userId, String accountNo) {
        return repository.findByUserIdAndAccountNoOrderBySymbolAsc(userId, accountNo).stream()
                .map(HoldingJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Holding save(Holding holding) {
        return repository.save(HoldingJpaEntity.fromDomain(holding)).toDomain();
    }
}
