package com.innotrader.order.adapter.out.persistence;

import com.innotrader.order.domain.model.OrderStatus;
import com.innotrader.order.domain.model.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link OrderJpaEntity}.
 */
public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, UUID> {

    Optional<OrderJpaEntity> findByUserIdAndAccountNoAndOrderNo(UUID userId, String accountNo, String orderNo);

    List<OrderJpaEntity> findByUserIdAndAccountNoOrderByOrderedAtDesc(UUID userId, String accountNo);

    boolean existsByUserIdAndAccountNo(UUID userId, String accountNo);

    void deleteByUserIdAndAccountNo(UUID userId, String accountNo);

    List<OrderJpaEntity> findByOrderTypeAndStatusIn(OrderType orderType, List<OrderStatus> statuses);
}
