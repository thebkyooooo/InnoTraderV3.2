package com.innotrader.account.adapter.in.web.dto;

/** 주문가능금액 응답 (계좌번호/주문가능금액). */
public record OrderableAmountResponse(String accountNo, long orderableAmount) {}
