package com.innotrader.account.domain.port.out;

import com.innotrader.account.domain.model.SecuritiesAccount;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Outbound port: 증권계좌 영속성.
 */
public interface AccountPort {

    List<SecuritiesAccount> findAll(UUID userId);

    Optional<SecuritiesAccount> find(UUID userId, String accountNo);

    SecuritiesAccount save(SecuritiesAccount account);
}
