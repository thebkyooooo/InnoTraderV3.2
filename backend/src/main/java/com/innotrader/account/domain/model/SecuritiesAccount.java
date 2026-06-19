package com.innotrader.account.domain.model;

import java.util.UUID;

/**
 * 증권계좌 도메인 모델. 계좌번호/계좌명/계좌유형 및 주문가능금액을 보유한다.
 */
public record SecuritiesAccount(
        UUID   id,
        UUID   userId,
        String accountNo,        // 계좌번호 (예: 123-456789-01)
        String accountName,      // 계좌명
        String typeCode,         // 계좌유형코드 (01/02/05/11/61/71)
        String typeName,         // 계좌유형 (종합/주식/CMA/해외주식/연금저축/ISA)
        long   orderableAmount   // 주문가능금액
) {
    public static SecuritiesAccount create(UUID userId, String accountNo, String accountName,
                                           String typeCode, String typeName, long orderableAmount) {
        return new SecuritiesAccount(UUID.randomUUID(), userId, accountNo, accountName, typeCode, typeName, orderableAmount);
    }
}
