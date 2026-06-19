package com.innotrader.order.domain.port.out;

import com.innotrader.order.domain.model.Order;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Outbound port: 주문 영속성.
 */
public interface OrderPort {

    Order save(Order order);

    /** 원주문번호로 단일 주문 조회 (접수증 제외 — 원주문만). */
    Optional<Order> findByOrderNo(UUID userId, String accountNo, String orderNo);

    /** 계좌별 주문 전체 (주문일시 내림차순). */
    List<Order> findByAccount(UUID userId, String accountNo);

    /** 계좌별 주문 존재 여부 (시드 멱등 판단용). */
    boolean existsByAccount(UUID userId, String accountNo);

    /** 계좌별 주문 전체 삭제 (재시드용). */
    void deleteByAccount(UUID userId, String accountNo);

    /** 다음 주문번호 발번. */
    String nextOrderNo();
}
