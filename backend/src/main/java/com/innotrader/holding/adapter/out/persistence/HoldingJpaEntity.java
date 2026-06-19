package com.innotrader.holding.adapter.out.persistence;

import com.innotrader.common.domain.BaseEntity;
import com.innotrader.holding.domain.model.Holding;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

import static lombok.AccessLevel.PROTECTED;

/**
 * JPA entity for the {@code holdings} table.
 */
@Entity
@Table(name = "holdings")
@Getter
@NoArgsConstructor(access = PROTECTED)
public class HoldingJpaEntity extends BaseEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_no", nullable = false, length = 30)
    private String accountNo;

    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    @Column(name = "quantity", nullable = false)
    private long quantity;

    @Column(name = "avg_price", nullable = false)
    private long avgPrice;

    private HoldingJpaEntity(UUID id, UUID userId, String accountNo, String symbol, long quantity, long avgPrice) {
        this.id = id;
        this.userId = userId;
        this.accountNo = accountNo;
        this.symbol = symbol;
        this.quantity = quantity;
        this.avgPrice = avgPrice;
    }

    public Holding toDomain() {
        return new Holding(id, userId, accountNo, symbol, quantity, avgPrice);
    }

    public static HoldingJpaEntity fromDomain(Holding h) {
        return new HoldingJpaEntity(h.id(), h.userId(), h.accountNo(), h.symbol(), h.quantity(), h.avgPrice());
    }
}
