package com.innotrader.account.adapter.in.web.dto;

import com.innotrader.account.domain.port.in.AccountUseCase.OrderableShares;

/** 주문가능수량 응답 (계좌번호/종목코드/종목명/주문가능수량). */
public record OrderableSharesResponse(String accountNo, String symbol, String name, long orderableShares) {

    public static OrderableSharesResponse from(OrderableShares s) {
        return new OrderableSharesResponse(s.accountNo(), s.symbol(), s.name(), s.shares());
    }
}
