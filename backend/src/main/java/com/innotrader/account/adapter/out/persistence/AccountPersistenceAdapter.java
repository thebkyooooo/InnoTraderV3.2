package com.innotrader.account.adapter.out.persistence;

import com.innotrader.account.domain.model.SecuritiesAccount;
import com.innotrader.account.domain.port.out.AccountPort;
import com.innotrader.common.annotation.PersistenceAdapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence adapter implementing {@link AccountPort}.
 */
@PersistenceAdapter
public class AccountPersistenceAdapter implements AccountPort {

    private final AccountJpaRepository repository;

    public AccountPersistenceAdapter(AccountJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<SecuritiesAccount> findAll(UUID userId) {
        return repository.findByUserIdOrderByAccountNoAsc(userId).stream()
                .map(AccountJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<SecuritiesAccount> find(UUID userId, String accountNo) {
        return repository.findByUserIdAndAccountNo(userId, accountNo)
                .map(AccountJpaEntity::toDomain);
    }

    @Override
    public SecuritiesAccount save(SecuritiesAccount account) {
        return repository.save(AccountJpaEntity.fromDomain(account)).toDomain();
    }
}
