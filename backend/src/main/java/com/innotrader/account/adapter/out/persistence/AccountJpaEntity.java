package com.innotrader.account.adapter.out.persistence;

import com.innotrader.account.domain.model.SecuritiesAccount;
import com.innotrader.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

/**
 * JPA entity for the {@code securities_accounts} table.
 */
@Entity
@Table(name = "securities_accounts")
public class AccountJpaEntity extends BaseEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_no", nullable = false, length = 30)
    private String accountNo;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Column(name = "type_code", nullable = false, length = 10)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 50)
    private String typeName;

    @Column(name = "orderable_amount", nullable = false)
    private long orderableAmount;

    protected AccountJpaEntity() {}

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getAccountNo() { return accountNo; }
    public String getAccountName() { return accountName; }
    public String getTypeCode() { return typeCode; }
    public String getTypeName() { return typeName; }
    public long getOrderableAmount() { return orderableAmount; }

    private AccountJpaEntity(UUID id, UUID userId, String accountNo, String accountName,
                            String typeCode, String typeName, long orderableAmount) {
        this.id = id;
        this.userId = userId;
        this.accountNo = accountNo;
        this.accountName = accountName;
        this.typeCode = typeCode;
        this.typeName = typeName;
        this.orderableAmount = orderableAmount;
    }

    public SecuritiesAccount toDomain() {
        return new SecuritiesAccount(id, userId, accountNo, accountName, typeCode, typeName, orderableAmount);
    }

    public static AccountJpaEntity fromDomain(SecuritiesAccount a) {
        return new AccountJpaEntity(a.id(), a.userId(), a.accountNo(), a.accountName(),
                a.typeCode(), a.typeName(), a.orderableAmount());
    }
}
