package com.innotrader.order.adapter.in.web.dto;

import java.time.Instant;

/**
 * 계좌 활동 알림 (주문 접수/정정/취소/체결). 구독 채널: {@code /topic/account/activity/{accountNo}}.
 *
 * <p>페이로드 자체에 최신 데이터를 싣지 않고 "무언가 바뀌었다"는 신호만 전달한다.
 * 클라이언트는 이 메시지를 받으면 주문내역/보유종목 REST를 재조회(react-query invalidate)해
 * 종목명 조회·포맷팅 로직을 서버-클라이언트 이중 구현하지 않고 REST 응답을 단일 진실 소스로 유지한다.
 */
public record AccountActivityMessage(
        String accountNo,
        String orderNo,
        String symbol,
        String reason,   // ORDER_RECEIVED | ORDER_AMENDED | ORDER_CANCELED | ORDER_FILLED
        Instant at
) {}
