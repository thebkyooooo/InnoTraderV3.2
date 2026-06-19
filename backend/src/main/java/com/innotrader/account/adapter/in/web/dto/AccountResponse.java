package com.innotrader.account.adapter.in.web.dto;

import com.innotrader.account.domain.model.SecuritiesAccount;

/** 계좌목록 응답 (계좌번호/계좌명/계좌유형코드/계좌유형). */
public record AccountResponse(String accountNo, String accountName, String typeCode, String typeName) {

    public static AccountResponse from(SecuritiesAccount a) {
        return new AccountResponse(a.accountNo(), a.accountName(), a.typeCode(), a.typeName());
    }
}
