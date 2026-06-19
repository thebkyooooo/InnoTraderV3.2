package com.innotrader.account.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link AccountJpaEntity}.
 */
public interface AccountJpaRepository extends JpaRepository<AccountJpaEntity, UUID> {

    List<AccountJpaEntity> findByUserIdOrderByAccountNoAsc(UUID userId);

    Optional<AccountJpaEntity> findByUserIdAndAccountNo(UUID userId, String accountNo);
}
