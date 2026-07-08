package com.innotrader.order.adapter.out.persistence;

import com.innotrader.common.annotation.PersistenceAdapter;
import com.innotrader.order.domain.model.Order;
import com.innotrader.order.domain.model.OrderStatus;
import com.innotrader.order.domain.model.OrderType;
import com.innotrader.order.domain.port.out.OrderPort;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence adapter implementing {@link OrderPort}.
 */
@PersistenceAdapter
public class OrderPersistenceAdapter implements OrderPort {

    private final OrderJpaRepository repository;

    public OrderPersistenceAdapter(OrderJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Order save(Order order) {
        return repository.save(OrderJpaEntity.fromDomain(order)).toDomain();
    }

    @Override
    public Optional<Order> findByOrderNo(UUID userId, String accountNo, String orderNo) {
        return repository.findByUserIdAndAccountNoAndOrderNo(userId, accountNo, orderNo)
                .map(OrderJpaEntity::toDomain);
    }

    @Override
    public List<Order> findByAccount(UUID userId, String accountNo) {
        return repository.findByUserIdAndAccountNoOrderByOrderedAtDesc(userId, accountNo).stream()
                .map(OrderJpaEntity::toDomain)
                .toList();
    }

    @Override
    public boolean existsByAccount(UUID userId, String accountNo) {
        return repository.existsByUserIdAndAccountNo(userId, accountNo);
    }

    @Override
    public void deleteByAccount(UUID userId, String accountNo) {
        repository.deleteByUserIdAndAccountNo(userId, accountNo);
    }

    @Override
    public String nextOrderNo() {
        return String.format("%010d", repository.count() + 1);
    }

    @Override
    public List<Order> findActiveLimitOrders(Instant orderedAtFromInclusive) {
        return repository.findByOrderTypeAndStatusInAndOrderedAtGreaterThanEqual(
                        OrderType.LIMIT, List.of(OrderStatus.RECEIVED, OrderStatus.PARTIAL), orderedAtFromInclusive).stream()
                .map(OrderJpaEntity::toDomain)
                .toList();
    }
}
